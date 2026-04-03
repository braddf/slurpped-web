import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { NextApiHandler, NextApiResponse } from "next";
import connectionHandler from "../../lib/connection-handler";
import { Model } from "objection";
import { NextApiRequestWithDB } from "./user";
import BlockedDate from "../../models/BlockedDate";

const getBlockedDates: NextApiHandler = async (req: NextApiRequestWithDB, res: NextApiResponse) => {
  if (!req.session.user || !req.session.user.isLoggedIn) {
    res.status(401).send("Unauthorized");
    return;
  }

  if (!req.session.user.isLoggedIn) {
    res.status(401).send("Unauthorized");
    return;
  }

  Model.knex(req.db);
  const blockedDates = await BlockedDate.query().orderBy("date");

  res.send(blockedDates);
};
export default connectionHandler()(withIronSessionApiRoute(getBlockedDates, sessionOptions));
