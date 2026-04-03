import { Magic } from "@magic-sdk/admin";
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { NextApiRequest, NextApiResponse } from "next";
import type { ILoggedInUser } from "./user";
import fetchJson from "../../lib/fetchJson";

// Now deprecated, using iron-session for sealing/verifying
// as well as cookies, instead of Magic SDK for links

// eslint-disable-next-line consistent-return
async function loginRoute(req: NextApiRequest, res: NextApiResponse) {
  const magic = await Magic.init(process.env.MAGIC_SECRET_KEY);
  try {
    if (req.method !== "POST") return res.status(405).end();

    // exchange the DID from Magic for some user data
    const did = magic.utils.parseAuthorizationHeader(req.headers.authorization || "");
    const userData = await magic.users.getMetadataByToken(did);

    req.session.user = {
      isLoggedIn: true,
      email: userData.email?.toLowerCase(),
      avatarUrl: userData.publicAddress
    } as ILoggedInUser;
    await req.session.save();

    const fleshedOutUser: ILoggedInUser | undefined = await fetchJson(
      `${process.env.APP_URL}/api/user`,
      {
        headers: { Authorization: `Bearer ${did}` }
      }
    );

    console.log("fleshedOutUser", fleshedOutUser);
    res.json(fleshedOutUser);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: (error as Error).message });
  }
}

export default withIronSessionApiRoute(loginRoute, sessionOptions);
