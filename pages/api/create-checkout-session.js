const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const YOUR_DOMAIN = "http://localhost:3000/order";

export default async (req, res) => {
  console.log("req.body", req.body);
  const prices = await stripe.prices.list({
    lookup_keys: [req.body.lookup_key],
    expand: ["data.product"]
  });
  console.log("prices", prices.data);
  const now = new Date();
  const tuesday12AM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + ((2 + 7 - now.getDay()) % 7),
    0,
    0,
    0
  );
  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    line_items: [
      {
        price: prices.data[0].id,
        // price: 'price_1LsY1wBc1Etlq9VBc4D9Kngg',
        // For metered billing, do not pass quantity
        quantity: 1
      }
    ],
    mode: "subscription",
    subscription_data: {
      // trial_end: tuesday12AM.getTime() / 1000,
    },
    success_url: `${YOUR_DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`
  });

  res.redirect(303, session.url);
};
