import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { buffer } from "micro";
import { createClient } from "@sanity/client";
import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import connectionHandler from "../../lib/connection-handler";
import { Model } from "objection";
import User from "../../models/User";
import { NextApiRequestWithDB } from "./user";
import Order from "../../models/Order";
import Subscription from "../../models/Subscription";

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false
  }
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia"
});
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || ""
});

const sentFrom = new Sender(
  process.env.MAILERSEND_FROM_EMAIL || "info@slurpped.co.uk",
  process.env.NEXT_PUBLIC_BRAND_NAME || "Slurpp'd"
);

const DAY_NUMBERS: Record<string, number> = {
  thursday: 4,
  friday: 5,
  saturday: 6
};

/** Returns the timestamp (ms) of the next occurrence of the given delivery slot day, at 9am UTC. */
function getNextDeliveryDate(slot: string): number {
  const targetDay = DAY_NUMBERS[slot] ?? 4; // default thursday
  const now = new Date();
  const daysUntil = (targetDay + 7 - now.getUTCDay()) % 7 || 7; // always at least 1 day ahead
  const delivery = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntil,
    9, 0, 0, 0
  ));
  return delivery.getTime();
}

async function findUserByCustomerOrEmail(
  db: any,
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null,
  customerEmail?: string | null
): Promise<{ user: User | undefined; email: string | undefined }> {
  Model.knex(db);

  if (customerId && typeof customerId === "string") {
    const user = await User.query().findOne({ customerId });
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return { user, email: user?.email };
    return { user, email: (customer as Stripe.Customer).email ?? user?.email };
  }

  if (customerEmail) {
    const user = await User.query().findOne({ email: customerEmail.toLowerCase() });
    return { user, email: user?.email };
  }

  return { user: undefined, email: undefined };
}

async function sendOrderConfirmationEmail(
  email: string,
  firstName: string,
  deliveryDate: Date,
  deliverySlot: string,
  deliveryAddress: { line1: string; line2?: string; city: string; postcode: string; country: string },
  productName: string,
  quantity: number,
  notes: string
) {
  const formattedDate = deliveryDate.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const formattedAddress = [
    deliveryAddress.line1,
    deliveryAddress.line2,
    deliveryAddress.city,
    deliveryAddress.postcode
  ]
    .filter(Boolean)
    .join(", ");

  const recipients = [new Recipient(email, firstName || "Customer")];
  const variables = [
    {
      email,
      substitutions: [
        { var: "name", value: firstName || "Customer" },
        { var: "support_email", value: process.env.MAILERSEND_FROM_EMAIL || "info@slurpped.co.uk" },
        { var: "delivery_date", value: formattedDate },
        { var: "delivery_slot", value: deliverySlot },
        { var: "delivery_address", value: formattedAddress },
        { var: "quantity", value: String(quantity) },
        { var: "product", value: productName },
        { var: "notes", value: notes }
      ]
    }
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("Your Slurpp'd order is confirmed!")
    .setTemplateId("7dnvo4dmzrn45r86")
    .setVariables(variables);

  await mailerSend.email.send(emailParams);
}

async function sendPaymentFailedEmail(email: string, firstName: string) {
  const recipients = [new Recipient(email, firstName || "Customer")];
  const variables = [
    {
      email,
      substitutions: [
        { var: "name", value: firstName || "Customer" },
        { var: "support_email", value: process.env.MAILERSEND_FROM_EMAIL || "info@slurpped.co.uk" }
      ]
    }
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("Action required: your Slurpp'd payment failed")
    .setTemplateId("ynrw7gy0j9nl2k8e")
    .setVariables(variables);

  await mailerSend.email.send(emailParams);
}

const webhookRoute = async (req: NextApiRequestWithDB, res: NextApiResponse) => {
  let event = req.body;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (endpointSecret) {
    const signature = req.headers["stripe-signature"] || "";
    const buf = await buffer(req);
    try {
      event = stripe.webhooks.constructEvent(buf, signature, endpointSecret);
    } catch (err: any) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }
  }

  const now = new Date();

  switch (event.type) {
    case "checkout.session.completed": {
      const sess = event.data.object as Stripe.Checkout.Session;

      const { user, email } = await findUserByCustomerOrEmail(
        req.db,
        sess.customer,
        sess.customer_details?.email
      );
      if (!user || !email) {
        Sentry.captureMessage(`checkout.session.completed: user not found for session ${sess.id}`);
        break;
      }

      if (sess.mode === "payment") {
        // One-off purchase — create order immediately
        const existingOrder = await Order.query().findOne({ checkoutSessionId: sess.id });
        if (existingOrder) {
          Sentry.captureMessage(`Order already saved for session ${sess.id}`);
          break;
        }

        const deliverySlot = sess.metadata?.deliverySlot || "thursday";
        const deliveryAddress = sess.metadata?.deliveryAddress
          ? JSON.parse(sess.metadata.deliveryAddress)
          : { line1: "", city: "", postcode: "", country: "GB" };
        const productName = sess.metadata?.product || "";
        const quantity = Number(sess.metadata?.quantity) || 1;
        const notes = sess.metadata?.notes || "";
        const orderItems = JSON.parse(sess.metadata?.items || "[]");
        const deliveryDateTs = getNextDeliveryDate(deliverySlot);

        await Order.query().insert(
          Order.fromJson({
            userId: user.id,
            checkoutSessionId: sess.id,
            paymentIntentId: sess.payment_intent,
            status: sess.payment_status,
            paidAt: Math.round(now.getTime() / 1000),
            deliveryDate: deliveryDateTs,
            deliverySlot,
            deliveryAddress,
            product: productName,
            items: orderItems,
            quantity,
            total: sess.amount_total,
            notes,
            createdBy: user.id,
            updatedBy: user.id,
            orderType: "website",
            collected: false
          })
        );

        await sendOrderConfirmationEmail(
          email,
          user.firstName,
          new Date(deliveryDateTs),
          deliverySlot,
          deliveryAddress,
          productName,
          quantity,
          notes
        );
      } else if (sess.mode === "subscription") {
        // Subscription checkout completed — upsert subscription record.
        // The order itself is created by invoice.payment_succeeded.
        const stripeSubscriptionId =
          typeof sess.subscription === "string" ? sess.subscription : sess.subscription?.id;

        if (!stripeSubscriptionId) break;

        const productSlug = sess.metadata?.productSlug || "";
        const deliveryDayPreference = (sess.metadata?.deliveryDayPreference ||
          "thursday") as "thursday" | "friday" | "saturday";
        const deliveryAddress = sess.metadata?.deliveryAddress
          ? JSON.parse(sess.metadata.deliveryAddress)
          : { line1: "", city: "", postcode: "", country: "GB" };

        // Upsert subscription record — ignore conflict in case webhook fires twice
        try {
          await Subscription.query().insert(
            Subscription.fromJson({
              userId: user.id,
              stripeSubscriptionId,
              stripeCustomerId: typeof sess.customer === "string" ? sess.customer : "",
              productSlug,
              deliveryDayPreference,
              status: "active"
            })
          );
        } catch (e: any) {
          if (!e.message?.includes("unique")) throw e; // re-throw non-duplicate errors
        }

        // Save delivery address as user default if not already set
        if (!user.defaultDeliveryAddress && deliveryAddress.line1) {
          await User.query().patchAndFetchById(user.id, {
            defaultDeliveryAddress: deliveryAddress,
            defaultDeliverySlot: deliveryDayPreference
          });
        }
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) break; // one-off invoices handled via checkout.session.completed

      const stripeSubscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;

      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const meta = subscription.metadata;
      const productSlug = meta?.productSlug || "";
      const deliveryDayPreference = meta?.deliveryDayPreference || "thursday";
      const deliveryAddress = meta?.deliveryAddress
        ? JSON.parse(meta.deliveryAddress)
        : { line1: "", city: "", postcode: "", country: "GB" };
      const userId = meta?.userId || "";

      // Find user
      Model.knex(req.db);
      const user = userId
        ? await User.query().findById(userId)
        : await User.query().findOne({
            customerId: typeof invoice.customer === "string" ? invoice.customer : ""
          });

      if (!user) {
        Sentry.captureMessage(
          `invoice.payment_succeeded: user not found for subscription ${stripeSubscriptionId}`
        );
        break;
      }

      // Avoid duplicate orders for same invoice
      const existingOrder = await Order.query().findOne({ checkoutSessionId: invoice.id });
      if (existingOrder) break;

      const deliveryDateTs = getNextDeliveryDate(deliveryDayPreference);

      await Order.query().insert(
        Order.fromJson({
          userId: user.id,
          checkoutSessionId: invoice.id, // reuse field to store invoice ID for dedup
          paymentIntentId:
            typeof invoice.payment_intent === "string" ? invoice.payment_intent : undefined,
          status: "paid",
          paidAt: Math.round(now.getTime() / 1000),
          deliveryDate: deliveryDateTs,
          deliverySlot: deliveryDayPreference,
          deliveryAddress,
          product: productSlug,
          items: [],
          quantity: 1,
          total: invoice.amount_paid,
          notes: "",
          createdBy: user.id,
          updatedBy: user.id,
          orderType: "website",
          collected: false
        })
      );

      // Ensure subscription record is active
      await Subscription.query()
        .patch({ status: "active" })
        .where({ stripeSubscriptionId });

      await sendOrderConfirmationEmail(
        user.email,
        user.firstName,
        new Date(deliveryDateTs),
        deliveryDayPreference,
        deliveryAddress,
        productSlug,
        1,
        ""
      );
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) break;

      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      Model.knex(req.db);
      const user = await User.query().findOne({ customerId });
      if (!user) break;

      try {
        await sendPaymentFailedEmail(user.email, user.firstName);
      } catch (e) {
        Sentry.captureException(e);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const stripeSubscriptionId = sub.id;
      const newStatus =
        sub.status === "active" ? "active" : sub.status === "canceled" ? "cancelled" : "paused";

      const patch: Record<string, any> = { status: newStatus };

      // If the plan was switched via the portal, update productSlug and quantity
      const newPriceId = sub.items.data[0]?.price?.id;
      if (newPriceId) {
        const sanityClient = createClient({
          projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
          dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
          apiVersion: "2021-10-21",
          useCdn: false
        });
        const product = await sanityClient.fetch(
          `*[_type == "product" && stripePriceId == $priceId][0]{ "slug": slug.current }`,
          { priceId: newPriceId }
        );
        if (product?.slug) patch.productSlug = product.slug;
      }
      Model.knex(req.db);
      await Subscription.query().patch(patch).where({ stripeSubscriptionId });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      Model.knex(req.db);
      await Subscription.query()
        .patch({ status: "cancelled" })
        .where({ stripeSubscriptionId: sub.id });
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}.`);
  }

  res.status(200).json({ received: true });
};

export default connectionHandler()(webhookRoute);
