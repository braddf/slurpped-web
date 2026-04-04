import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

const getInvoices: NextApiHandler = withIronSessionApiRoute(
  async (req: NextApiRequest, res: NextApiResponse) => {
    console.log("req.session.user1", req.session);
    if (req.session.user === undefined) {
      res.status(401).send("Unauthorized");
      return;
    }

    if (!("customerId" in req.session.user)) {
      res.status(401).send("Unauthorized");
      return;
    }
    if (!req.session.user?.customerId) {
      res.status(401).send("Unauthorized");
      return;
    }

    const prices = await stripe.invoices.list({
      customer: req.session.user?.customerId
    });

    res.send(prices);
  },
  sessionOptions
);
export default getInvoices;
