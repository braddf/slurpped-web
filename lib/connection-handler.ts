import { NextApiRequest, NextApiResponse } from "next";
import databaseConnector from "./db-injector";

const connector = databaseConnector;

const handler =
  (...args: any) =>
  (fn: (req: NextApiRequest, res: NextApiResponse) => void) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    // @ts-ignore
    req.db = connector();
    await fn(req, res);
    // @ts-ignore
    await req.db.destroy();
  };

export default handler;
