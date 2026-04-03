import { unsealData } from "iron-session";
import { createHash } from "crypto";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import sessionOptions from "../../../lib/session";
import type { ILoggedInUser } from "../user";

const password = process.env.SECRET_COOKIE_PASSWORD!;

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

async function verifySealedToken(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { token, userAgent } = req.query;
    const payload = (await unsealData(token as string, { password })) as {
      email: string;
      iat: number;
      exp: number;
      jti: string;
      ua?: string;
    };

    const now = Math.floor(Date.now() / 1000);
    if (!payload?.email || now > payload.exp) throw new Error("Expired or invalid");

    if (payload.ua) {
      const cur = sha256(String(userAgent || ""));
      if (payload.ua !== cur) throw new Error("Device mismatch");
    }

    req.session.user = {
      isLoggedIn: true,
      email: payload.email?.toLowerCase()
    } as ILoggedInUser;
    await req.session.save();

    res.redirect("/");
  } catch (error) {
    console.error("Error verifying sealed token", error);
    res.redirect("/login");
  }
}

export default withIronSessionApiRoute(verifySealedToken, sessionOptions);
