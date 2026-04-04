import { NextApiRequest, NextApiResponse } from "next";

// Deprecated: Magic SDK flow removed. Active login is at /api/auth/request.
export default function loginRoute(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ message: "This endpoint is no longer in use. Use /api/auth/request." });
}
