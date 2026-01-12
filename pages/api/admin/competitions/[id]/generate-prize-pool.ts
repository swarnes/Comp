import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import { prisma } from "../../../../../lib/prisma";

interface TierConfig {
  name: string;
  percentage: number;
  prizeValue: number;
  prizeType: "CASH" | "RYDER_CASH";
  count?: number; // Optional manual count override
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
      // If manual count is set, use it; otherwise calculate from percentage
      let prizeCount: number;
      
      if (tier.count !== undefined && tier.count > 0) {
        // Use manual count
        prizeCount = tier.count;
      } else {
        // Calculate from percentage
        const tierBudget = instantPot * (tier.percentage / 100);
        prizeCount = Math.max(1, Math.floor(tierBudget / tier.prizeValue));
      }

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

    // Identify tier-generated prize names (pattern: "£{value} {tier.name}")
    const tierGeneratedNames = new Set(
      prizesToCreate.map(p => p.name)
    );

    console.log("Tier-generated names:", Array.from(tierGeneratedNames));
    console.log("Existing prizes:", competition.instantPrizes.map(p => ({ id: p.id, name: p.name })));

    // Transaction: Preserve manual prizes, replace tier-based ones
    const result = await prisma.$transaction(async (tx) => {
      // Get existing prizes
      const existingPrizes = competition.instantPrizes;

      // Separate manual prizes (not matching tier pattern) from tier-based prizes
      const manualPrizes = existingPrizes.filter(p => !tierGeneratedNames.has(p.name));
      const tierBasedPrizes = existingPrizes.filter(p => tierGeneratedNames.has(p.name));

      console.log("Manual prizes to preserve:", manualPrizes.map(p => ({ id: p.id, name: p.name })));
      console.log("Tier-based prizes to replace:", tierBasedPrizes.map(p => ({ id: p.id, name: p.name })));

      // Store tier-based prize IDs for later use
      const tierBasedPrizeIds = new Set(tierBasedPrizes.map(p => p.id));
      
      // Check if any tier-based prizes have been claimed
      const claimedTierTickets = competition.instantWinTickets.filter(
        t => t.prizeId && tierBasedPrizeIds.has(t.prizeId) && t.winnerId
      );

      if (claimedTierTickets.length > 0) {
        throw new Error(`Cannot regenerate tier-based prizes: ${claimedTierTickets.length} have already been claimed`);
      }

      // Store manual prize IDs for later use
      const manualPrizeIds = new Set(manualPrizes.map(p => p.id));
      
      // Get existing tickets for manual prizes (to preserve claimed ones)
      const existingManualPrizeTickets = competition.instantWinTickets.filter(
        t => t.prizeId && manualPrizeIds.has(t.prizeId)
      );

      // Delete existing tickets, but we'll preserve claimed manual prize tickets
      // Delete all tickets first, then we'll re-add the claimed manual prize tickets
      await tx.instantWinTicket.deleteMany({
        where: { competitionId: id },
      });

      // Delete only tier-based prizes (preserve manual ones)
      if (tierBasedPrizes.length > 0) {
        await tx.instantPrize.deleteMany({
          where: {
            id: { in: tierBasedPrizes.map(p => p.id) },
          },
        });
      }

      // Re-fetch manual prizes from database to ensure they still exist and have current data
      const preservedManualPrizes = manualPrizes.length > 0 
        ? await tx.instantPrize.findMany({
            where: {
              id: { in: manualPrizes.map(p => p.id) },
              competitionId: id,
            },
          })
        : [];

      console.log("Preserved manual prizes after re-fetch:", preservedManualPrizes.map(p => ({ id: p.id, name: p.name, remainingWins: p.remainingWins })));
      
      if (manualPrizes.length > 0 && preservedManualPrizes.length === 0) {
        console.error("WARNING: Manual prizes were expected but not found after re-fetch!");
        console.error("Expected manual prize IDs:", manualPrizes.map(p => p.id));
      }

      // Create new tier-based prizes
      const createdTierPrizes = [];
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
        createdTierPrizes.push(created);
      }

      // Combine preserved manual prizes with newly created tier-based prizes
      const allPrizes = [
        ...preservedManualPrizes.map(p => ({
          ...p,
          // For manual prizes, generate tickets for remaining wins (unclaimed prizes)
          ticketsToGenerate: p.remainingWins,
        })),
        ...createdTierPrizes.map(p => ({
          ...p,
          ticketsToGenerate: p.totalWins,
        })),
      ];

      // Enable instant wins on competition
      await tx.competition.update({
        where: { id },
        data: { hasInstantWins: true },
      });

      // Generate instant win tickets for ALL prizes (manual + tier-based)
      // First, collect all existing ticket numbers (from claimed manual prizes) to avoid duplicates
      const usedNumbers = new Set<number>();
      
      // Add existing ticket numbers from claimed manual prize tickets to avoid duplicates
      for (const ticket of existingManualPrizeTickets.filter(t => t.winnerId)) {
        if (ticket.ticketNumber) {
          usedNumbers.add(ticket.ticketNumber);
        }
      }

      const ticketsToCreate: {
        competitionId: string;
        ticketNumber: number;
        prizeId: string;
        winnerId?: string | null;
        winnerName?: string | null;
      }[] = [];

      // Re-add claimed tickets for manual prizes
      for (const ticket of existingManualPrizeTickets.filter(t => t.winnerId && t.prizeId)) {
        ticketsToCreate.push({
          competitionId: id,
          ticketNumber: ticket.ticketNumber,
          prizeId: ticket.prizeId!,
          winnerId: ticket.winnerId,
          winnerName: ticket.winnerName,
        });
      }

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

      // Create winning tickets for each prize (both manual and tier-based)
      for (const prize of allPrizes) {
        // Generate tickets for remaining wins (for manual prizes) or total wins (for new tier prizes)
        for (let i = 0; i < prize.ticketsToGenerate; i++) {
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
        allPrizes: allPrizes,
        tierPrizes: createdTierPrizes,
        manualPrizes: preservedManualPrizes,
        ticketCount: ticketsToCreate.length,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Prize pool generated successfully. ${result.tierPrizes.length} tier-based prizes created, ${result.manualPrizes.length} manual prizes preserved.`,
      stats: {
        totalPrizes: result.allPrizes.length,
        tierPrizes: result.tierPrizes.length,
        manualPrizes: result.manualPrizes.length,
        totalTickets: result.ticketCount,
        totalPrizeValue: result.allPrizes.reduce((sum, p) => sum + (p.value * p.totalWins), 0),
        prizeBreakdown: result.allPrizes.map((p) => ({
          name: p.name,
          value: p.value,
          count: p.totalWins,
          total: p.value * p.totalWins,
          isManual: result.manualPrizes.some(mp => mp.id === p.id),
        })),
      },
    });
  } catch (error) {
    console.error("Error generating prize pool:", error);
    return res.status(500).json({ message: "Failed to generate prize pool" });
  }
}

