import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const pastWinners = await prisma.competition.findMany({
      where: { 
        winnerId: { not: null }  // All competitions that have winners
      },
      include: { 
        winner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { 
        drawTimestamp: "desc"  // Order by actual draw time, fallback to endDate
      }
    });

    res.status(200).json(pastWinners);
  } catch (error) {
    console.error("Failed to fetch past winners:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
