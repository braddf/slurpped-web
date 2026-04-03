import { withIronSessionApiRoute } from "iron-session/next";
import connectionHandler from "../../lib/connection-handler";
import sessionOptions from "../../lib/session";
import User from "../../models/User";
import { NextApiRequest, NextApiResponse } from "next";
import { Model } from "objection";
import { createClient } from "@sanity/client";

type IPage = {
  _id: string;
  title: string;
  nav: boolean;
  slug: string;
  navTitle: string;
};
export type ILoggedInUser = {
  isLoggedIn: true;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  customerId: string;
  avatarUrl: string;
  pages: IPage[];
  isAdmin: boolean;
};

export type ILoggedOutUser = {
  isLoggedIn: false;
};

export type IUser = ILoggedInUser | ILoggedOutUser;

export interface NextApiRequestWithDB extends NextApiRequest {
  db?: any;
}

export async function userRoute(req: NextApiRequestWithDB, res: NextApiResponse<IUser>) {
  if (req.session.user && req.session.user.isLoggedIn) {
    console.log("User: req.session.user", req.session.user);
    // in a real world application you might read the user id from the session and then do a database request
    // to get more information on the user if needed
    Model.knex(req.db);
    const dbUser = await User.query().findOne({
      email: req.session.user.email.toLowerCase()
    });
    if (!dbUser) {
      console.log("User not found, destroying session");
      req.session.destroy();
      res.json({ isLoggedIn: false } as ILoggedOutUser);
    }
    // .withGraphFetched("practices");

    let combinedUser: ILoggedInUser = {
      ...req.session.user,
      userId: dbUser?.id || "",
      firstName: dbUser?.firstName || "",
      lastName: dbUser?.lastName || "",
      customerId: dbUser?.customerId || "",
      isAdmin: dbUser?.isAdmin || false,
      isLoggedIn: true
    };

    req.session.user = combinedUser as ILoggedInUser;
    await req.session.save();
    console.log(req.session.user);

    // const client = createClient({
    //   projectId: "amgyzrnr",
    //   dataset: "dash-content",
    //   apiVersion: "2021-03-25",
    //   token: process.env.SANITY_BOT_TOKEN
    //   // useCdn: true,
    // });

    //   const query = `*[_type == "page" && !(_id in path("drafts.**"))]{
    // _id, title, nav, slug, navTitle}`;
    //
    //   await client.fetch(query).then((pages: IPage[]) => {
    //     if (pages.length) {
    //       combinedUser = { ...combinedUser, pages };
    //     }
    //   });

    res.json(combinedUser);
  } else {
    res.json({
      isLoggedIn: false
    } as ILoggedOutUser);
  }
}

export default connectionHandler()(withIronSessionApiRoute(userRoute, sessionOptions));
