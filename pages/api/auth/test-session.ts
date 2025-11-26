import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    // Log cookies for debugging
    console.log("Cookies received:", req.cookies);
    
    return res.status(200).json({
      hasSession: !!session,
      session: session,
      cookies: Object.keys(req.cookies),
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasSecret: !!process.env.NEXTAUTH_SECRET
    });
  } catch (error) {
    console.error("Session test error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

