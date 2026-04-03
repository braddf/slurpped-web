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

  const collected = !!req.body.collected;

  Model.knex(req.db);
  const order = await Order.query()
    .where("id", req.body.orderId)
    .patch({ collected: collected })
    .returning("*");

  if (!order) {
    res.status(404).send("Order not found");
    return;
  }

  res.send({ result: "success" });
};
export default connectionHandler()(withIronSessionApiRoute(getOrders, sessionOptions));
