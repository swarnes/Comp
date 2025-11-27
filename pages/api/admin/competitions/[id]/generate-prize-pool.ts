import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import { prisma } from "../../../../../lib/prisma";

interface TierConfig {
  name: string;
  percentage: number;
  prizeValue: number;
  prizeType: "CASH" | "RYDER_CASH";
}

/**
 * Generate complete prize pool for a competition
 * 
 * POST /api/admin/competitions/[id]/generate-prize-pool
 * Body: {
 *   rtp: number (0.4-0.6),
 *   instantPotPercentage: number (0.9-0.99),
 *   tiers: TierConfig[]
 * }
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

  const { rtp, instantPotPercentage, tiers } = req.body as {
    rtp: number;
    instantPotPercentage: number;
    tiers: TierConfig[];
  };

  // Validate inputs
  if (!rtp || rtp < 0.3 || rtp > 0.7) {
    return res.status(400).json({ message: "RTP must be between 30% and 70%" });
  }

  if (!instantPotPercentage || instantPotPercentage < 0.8 || instantPotPercentage > 0.99) {
    return res.status(400).json({ message: "Instant pot percentage must be between 80% and 99%" });
  }

  if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
    return res.status(400).json({ message: "At least one prize tier is required" });
  }

  try {
    // Get competition
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

    // Check if any prizes have been claimed
    const claimedTickets = competition.instantWinTickets.filter(t => t.winnerId);
    if (claimedTickets.length > 0) {
      return res.status(400).json({ 
        message: `Cannot regenerate: ${claimedTickets.length} prizes have already been claimed` 
      });
    }

    // Calculate prize pool
    const totalPrizePool = competition.maxTickets * competition.ticketPrice * rtp;
    const instantPot = totalPrizePool * instantPotPercentage;

    // Generate prizes from tiers
    const prizesToCreate: {
      name: string;
      prizeType: "CASH" | "RYDER_CASH";
      value: number;
      totalWins: number;
    }[] = [];

    for (const tier of tiers) {
      const tierBudget = instantPot * (tier.percentage / 100);
      const prizeCount = Math.max(1, Math.floor(tierBudget / tier.prizeValue));

      if (prizeCount > 0) {
        prizesToCreate.push({
          name: `£${tier.prizeValue} ${tier.name}`,
          prizeType: tier.prizeType,
          value: tier.prizeValue,
          totalWins: prizeCount,
        });
      }
    }

    if (prizesToCreate.length === 0) {
      return res.status(400).json({ message: "No prizes would be generated with current settings" });
    }

    // Transaction: Delete old prizes/tickets, create new ones
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing tickets first (due to foreign key)
      await tx.instantWinTicket.deleteMany({
        where: { competitionId: id },
      });

      // Delete existing prizes
      await tx.instantPrize.deleteMany({
        where: { competitionId: id },
      });

      // Create new prizes
      const createdPrizes = [];
      for (const prize of prizesToCreate) {
        const created = await tx.instantPrize.create({
          data: {
            competitionId: id,
            name: prize.name,
            prizeType: prize.prizeType,
            value: prize.value,
            totalWins: prize.totalWins,
            remainingWins: prize.totalWins,
          },
        });
        createdPrizes.push(created);
      }

      // Enable instant wins on competition
      await tx.competition.update({
        where: { id },
        data: { hasInstantWins: true },
      });

      // Generate instant win tickets
      const usedNumbers = new Set<number>();
      const ticketsToCreate: {
        competitionId: string;
        ticketNumber: number;
        prizeId: string;
      }[] = [];

      // Generate winning ticket numbers within 1 to maxTickets
      // This ensures all prizes distribute if competition sells out
      const generateUniqueNumber = (): number => {
        let num: number;
        let attempts = 0;
        const maxAttempts = competition.maxTickets * 2;
        do {
          // Random number between 1 and maxTickets (inclusive)
          num = Math.floor(Math.random() * competition.maxTickets) + 1;
          attempts++;
          if (attempts > maxAttempts) {
            throw new Error("Could not generate unique ticket number");
          }
        } while (usedNumbers.has(num));
        usedNumbers.add(num);
        return num;
      };

      // Create winning tickets for each prize
      for (const prize of createdPrizes) {
        for (let i = 0; i < prize.totalWins; i++) {
          ticketsToCreate.push({
            competitionId: id,
            ticketNumber: generateUniqueNumber(),
            prizeId: prize.id,
          });
        }
      }

      // Shuffle tickets for randomness
      for (let i = ticketsToCreate.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ticketsToCreate[i], ticketsToCreate[j]] = [ticketsToCreate[j], ticketsToCreate[i]];
      }

      // Bulk create tickets
      await tx.instantWinTicket.createMany({
        data: ticketsToCreate,
      });

      return {
        prizes: createdPrizes,
        ticketCount: ticketsToCreate.length,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Prize pool generated successfully",
      stats: {
        totalPrizes: result.prizes.length,
        totalTickets: result.ticketCount,
        totalPrizeValue: result.prizes.reduce((sum, p) => sum + (p.value * p.totalWins), 0),
        prizeBreakdown: result.prizes.map((p) => ({
          name: p.name,
          value: p.value,
          count: p.totalWins,
          total: p.value * p.totalWins,
        })),
      },
    });
  } catch (error) {
    console.error("Error generating prize pool:", error);
    return res.status(500).json({ message: "Failed to generate prize pool" });
  }
}

