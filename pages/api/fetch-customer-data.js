import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default withIronSessionApiRoute(async (req, res, context) => {
  console.log("req.session.user1", req.session);
  if (!req.session.user?.customerId) res.redirect("/login");
  try {
    const subscription = await stripe.customers.retrieve(req.session.user.customerId, {
      expand: ["subscriptions"]
    });
    res.send(subscription);
  } catch (err) {
    console.log("err", err);
    res.redirect("/login");
  }
}, sessionOptions);
