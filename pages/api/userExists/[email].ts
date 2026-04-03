import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../../lib/session";
import { NextApiRequest, NextApiResponse } from "next";
import type { ILoggedInUser, NextApiRequestWithDB } from "../user";
import connectionHandler from "../../../lib/connection-handler";
import { Model } from "objection";
import User from "../../../models/User";

// eslint-disable-next-line consistent-return
async function userExistsRoute(req: NextApiRequestWithDB, res: NextApiResponse) {
  try {
    const { email } = req.query;
    if (typeof email !== "string") return;

    Model.knex(req.db);
    const existingUser = await User.query().findOne({
      email: email.toLowerCase()
    });
    if (existingUser) {
      console.log("User found: ", existingUser);
    } else {
      console.log("User not found");
    }

    res.json(!!existingUser);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}

export default connectionHandler()(withIronSessionApiRoute(userExistsRoute, sessionOptions));
