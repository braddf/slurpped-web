import { NextApiHandler } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

const subscribe: NextApiHandler = withIronSessionApiRoute(async (req, res) => {
  console.log("req.body", req.body);
  if (!req.session.user?.isLoggedIn) return;

  const { priceId } = req.body;
  const now = new Date();
  const tuesday12AM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + ((2 + 7 - now.getDay()) % 7),
    0,
    0,
    0
  );
  const newSubscription = await stripe.subscriptions.create({
    customer: req.session.user?.customerId,
    items: [
      {
        price: priceId
      }
    ],
    proration_behavior: "none",
    trial_end: tuesday12AM.getTime() / 1000
  });

  res.send(newSubscription);
}, sessionOptions);

export default subscribe;
