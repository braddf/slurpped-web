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
  // if (!req.session.user || !req.session.user.isLoggedIn) {
  //   res.status(401).send("Unauthorized");
  //   return;
  // }
  //
  // if (!req.session.user.isLoggedIn || !req.session.user?.isAdmin) {
  //   res.status(401).send("Unauthorized");
  //   return;
  // }

  let collectionDate = new Date();
  collectionDate.setHours(0, 0, 0, 0);
  const collectionDateSeconds = collectionDate.getTime() / 1000;
  const range = [collectionDateSeconds, collectionDateSeconds + 14 * 24 * 60 * 60];

  Model.knex(req.db);
  const orders = await Order.query()
    .select("orders.*", "users.firstName as userFirstName", "users.lastName as userLastName")
    .innerJoin("users", "orders.userId", "users.id")
    .whereBetween("collectionDate", range as [number, number])
    .withGraphFetched("user")
    .orderBy("userFirstName", "asc");

  const collectionDates = new Set(
    orders.map(
      (order) =>
        new Date(new Date(order.collectionDate * 1000).setHours(9, 0, 0, 0))
          .toISOString()
          .split("T")[0] // Format to YYYY-MM-DD
    )
  );

  const summary = {
    totalOrders: orders.length,
    totalUsers: new Set(orders.map((order) => order.userId)).size,
    totalCollectionDates: collectionDates.size,
    collectionDates: Array.from(collectionDates)
      .sort()
      .map((date) => {
        const dateObj = new Date(new Date(date).setHours(9, 0, 0, 0));
        const dateOrders = orders.filter(
          (order) => new Date(order.collectionDate * 1000).toISOString().split("T")[0] === date
        );
        return {
          date: dateObj.toISOString().split("T")[0], // Format to YYYY-MM-DD
          count: dateOrders.length,
          split: dateOrders.reduce((acc, order) => {
            let locationName = (order.collectionLocation as string).split(" ")[0];
            if (locationName === "Vening") {
              locationName = "VMA";
            }
            if (!acc[locationName]) {
              acc[locationName] = 0;
            }
            acc[locationName]++;
            return acc;
          }, {} as Record<string, number>)
        };
      })
  };

  res.send({ orders: [], summary });
};
export default connectionHandler()(withIronSessionApiRoute(getUpcomingOrders, sessionOptions));
