import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Log ALL headers and cookies
    console.log("=== SERVER DEBUG ===");
    console.log("All headers:", JSON.stringify(req.headers, null, 2));
    console.log("Cookie header:", req.headers.cookie);
    console.log("Parsed cookies:", req.cookies);
    console.log("====================");
    
    const session = await getServerSession(req, res, authOptions);
    
    return res.status(200).json({
      hasSession: !!session,
      session: session,
      cookieHeader: req.headers.cookie || "NO COOKIE HEADER",
      parsedCookies: req.cookies,
      cookieNames: Object.keys(req.cookies),
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      host: req.headers.host,
      xForwardedProto: req.headers['x-forwarded-proto'],
      xForwardedHost: req.headers['x-forwarded-host'],
    });
  } catch (error) {
    console.error("Session test error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

