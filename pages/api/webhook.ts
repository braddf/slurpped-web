import { NextApiRequest, NextApiResponse } from "next";

import Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia"
});
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || ""
});
import { buffer } from "micro";
import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import { getCookies } from "cookies-next";
import { createClient } from "@sanity/client";
import connectionHandler from "../../lib/connection-handler";
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { Model } from "objection";
import User from "../../models/User";
import { NextApiRequestWithDB } from "./user";
import Order from "../../models/Order";

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false
  }
};

const webhookRoute = async (req: NextApiRequestWithDB, res: NextApiResponse) => {
  let event = req.body;
  // Replace this endpoint secret with your endpoint's unique secret
  // If you are testing with the CLI, find the secret by running 'stripe listen'
  // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
  // at https://dashboard.stripe.com/webhooks
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = req.headers["stripe-signature"] || "";
    // console.log("signature", signature);
    const buf = await buffer(req);
    try {
      event = stripe.webhooks.constructEvent(buf, signature, endpointSecret);
      console.log(event.type);
    } catch (err: any) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.status(400);
    }
  }
  let subscription;
  let status;
  const now = new Date();
  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const sess = event.data.object;
      // console.log("session", sess);

      // Send email to customer
      let customer = sess.customer ? await stripe.customers.retrieve(sess.customer) : null;
      if (customer?.deleted === true) break;

      let user;
      let email;

      if (!customer && sess.customer_details?.email) {
        Model.knex(req.db);
        user = await User.query().findOne({ email: sess.customer_details.email.toLowerCase() });

        email = user?.email;
      } else {
        email = customer?.email;

        Model.knex(req.db);
        user = await User.query().findOne({
          customerId: customer?.id
        });
      }
      if (!user) break;
      if (!email) break;

      const { firstName } = user;
      const client = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
        apiVersion: "2021-10-21",
        token: process.env.SANITY_BOT_TOKEN
        // useCdn: true,
      });
      const query = `*[_type == "location" && name == "${sess.metadata.collectionLocation}"][0]`;
      const location = await client.fetch(query);
      const address = location?.address || "";
      const collectionTimes = location?.availableFrom
        ? `${location.availableFrom} - ${location.availableTo}`
        : "";

      const sentFrom = new Sender(
        process.env.MAILERSEND_FROM_EMAIL || "info@slurpped.co.uk",
        process.env.NEXT_PUBLIC_BRAND_NAME || "Slurpp'd"
      );
      const collectionDate = new Date(Number(sess.metadata.collectionDate));
      const collectionLocation = location?.longName || sess.metadata.collectionLocation;
      const directionsLink = location?.directionsLink || "https://goo.gl/maps";
      const quantity = sess.metadata.quantity || 1;
      const productName = sess.metadata.product || "";
      const orderItems = JSON.parse(sess.metadata.items || "[]");
      const notes = sess.metadata.notes || "";

      const lang = getCookies()["groentetas/lang"] || "en-gb";

      // Check for existing order from same checkout session
      const existingOrder = await Order.query().findOne({ checkoutSessionId: sess.id });

      if (existingOrder) {
        Sentry.captureMessage(`Order already saved for ${existingOrder.checkoutSessionId}`);
        return;
      }

      // Save order to database
      const newOrder = Order.fromJson({
        userId: user.id,
        checkoutSessionId: sess.id,
        paymentIntentId: sess.payment_intent,
        status: sess.payment_status,
        paidAt: Math.round(now.getTime() / 1000),
        collectionDate: collectionDate.getTime() / 1000,
        collectionLocation: collectionLocation,
        product: productName,
        items: orderItems,
        quantity: Number(quantity),
        total: sess.amount_total,
        notes: notes,
        createdBy: user.id,
        updatedBy: user.id,
        orderType: "website",
        collected: false
      });
      await Order.query().insert(newOrder);
      // }

      // Send email to customer
      const recipients = [new Recipient(email, firstName || "Customer")];
      const variables = [
        {
          email,
          substitutions: [
            {
              var: "name",
              value: firstName || "Customer"
            },
            {
              var: "support_email",
              value: process.env.MAILERSEND_FROM_EMAIL || "info@slurpped.co.uk"
            },
            {
              var: "collection_date",
              value: collectionDate.toLocaleDateString(lang, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })
            },
            {
              var: "quantity",
              value: quantity
            },
            {
              var: "product",
              value: productName
            },
            {
              var: "collection_address",
              value: address || ""
            },
            {
              var: "notes",
              value: notes
            },
            {
              var: "collection_times",
              value: collectionTimes
            },
            {
              var: "collection_location",
              value: collectionLocation
            },
            {
              var: "directions_link",
              value: directionsLink
            }
          ]
        }
      ];

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject("Order Confirmed")
        .setTemplateId("7dnvo4dmzrn45r86")
        .setVariables(variables);

      await mailerSend.email.send(emailParams);

      // Send email to admin?

      break;
    case "customer.subscription.trial_will_end":
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription trial ending.
      // handleSubscriptionTrialEnding(subscription);
      break;
    case "customer.subscription.deleted":
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription deleted.
      // handleSubscriptionDeleted(subscriptionDeleted);
      break;
    case "customer.subscription.created":
      subscription = event.data.object;
      status = subscription.status;
      const tuesday12AM = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + ((2 + 7 - now.getDay()) % 7),
        0,
        0,
        0
      );
      let date = new Date(subscription.billing_cycle_anchor * 1000);
      console.log(`Subscription status is ${status}.`);
      console.log(`Subscription billing anchor is ${date}.`);
      let updated = await stripe.subscriptions.update(subscription.id, {
        trial_end: tuesday12AM.getTime() / 1000,
        proration_behavior: "none"
      });
      console.log(
        `Subscription billing anchor is now ${new Date(updated.billing_cycle_anchor * 1000)}.`
      );
      // Then define and call a method to handle the subscription created.
      // handleSubscriptionCreated(subscription);
      break;
    case "customer.subscription.updated":
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription update.
      // handleSubscriptionUpdated(subscription);
      break;
    case "billing_portal.session.created":
      const session = event.data.object;
      console.log(`Billing portal session created: ${session.id}`);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }
  // Return a 200 res to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

export default connectionHandler()(withIronSessionApiRoute(webhookRoute, sessionOptions));
