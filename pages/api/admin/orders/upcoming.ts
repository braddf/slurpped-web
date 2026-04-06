import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../../../lib/session";
import { NextApiHandler, NextApiResponse } from "next";
import Order from "../../../../models/Order";
import connectionHandler from "../../../../lib/connection-handler";
import { Model } from "objection";
import { NextApiRequestWithDB } from "../../user";

const getUpcomingOrders: NextApiHandler = async (
  req: NextApiRequestWithDB,
  res: NextApiResponse
) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startMs = now.getTime();
  const endMs = startMs + 14 * 24 * 60 * 60 * 1000;

  Model.knex(req.db);
  const orders = await Order.query()
    .select("orders.*", "users.firstName as userFirstName", "users.lastName as userLastName")
    .innerJoin("users", "orders.userId", "users.id")
    .whereBetween("deliveryDate", [startMs, endMs])
    .withGraphFetched("user")
    .orderBy("userFirstName", "asc");

  const deliveryDates = new Set(
    orders.map((order) => new Date(Number(order.deliveryDate)).toISOString().split("T")[0])
  );

  const summary = {
    totalOrders: orders.length,
    totalUsers: new Set(orders.map((order) => order.userId)).size,
    totalCollectionDates: deliveryDates.size,
    collectionDates: Array.from(deliveryDates)
      .sort()
      .map((date) => {
        const dateOrders = orders.filter(
          (order) => new Date(Number(order.deliveryDate)).toISOString().split("T")[0] === date
        );
        return {
          date,
          count: dateOrders.length,
          split: dateOrders.reduce((acc, order) => {
            const slot = order.deliverySlot || "unknown";
            if (!acc[slot]) acc[slot] = 0;
            acc[slot]++;
            return acc;
          }, {} as Record<string, number>)
        };
      })
  };

  res.send({ orders: [], summary });
};
export default connectionHandler()(withIronSessionApiRoute(getUpcomingOrders, sessionOptions));
