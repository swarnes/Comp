import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "../../../../lib/prisma";
import { upsertInstantPrize, getInstantPrizeSummary } from "../../../../lib/instantWin";
import { InstantPrizeType } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return res.status(401).json({ message: "Unauthorized - Admin access required" });
  }

  // GET - List instant prizes for a competition
  if (req.method === "GET") {
    const { competitionId } = req.query;

    if (!competitionId || typeof competitionId !== "string") {
      return res.status(400).json({ message: "Competition ID is required" });
    }

    try {
      const prizes = await getInstantPrizeSummary(competitionId);
      return res.status(200).json(prizes);
    } catch (error: any) {
      console.error("Error fetching instant prizes:", error);
      return res.status(500).json({ message: error.message || "Failed to fetch prizes" });
    }
  }

  // POST - Create or update instant prize
  if (req.method === "POST") {
    const { id, competitionId, name, prizeType, value, totalWins } = req.body;

    if (!competitionId || !name || !prizeType || value === undefined || !totalWins) {
      return res.status(400).json({ 
        message: "Missing required fields: competitionId, name, prizeType, value, totalWins" 
      });
    }

    if (!["CASH", "RYDER_CASH"].includes(prizeType)) {
      return res.status(400).json({ message: "prizeType must be CASH or RYDER_CASH" });
    }

    if (value <= 0) {
      return res.status(400).json({ message: "value must be greater than 0" });
    }

    if (totalWins < 1) {
      return res.status(400).json({ message: "totalWins must be at least 1" });
    }

    try {
      const prize = await upsertInstantPrize({
        id,
        competitionId,
        name,
        prizeType: prizeType as InstantPrizeType,
        value: parseFloat(value),
        totalWins: parseInt(totalWins),
      });

      // Also enable instant wins on the competition if not already
      await prisma.competition.update({
        where: { id: competitionId },
        data: { hasInstantWins: true },
      });

      return res.status(200).json(prize);
    } catch (error: any) {
      console.error("Error creating/updating instant prize:", error);
      return res.status(500).json({ message: error.message || "Failed to save prize" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

