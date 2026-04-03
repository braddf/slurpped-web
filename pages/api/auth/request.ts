import { sealData } from "iron-session";
import { randomBytes, createHash } from "crypto";
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../../lib/session";
import { NextApiRequest, NextApiResponse } from "next";
import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";

const password = process.env.SECRET_COOKIE_PASSWORD!; // 32+ chars
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || ""
});
function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

async function issueSealedLink(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, userAgent } = req.body;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      email: email.toLowerCase(),
      iat: now,
      exp: now + 10 * 60, // 10 minutes
      jti: randomBytes(12).toString("hex"),
      ua: userAgent ? sha256(userAgent) : undefined
    };

    const seal = await sealData(payload, { password });
    const url = `${baseUrl}/api/auth/callback?token=${encodeURIComponent(seal)}`;

    // Send email to user with a login link
    const emailBody = `
    <html>
      <body>
        <p>Please click the link below to log in:</p>
        <a href="${url}">Let&apos;s go</a>
      </body>
    </html>`;
    const emailSubject = "Log in to Groentetas";
    const recipients = [new Recipient(email)];

    const sentFrom = new Sender("info@groentetasutrecht.nl", "Groentetas");
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(emailSubject)
      .setHtml(emailBody);

    const emailSent = await mailerSend.email.send(emailParams);

    return res.json({ emailSent: true });
  } catch (error) {
    console.error("Error issuing sealed link", error);
    res.status(500).json({ emailSent: false });
    throw error;
  }
}

export default withIronSessionApiRoute(issueSealedLink, sessionOptions);
