import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { items, totalAmount, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Items are required" });
  }

  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({ message: "Invalid total amount" });
  }

  if (paymentMethod !== "rydercash") {
    return res.status(400).json({ message: "Invalid payment method for this endpoint" });
  }

  try {
    // Get user's current RyderCash balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ryderCash: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has sufficient balance
    if (user.ryderCash < totalAmount) {
      return res.status(400).json({ 
        message: `Insufficient RyderCash balance. You have £${user.ryderCash.toFixed(2)}, but need £${totalAmount.toFixed(2)}` 
      });
    }

    // Process payment in a database transaction
    const result = await prisma.$transaction(async (tx) => {
      const entries = [];
      
      // Create entries for each item
      for (const item of items) {
        // Validate competition exists and is active
        const competition = await tx.competition.findFirst({
          where: { 
            id: item.competitionId,
            isActive: true,
            endDate: { gt: new Date() }
          }
        });

        if (!competition) {
          throw new Error(`Competition ${item.competitionTitle} is no longer available`);
        }

        // Check if there are enough tickets available
        const existingEntries = await tx.entry.findMany({
          where: { competitionId: item.competitionId }
        });
        
        const soldTickets = existingEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        const remainingTickets = competition.maxTickets - soldTickets;
        
        if (remainingTickets < item.quantity) {
          throw new Error(`Not enough tickets available for ${item.competitionTitle}. Only ${remainingTickets} tickets remaining.`);
        }

        // Generate ticket numbers
        const ticketNumbers = [];
        for (let i = 0; i < item.quantity; i++) {
          ticketNumbers.push(soldTickets + i + 1);
        }

        // Create entry
        const entry = await tx.entry.create({
          data: {
            userId: session.user.id,
            competitionId: item.competitionId,
            ticketNumbers: JSON.stringify(ticketNumbers),
            quantity: item.quantity,
            totalCost: item.ticketPrice * item.quantity,
            paymentMethod: "ryderCash",
            ryderCashUsed: item.ticketPrice * item.quantity,
            paymentStatus: "completed"
          }
        });

        entries.push(entry);
      }

      // Update user's RyderCash balance
      const newBalance = user.ryderCash - totalAmount;
      await tx.user.update({
        where: { id: session.user.id },
        data: { ryderCash: newBalance }
      });

      // Create RyderCash transaction record
      const transaction = await tx.ryderCashTransaction.create({
        data: {
          userId: session.user.id,
          type: "debit",
          amount: -totalAmount,
          balance: newBalance,
          description: `Competition entries purchase - ${items.length} item(s)`,
          reference: entries.map(e => e.id).join(",")
        }
      });

      return { entries, transaction };
    });

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      transactionId: result.transaction.id,
      entries: result.entries.map(entry => ({
        id: entry.id,
        competitionId: entry.competitionId,
        ticketNumbers: JSON.parse(entry.ticketNumbers),
        quantity: entry.quantity
      }))
    });

  } catch (error: any) {
    console.error("RyderCash payment processing failed:", error);
    res.status(500).json({ 
      message: error.message || "Payment processing failed" 
    });
  }
}
