import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Competition ID required" });
  }

  try {
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        entries: true
      }
    });

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const soldTickets = competition.entries.reduce((total, entry) => {
      try {
        const ticketNumbers = JSON.parse(entry.ticketNumbers);
        return total + (Array.isArray(ticketNumbers) ? ticketNumbers.length : entry.quantity);
      } catch {
        return total + entry.quantity;
      }
    }, 0);
    const progressPercentage = Math.round((soldTickets / competition.maxTickets) * 100);

    res.status(200).json({
      competitionId: id,
      maxTickets: competition.maxTickets,
      soldTickets,
      progressPercentage,
      remainingTickets: competition.maxTickets - soldTickets,
      ticketPrice: competition.ticketPrice,
      isActive: competition.isActive && new Date(competition.endDate) > new Date()
    });

  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
