import { NextApiHandler } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import * as Sentry from "@sentry/nextjs";
import { OrderItem } from "../../types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

type CheckoutItem = OrderItem & { name: string; stripeProductId: string; priceInPence: number };

const subscribe: NextApiHandler = withIronSessionApiRoute(async (req, res) => {
  if (!req.session.user?.isLoggedIn) return;

  const {
    items,
    quantity,
    deliverySlot,
    deliveryAddress,
    notes
  }: {
    items: CheckoutItem[];
    quantity: number;
    deliverySlot: string;
    deliveryAddress: { line1: string; line2?: string; city: string; postcode: string };
    notes?: string;
  } = req.body;

  if (!deliverySlot)
    return res.status(400).json({ message: "Delivery slot is required" });
  if (!deliveryAddress?.line1 || !deliveryAddress?.city || !deliveryAddress?.postcode)
    return res.status(400).json({ message: "Delivery address is required" });
  if (!items?.length) return res.status(400).json({ message: "At least one product is required" });
  if (!quantity) return res.status(400).json({ message: "Quantity is required" });

  const productSummary = items
    .map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name))
    .join(" + ");

  Sentry.captureMessage(
    `deliverySlot: ${deliverySlot}, deliveryAddress: ${deliveryAddress.postcode}, items: ${productSummary}, quantity: ${quantity}, notes: ${notes}`,
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
        currency: "gbp",
        product: item.stripeProductId,
        unit_amount: item.priceInPence
      },
      quantity: item.quantity
    })),
    metadata: {
      deliverySlot,
      deliveryAddress: JSON.stringify({ ...deliveryAddress, country: "GB" }),
      product: productSummary,
      items: JSON.stringify(itemsForMetadata),
      quantity,
      notes: notes || ""
    },
    currency: "gbp",
    mode: "payment"
  });

  res.send({ url: checkoutSession.url });
}, sessionOptions);

export default subscribe;
