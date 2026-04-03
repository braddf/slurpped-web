import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { NextApiRequest, NextApiResponse } from "next";
import type { ILoggedOutUser } from "./user";

function logoutRoute(req: NextApiRequest, res: NextApiResponse<ILoggedOutUser>) {
  req.session.destroy();
  res.json({ isLoggedIn: false } as ILoggedOutUser);
}

export default withIronSessionApiRoute(logoutRoute, sessionOptions);
