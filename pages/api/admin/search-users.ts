import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../../lib/session";
import { NextApiHandler, NextApiResponse } from "next";
import Order from "../../../models/Order";
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

  const searchString = req.query.searchString as string;
  const lowerCaseSearchString = searchString.toLowerCase();

  Model.knex(req.db);
  const users = await User.query()
    .whereRaw('LOWER("first_name") like ?', [`%${lowerCaseSearchString}%`])
    .orWhereRaw("LOWER(last_name) like ?", [`%${lowerCaseSearchString}%`])
    .orWhereRaw("LOWER(email) like ?", [`%${lowerCaseSearchString}%`])
    .limit(50)
    .orderBy("firstName", "asc");

  res.send(users);
};
export default connectionHandler()(withIronSessionApiRoute(getOrders, sessionOptions));
