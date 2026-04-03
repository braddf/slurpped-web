import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../../lib/session";
import { NextApiHandler, NextApiResponse } from "next";
import connectionHandler from "../../../lib/connection-handler";
import { Model, raw } from "objection";
import { NextApiRequestWithDB } from "../user";
import User from "../../../models/User";

const getOrders: NextApiHandler = async (req: NextApiRequestWithDB, res: NextApiResponse) => {
  if (!req.session.user || !req.session.user.isLoggedIn) {
    res.status(401).send("Unauthorized");
    return;
  }

  if (!req.session.user.isLoggedIn || !req.session.user?.isAdmin) {
    res.status(401).send("Unauthorized");
    return;
  }

  Model.knex(req.db);
  try {
    const numberOfUsers = await User.knex().count("*").from("users").first();

    res.send(numberOfUsers.count);
  } catch (error) {
    console.error("Error getting users", error);
    res.status(500).send({ message: "Error getting users", error });
  }
};
export default connectionHandler()(withIronSessionApiRoute(getOrders, sessionOptions));
