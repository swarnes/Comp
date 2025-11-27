import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

/**
 * Admin-only endpoint to test instant win odds
 * GET /api/admin/test-instant-win?competitionId=xxx&tickets=100
 * 
 * This simulates the instant win lottery without affecting real data
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return res.status(401).json({ message: "Unauthorized - Admin access required" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { competitionId, tickets = "100" } = req.query;

  if (!competitionId || typeof competitionId !== "string") {
    return res.status(400).json({ message: "competitionId is required" });
  }

  const ticketCount = Math.min(parseInt(tickets as string) || 100, 1000);

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { instantPrizes: true },
    });

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    if (!competition.hasInstantWins) {
      return res.status(400).json({ 
        message: "This competition does not have instant wins enabled",
        hasInstantWins: false,
        instantPrizes: []
      });
    }

    if (competition.instantPrizes.length === 0) {
      return res.status(400).json({ 
        message: "No instant prizes configured for this competition",
        hasInstantWins: true,
        instantPrizes: []
      });
    }

    // Simulate the lottery (same logic as pickInstantPrize)
    const NO_WIN_MULTIPLIER = 2; // Match the value in instantWin.ts
    
    const simulateWins = () => {
      const available = competition.instantPrizes.filter(p => p.remainingWins > 0);
      if (available.length === 0) return null;

      const pool: (string | null)[] = [];
      for (const prize of available) {
        for (let i = 0; i < prize.remainingWins; i++) {
          pool.push(prize.id);
        }
      }

      const noWinCount = pool.length * NO_WIN_MULTIPLIER;
      for (let i = 0; i < noWinCount; i++) {
        pool.push(null);
      }

      const randomIndex = Math.floor(Math.random() * pool.length);
      return pool[randomIndex];
    };

    // Run simulation
    const results: { wins: number; noWins: number; prizeBreakdown: Record<string, number> } = {
      wins: 0,
      noWins: 0,
      prizeBreakdown: {}
    };

    for (let i = 0; i < ticketCount; i++) {
      const prizeId = simulateWins();
      if (prizeId) {
        results.wins++;
        results.prizeBreakdown[prizeId] = (results.prizeBreakdown[prizeId] || 0) + 1;
      } else {
        results.noWins++;
      }
    }

    // Calculate expected win rate
    const totalRemainingPrizes = competition.instantPrizes.reduce((sum, p) => sum + p.remainingWins, 0);
    const poolSize = totalRemainingPrizes + (totalRemainingPrizes * NO_WIN_MULTIPLIER);
    const expectedWinRate = totalRemainingPrizes / poolSize;

    return res.status(200).json({
      competition: {
        id: competition.id,
        title: competition.title,
        hasInstantWins: competition.hasInstantWins,
      },
      instantPrizes: competition.instantPrizes.map(p => ({
        id: p.id,
        name: p.name,
        prizeType: p.prizeType,
        value: p.value,
        totalWins: p.totalWins,
        remainingWins: p.remainingWins,
      })),
      simulation: {
        ticketsSimulated: ticketCount,
        wins: results.wins,
        noWins: results.noWins,
        actualWinRate: (results.wins / ticketCount * 100).toFixed(2) + "%",
        expectedWinRate: (expectedWinRate * 100).toFixed(2) + "%",
        prizeBreakdown: Object.entries(results.prizeBreakdown).map(([id, count]) => {
          const prize = competition.instantPrizes.find(p => p.id === id);
          return {
            prizeName: prize?.name || id,
            wins: count,
          };
        }),
      },
      config: {
        NO_WIN_MULTIPLIER,
        totalPrizesRemaining: totalRemainingPrizes,
        effectivePoolSize: poolSize,
      }
    });
  } catch (error: any) {
    console.error("Test instant win error:", error);
    return res.status(500).json({ message: error.message || "Failed to run simulation" });
  }
}

