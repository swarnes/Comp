import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../../lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]";
import type { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || !session.user || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Competition ID required" });
  }

  try {
    // Check if competition exists
    const competition = await prisma.competition.findUnique({
      where: { id },
      select: { id: true, title: true, winnerId: true }
    });

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    if (!competition.winnerId) {
      return res.status(400).json({ message: "No winner to clear for this competition" });
    }

    // Clear winner fields
    const updatedCompetition = await prisma.competition.update({
      where: { id },
      data: { 
        winnerId: null,
        winningTicketNumber: null,
        drawId: null,
        drawTimestamp: null,
        isActive: true // Reactivate the competition
      }
    });

    console.log(`Winner cleared for competition ${id}`);

    res.status(200).json({
      success: true,
      message: "Winner cleared successfully",
      competition: {
        id: updatedCompetition.id,
        title: updatedCompetition.title
      }
    });

  } catch (error) {
    console.error("Clear winner error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      competitionId: id
    });
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : "Unknown error") : undefined
    });
  }
}
