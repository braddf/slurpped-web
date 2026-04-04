import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { NextApiRequest, NextApiResponse } from "next";
import type { ILoggedInUser, NextApiRequestWithDB } from "./user";
import fetchJson from "../../lib/fetchJson";
import User from "../../models/User";
import { Model } from "objection";
import connectionHandler from "../../lib/connection-handler";
import * as Sentry from "@sentry/nextjs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

// eslint-disable-next-line consistent-return
async function registerRoute(req: NextApiRequestWithDB, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const userDetails = req.body;
    const userExists = await fetchJson(
      `${process.env.APP_URL}/api/userExists/` + userDetails.email?.toLowerCase(),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
    console.log("userExists", userExists);
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newCustomer = await stripe.customers.create({
      email: userDetails.email.toLowerCase(),
      name: userDetails.name
    });
    Model.knex(req.db);
    const newUser = await User.query().insertAndFetch({
      ...userDetails,
      email: userDetails.email.toLowerCase(),
      customerId: newCustomer.id
    });
    console.log("New user created: ", newUser);

    Sentry.captureMessage(`New user created: ${userDetails.name} - ${userDetails.email}`);

    res.json(newUser);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}

export default connectionHandler()(withIronSessionApiRoute(registerRoute, sessionOptions));
