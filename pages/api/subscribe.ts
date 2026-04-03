import { NextApiHandler } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const YOUR_DOMAIN = "http://localhost:3000/order";

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
