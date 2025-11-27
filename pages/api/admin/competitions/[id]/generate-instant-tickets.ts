import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import { prisma } from "../../../../../lib/prisma";

/**
 * Generate random instant win tickets for a competition
 * 
 * This creates a pool of tickets with random numbers where some are pre-assigned
 * as winning tickets for specific prizes.
 * 
 * POST /api/admin/competitions/[id]/generate-instant-tickets
 * Body: { ticketsPerPrize?: number } - How many tickets to display per prize (default: based on totalWins)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return res.status(401).json({ message: "Unauthorized - Admin access required" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Competition ID required" });
  }

  try {
    // Get competition with instant prizes
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        instantPrizes: true,
        instantWinTickets: true,
      },
    });

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    if (!competition.hasInstantWins) {
      return res.status(400).json({ message: "Competition does not have instant wins enabled" });
    }

    if (competition.instantPrizes.length === 0) {
      return res.status(400).json({ message: "No instant prizes configured for this competition" });
    }

    // Check if tickets already exist
    if (competition.instantWinTickets.length > 0) {
      // Delete existing tickets first (regenerating)
      await prisma.instantWinTicket.deleteMany({
        where: { competitionId: id },
      });
    }

    // Calculate total winning tickets needed
    const totalWinningTickets = competition.instantPrizes.reduce(
      (sum, prize) => sum + prize.totalWins,
      0
    );

    // Generate ticket numbers - we'll create tickets for each prize showing availability
    // Each prize gets its own pool of tickets displayed
    const createdTickets: any[] = [];
    const usedNumbers = new Set<number>();

    // Helper to generate unique random number within 1 to maxTickets
    // This ensures all prizes will be distributed if competition sells out
    const generateUniqueNumber = (): number => {
      let num: number;
      let attempts = 0;
      const maxAttempts = competition.maxTickets * 2;
      do {
        // Random number between 1 and maxTickets (inclusive)
        num = Math.floor(Math.random() * competition.maxTickets) + 1;
        attempts++;
        if (attempts > maxAttempts) {
          throw new Error('Could not generate unique ticket number');
        }
      } while (usedNumbers.has(num));
      usedNumbers.add(num);
      return num;
    };

    // For each prize, generate tickets
    for (const prize of competition.instantPrizes) {
      // Generate winning tickets (totalWins amount)
      for (let i = 0; i < prize.totalWins; i++) {
        const ticketNumber = generateUniqueNumber();
        createdTickets.push({
          competitionId: id,
          ticketNumber,
          prizeId: prize.id, // This ticket wins this prize
          winnerId: null,
          winnerName: null,
        });
      }
    }

    // Shuffle the tickets array to randomize the order
    for (let i = createdTickets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [createdTickets[i], createdTickets[j]] = [createdTickets[j], createdTickets[i]];
    }

    // Create all tickets in database
    await prisma.instantWinTicket.createMany({
      data: createdTickets,
    });

    // Reset remaining wins on prizes to match total wins
    // (in case some were claimed before regeneration)
    for (const prize of competition.instantPrizes) {
      await prisma.instantPrize.update({
        where: { id: prize.id },
        data: { remainingWins: prize.totalWins },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Generated ${createdTickets.length} instant win tickets`,
      stats: {
        totalTickets: createdTickets.length,
        prizeBreakdown: competition.instantPrizes.map((prize) => ({
          prizeName: prize.name,
          ticketCount: prize.totalWins,
        })),
      },
    });
  } catch (error) {
    console.error("Error generating instant win tickets:", error);
    return res.status(500).json({ message: "Failed to generate instant win tickets" });
  }
}

