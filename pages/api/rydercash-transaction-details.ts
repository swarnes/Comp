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

    const response = {
      success: true,
      transaction: {
        id: transaction.id,
        amount: Math.abs(transaction.amount),
        description: transaction.description,
        createdAt: transaction.createdAt,
        paymentMethod: "rydercash"
      },
      entries: entries.map(entry => ({
        id: entry.id,
        competitionTitle: entry.competition.title,
        ticketNumbers: JSON.parse(entry.ticketNumbers),
        quantity: entry.quantity,
        totalCost: entry.totalCost
      }))
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching RyderCash transaction details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
