import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

const getPrices: NextApiHandler = withIronSessionApiRoute(
  async (req: NextApiRequest, res: NextApiResponse) => {
    console.log("req.session.user1", req.session);
    // if (!req.session.user?.customerId) return;
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"]
    });

    res.send(prices);
  },
  sessionOptions
);
export default getPrices;
