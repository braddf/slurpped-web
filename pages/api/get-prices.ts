import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
