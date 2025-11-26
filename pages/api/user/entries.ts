import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if this is an admin request for another user
  const { userId } = req.query;
  let targetUserId = session.user.id;

  if (userId && typeof userId === "string") {
    // Admin can view any user's entries
    if (session.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    targetUserId = userId;
  }

  try {
    const userEntries = await prisma.entry.findMany({
      where: { userId: targetUserId },
      include: { 
        competition: {
          select: {
            title: true,
            ticketPrice: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(userEntries);
  } catch (error) {
    console.error("Failed to fetch user entries:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
