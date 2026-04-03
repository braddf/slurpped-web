import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../../lib/session";
import { NextApiHandler, NextApiResponse } from "next";
import connectionHandler from "../../../lib/connection-handler";
import { Model } from "objection";
import { NextApiRequestWithDB } from "../user";
import User from "../../../models/User";

const newOrder: NextApiHandler = async (req: NextApiRequestWithDB, res: NextApiResponse) => {
  if (!req.session.user || !req.session.user.isLoggedIn) {
    res.status(401).send("Unauthorized");
    return;
  }

  if (!req.session.user.isLoggedIn || !req.session.user?.isAdmin) {
    res.status(401).send("Unauthorized");
    return;
  }

  if (req.session.user.email === req.body.email) {
    if (req.session.user.isAdmin !== req.body.isAdmin) {
      res.status(422).send("Oops, you cannot change your own admin status");
    }
  }

  const body = req.body;
  Model.knex(req.db);
  try {
    const updatedUser = await User.query().updateAndFetchById(body.id, {
      firstName: body.firstName,
      lastName: body.lastName,
      // no email update
      isAdmin: body.isAdmin
    });
    res.send(updatedUser);
  } catch (error) {
    console.error("Error saving user", error);
    res.status(500).send({ message: "Error saving user", error });
  }
};
export default connectionHandler()(withIronSessionApiRoute(newOrder, sessionOptions));
