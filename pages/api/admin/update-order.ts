import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../../lib/session";
import { NextApiHandler, NextApiResponse } from "next";
import Order from "../../../models/Order";
import connectionHandler from "../../../lib/connection-handler";
import { Model } from "objection";
import { NextApiRequestWithDB } from "../user";

const newOrder: NextApiHandler = async (req: NextApiRequestWithDB, res: NextApiResponse) => {
  if (!req.session.user || !req.session.user.isLoggedIn) {
    res.status(401).send("Unauthorized");
    return;
  }

  if (!req.session.user.isLoggedIn || !req.session.user?.isAdmin) {
    res.status(401).send("Unauthorized");
    return;
  }

  console.log("req.session.user", req.session.user);
  const body = req.body;
  console.log("body", body);
  Model.knex(req.db);
  const newOrder = await Order.query().updateAndFetchById(body.id, {
    userId: body.userId,
    product: body.product,
    items: body.items || [],
    quantity: body.quantity,
    total: body.total,
    collectionDate: body.collectionDate,
    collectionLocation: body.collectionLocation,
    notes: body.notes,
    // orderType: "admin",
    status: body.status,
    updatedBy: req.session.user.userId
  });

  res.send(newOrder);
};
export default connectionHandler()(withIronSessionApiRoute(newOrder, sessionOptions));
