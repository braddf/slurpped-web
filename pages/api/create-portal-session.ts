import { NextApiResponse } from "next";
import Stripe from "stripe";
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { NextApiRequestWithDB } from "./user";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

export default withIronSessionApiRoute(async (req: NextApiRequestWithDB, res: NextApiResponse) => {
  if (!req.session.user?.isLoggedIn) return res.status(401).json({ message: "Not logged in" });

  const customerId = req.session.user.customerId;
  if (!customerId) return res.status(400).json({ message: "No Stripe customer found for this account" });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.APP_URL}/account/orders`
  });

  res.json({ url: portalSession.url });
}, sessionOptions);
