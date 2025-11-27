import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { transactionId } = req.query;

  if (!transactionId || typeof transactionId !== "string") {
    return res.status(400).json({ message: "Transaction ID is required" });
  }

  try {
    // Get the RyderCash transaction
    const transaction = await prisma.ryderCashTransaction.findFirst({
      where: {
        id: transactionId,
        userId: session.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Get the entries associated with this transaction
    const entryIds = transaction.reference ? transaction.reference.split(",") : [];
    const entries = await prisma.entry.findMany({
      where: {
        id: { in: entryIds },
        userId: session.user.id
      },
      include: {
        competition: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Calculate instant win totals from entries
    let totalInstantWins = 0;
    let totalCashWon = 0;
    let totalRyderCashWon = 0;
    const allWinResults: any[] = [];

    for (const entry of entries) {
      if (entry.hasInstantWin && entry.instantWinResults) {
        try {
          const results = JSON.parse(entry.instantWinResults);
          for (const result of results) {
            if (result.result === 'WIN') {
              totalInstantWins++;
              if (result.prizeType === 'CASH') {
                totalCashWon += result.value || 0;
              } else if (result.prizeType === 'RYDER_CASH') {
                totalRyderCashWon += result.value || 0;
              }
              allWinResults.push({
                ticketNumber: result.ticketNumber,
                prizeName: result.prizeName,
                prizeType: result.prizeType,
                value: result.value
              });
            }
          }
        } catch (e) {
          console.error('Error parsing instant win results:', e);
        }
      }
    }

    const response = {
      success: true,
      transaction: {
        id: transaction.id,
        amount: Math.abs(transaction.amount),
        description: transaction.description,
        createdAt: transaction.createdAt,
        paymentMethod: "rydercash"
      },
      entries: entries.map(entry => {
        const instantWinResults = entry.instantWinResults ? JSON.parse(entry.instantWinResults) : [];
        return {
          id: entry.id,
          competitionTitle: entry.competition.title,
          ticketNumbers: JSON.parse(entry.ticketNumbers),
          quantity: entry.quantity,
          totalCost: entry.totalCost,
          hasInstantWin: entry.hasInstantWin,
          // Include both field names for compatibility
          instantWins: instantWinResults,
          instantWinResults: instantWinResults
        };
      }),
      // Include instant win summary (match structure expected by payment-success page)
      instantWins: totalInstantWins > 0 ? {
        totalWins: totalInstantWins,
        totalCashWon: totalCashWon,
        totalRyderCashWon: totalRyderCashWon,
        wins: allWinResults.map(w => ({
          ...w,
          result: "WIN" as const
        }))
      } : null
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching RyderCash transaction details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
