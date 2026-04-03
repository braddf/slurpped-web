import { NextApiHandler } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import * as Sentry from "@sentry/nextjs";
import { OrderItem } from "../../types";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

type CheckoutItem = OrderItem & { name: string; stripeProductId: string; priceInCents: number };

const subscribe: NextApiHandler = withIronSessionApiRoute(async (req, res) => {
  if (!req.session.user?.isLoggedIn) return;

  const {
    items,
    quantity,
    collectionDate,
    collectionLocation,
    notes
  }: {
    items: CheckoutItem[];
    quantity: number;
    collectionDate: string;
    collectionLocation: string;
    notes?: string;
  } = req.body;

  if (!collectionDate) {
    Sentry.captureMessage(`Collection date is required, date given: ${collectionDate}`, {
      level: "info",
      user: req.session.user
    });
    return res.status(400).json({ message: "Collection date is required" });
  }
  if (!collectionLocation)
    return res.status(400).json({ message: "Collection location is required" });
  if (!items?.length) return res.status(400).json({ message: "At least one product is required" });
  if (!quantity) return res.status(400).json({ message: "Quantity is required" });

  const collectionDateObj = new Date(collectionDate);
  const collectionDateAt9am = new Date(
    collectionDateObj.getFullYear(),
    collectionDateObj.getMonth(),
    collectionDateObj.getDate(),
    9,
    0,
    0
  );

  const productSummary = items
    .map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name))
    .join(" + ");

  Sentry.captureMessage(
    `collectionDate: ${collectionDate}, collectionLocation: ${collectionLocation}, items: ${productSummary}, quantity: ${quantity}, notes: ${notes}`,
    { level: "info", user: req.session.user }
  );

  // Store items without Stripe-specific fields in metadata (Stripe metadata is string-only)
  // Only slug + quantity are stored — name is display-only and may differ per language
  const itemsForMetadata: OrderItem[] = items.map(({ slug, quantity }) => ({ slug, quantity }));

  const checkoutSession = await stripe.checkout.sessions.create({
    success_url: `${process.env.APP_URL}/account/orders?status=orderSuccess`,
    cancel_url: `${process.env.APP_URL}/order?status=cancelled`,
    customer: req.session.user?.customerId,
    line_items: items.map((item) => ({
      price_data: {
        currency: "eur",
        product: item.stripeProductId,
        unit_amount: item.priceInCents
      },
      quantity: item.quantity
    })),
    metadata: {
      collectionDate: collectionDateAt9am.getTime(),
      collectionLocation,
      product: productSummary,
      items: JSON.stringify(itemsForMetadata),
      quantity,
      notes: notes || ""
    },
    currency: "eur",
    mode: "payment"
  });

  res.send({ url: checkoutSession.url });
}, sessionOptions);

export default subscribe;
