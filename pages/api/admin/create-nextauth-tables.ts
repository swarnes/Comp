import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow GET requests for easier testing
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions) as any;
  if (!session || !session.user || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    // Check if NextAuth tables exist by trying to query them
    const tablesExist = await Promise.all([
      prisma.account.count().catch(() => 0),
      prisma.session.count().catch(() => 0),
      prisma.verificationToken.count().catch(() => 0),
    ]);

    console.log("NextAuth tables check:", tablesExist);

    // If tables don't exist (all return 0 or error), they need to be created
    if (tablesExist.every(count => count === 0)) {
      // Run Prisma migrate deploy to create the tables
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      try {
        console.log("Running Prisma migrate deploy...");
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
        console.log("Migration stdout:", stdout);
        if (stderr) console.log("Migration stderr:", stderr);

        return res.status(200).json({
          message: "NextAuth tables created successfully",
          tablesCreated: true
        });
      } catch (migrateError) {
        console.error("Migration error:", migrateError);
        return res.status(500).json({
          message: "Failed to create NextAuth tables",
          error: migrateError.message
        });
      }
    } else {
      return res.status(200).json({
        message: "NextAuth tables already exist",
        tablesExist: true
      });
    }
  } catch (error) {
    console.error("Error checking NextAuth tables:", error);
    return res.status(500).json({
      message: "Error checking NextAuth tables",
      error: error.message
    });
  }
}
