import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
  // Typically this is stored alongside the authenticated user in your database.
  const { session_id } = req.body;
  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

  const returnUrl = `${process.env.APP_URL}/account/orders`;

  if (!checkoutSession.customer || typeof checkoutSession.customer !== "string") {
    return res.status(400).json({ message: "No customer found for this session" });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: checkoutSession.customer,
    return_url: returnUrl
  });

  res.redirect(303, portalSession.url);
};
