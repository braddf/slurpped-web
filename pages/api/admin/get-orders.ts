import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../../lib/session";
import { NextApiHandler, NextApiResponse } from "next";
import Order from "../../../models/Order";
import connectionHandler from "../../../lib/connection-handler";
import { Model } from "objection";
import { NextApiRequestWithDB } from "../user";

const getOrders: NextApiHandler = async (req: NextApiRequestWithDB, res: NextApiResponse) => {
  if (!req.session.user || !req.session.user.isLoggedIn) {
    res.status(401).send("Unauthorized");
    return;
  }

  if (!req.session.user.isLoggedIn || !req.session.user?.isAdmin) {
    res.status(401).send("Unauthorized");
    return;
  }

  let collectionDate = new Date(Number(req.query.collectionDate));
  collectionDate.setHours(0, 0, 0, 0);
  const collectionDateSeconds = collectionDate.getTime() / 1000;
  const range = [collectionDateSeconds, collectionDateSeconds + 24 * 60 * 60];

  Model.knex(req.db);
  const orders = await Order.query()
    .select("orders.*", "users.firstName as userFirstName", "users.lastName as userLastName")
    .innerJoin("users", "orders.userId", "users.id")
    .whereBetween("collectionDate", range as [number, number])
    .withGraphFetched("user")
    .orderBy("userFirstName", "asc");

  res.send(orders);
};
export default connectionHandler()(withIronSessionApiRoute(getOrders, sessionOptions));
