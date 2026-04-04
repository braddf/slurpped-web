import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

const getCheckoutSessions: NextApiHandler = withIronSessionApiRoute(
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

    try {
      const sessions = await stripe.checkout.sessions.list({
        customer: req.session.user?.customerId,
        expand: ["data.payment_intent", "data.payment_intent.payment_method", "data.line_items"]
      });

      res.send(sessions);
    } catch (error) {
      console.log("error", error);
      res.status(404).send({ message: "No checkout sessions found" });
    }
  },
  sessionOptions
);
export default getCheckoutSessions;
