import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

/**
 * Get paginated instant win tickets for a competition
 * 
 * GET /api/competitions/[id]/instant-tickets
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 24)
 *   - prizeId: Filter by specific prize (optional)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 24;
  const prizeId = req.query.prizeId as string | undefined;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Competition ID required" });
  }

  try {
    // First try to find by slug, then by ID
    let competition = await prisma.competition.findFirst({
      where: { slug: id },
      select: { id: true, hasInstantWins: true },
    });

    if (!competition) {
      competition = await prisma.competition.findUnique({
        where: { id },
        select: { id: true, hasInstantWins: true },
      });
    }

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    if (!competition.hasInstantWins) {
      return res.status(200).json({
        hasInstantWins: false,
        tickets: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
        prizes: [],
      });
    }

    const competitionId = competition.id;

    // Build where clause
    const whereClause: any = { competitionId };
    if (prizeId) {
      whereClause.prizeId = prizeId;
    }

    // Get total count
    const total = await prisma.instantWinTicket.count({ where: whereClause });

    // Get paginated tickets
    const tickets = await prisma.instantWinTicket.findMany({
      where: whereClause,
      include: {
        prize: {
          select: {
            id: true,
            name: true,
            prizeType: true,
            value: true,
          },
        },
      },
      orderBy: { ticketNumber: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get prize summary for this competition
    const prizes = await prisma.instantPrize.findMany({
      where: { competitionId },
      select: {
        id: true,
        name: true,
        prizeType: true,
        value: true,
        totalWins: true,
        remainingWins: true,
      },
    });

    // Get counts per prize
    const prizeCounts = await prisma.instantWinTicket.groupBy({
      by: ["prizeId"],
      where: { competitionId },
      _count: { id: true },
    });

    const claimedCounts = await prisma.instantWinTicket.groupBy({
      by: ["prizeId"],
      where: { competitionId, winnerId: { not: null } },
      _count: { id: true },
    });

    // Build prize summary with counts
    const prizeSummary = prizes.map((prize) => {
      const totalTickets = prizeCounts.find((p) => p.prizeId === prize.id)?._count.id || 0;
      const claimedTickets = claimedCounts.find((p) => p.prizeId === prize.id)?._count.id || 0;
      return {
        ...prize,
        totalTickets,
        claimedTickets,
        availableTickets: totalTickets - claimedTickets,
      };
    });

    // Format tickets for response
    const formattedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      prizeId: ticket.prizeId,
      prizeName: ticket.prize?.name || null,
      prizeType: ticket.prize?.prizeType || null,
      prizeValue: ticket.prize?.value || null,
      isClaimed: !!ticket.winnerId,
      winnerName: ticket.winnerName,
      claimedAt: ticket.claimedAt,
    }));

    return res.status(200).json({
      hasInstantWins: true,
      tickets: formattedTickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      prizes: prizeSummary,
    });
  } catch (error) {
    console.error("Error fetching instant win tickets:", error);
    return res.status(500).json({ message: "Failed to fetch instant win tickets" });
  }
}

