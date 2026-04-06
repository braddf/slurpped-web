import { NextApiHandler } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

/** Returns Unix timestamp (seconds) of the next Sunday at midnight UTC. */
function nextSundayMidnightUtc(): number {
  const now = new Date();
  const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7; // always at least 1 day ahead
  const sunday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday, 0, 0, 0));
  return Math.floor(sunday.getTime() / 1000);
}

const subscribe: NextApiHandler = withIronSessionApiRoute(async (req, res) => {
  if (!req.session.user?.isLoggedIn) return res.status(401).json({ message: "Not logged in" });

  const {
    priceId,
    productSlug,
    deliveryDayPreference,
    deliveryAddress
  }: {
    priceId: string;
    productSlug: string;
    deliveryDayPreference: "thursday" | "friday" | "saturday";
    deliveryAddress: { line1: string; line2?: string; city: string; postcode: string };
  } = req.body;

  if (!priceId) return res.status(400).json({ message: "priceId is required" });
  if (!productSlug) return res.status(400).json({ message: "productSlug is required" });
  if (!deliveryDayPreference)
    return res.status(400).json({ message: "deliveryDayPreference is required" });
  if (!deliveryAddress?.line1 || !deliveryAddress?.city || !deliveryAddress?.postcode)
    return res.status(400).json({ message: "Delivery address is required" });

  Sentry.captureMessage(
    `Subscription checkout: productSlug=${productSlug}, deliveryDayPreference=${deliveryDayPreference}, postcode=${deliveryAddress.postcode}`,
    { level: "info", user: req.session.user }
  );

  const checkoutSession = await stripe.checkout.sessions.create({
    success_url: `${process.env.APP_URL}/account/orders?status=subscribeSuccess`,
    cancel_url: `${process.env.APP_URL}/order?status=cancelled`,
    customer: req.session.user?.customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    subscription_data: {
      // Align all subscriptions to bill at Sunday midnight, so everyone is charged
      // on the same day each week regardless of when they subscribed.
      // First payment is taken immediately at checkout; the anchor only affects renewal timing.
      billing_cycle_anchor: nextSundayMidnightUtc(),
      proration_behavior: "none",
      metadata: {
        productSlug,
        deliveryDayPreference,
        deliveryAddress: JSON.stringify({ ...deliveryAddress, country: "GB" }),
        userId: req.session.user.userId ?? ""
      }
    },
    metadata: {
      productSlug,
      deliveryDayPreference,
      deliveryAddress: JSON.stringify({ ...deliveryAddress, country: "GB" }),
      userId: req.session.user.userId ?? ""
    }
  });

  res.send({ url: checkoutSession.url });
}, sessionOptions);

export default subscribe;
