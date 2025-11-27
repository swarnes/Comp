import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Competition ID is required" });
  }

  try {
    const competition = await prisma.competition.findUnique({
      where: { id },
      select: {
        id: true,
        hasInstantWins: true,
        instantPrizes: {
          orderBy: { value: "desc" },
          select: {
            id: true,
            name: true,
            prizeType: true,
            value: true,
            totalWins: true,
            remainingWins: true,
          },
        },
      },
    });

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Format prizes for frontend
    const prizes = competition.instantPrizes.map((prize) => ({
      id: prize.id,
      name: prize.name,
      prizeType: prize.prizeType,
      value: prize.value,
      totalWins: prize.totalWins,
      remainingWins: prize.remainingWins,
      claimed: prize.totalWins - prize.remainingWins,
    }));

    return res.status(200).json({
      hasInstantWins: competition.hasInstantWins,
      prizes,
    });
  } catch (error: any) {
    console.error("Error fetching instant prizes:", error);
    return res.status(500).json({ message: "Failed to fetch instant prizes" });
  }
}

