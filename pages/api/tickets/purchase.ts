import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint has been disabled to prevent free ticket purchases
  // Users must go through the cart and payment system instead
  return res.status(403).json({ 
    message: "Direct ticket purchases are disabled. Please use the cart system and checkout process." 
  });
}
