import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    // Check if this is an admin request for another user
    const { userId } = req.query;
    let targetUserId = session.user.id;

    if (userId && typeof userId === "string") {
      // Admin can view any user's transactions
      if (session.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      targetUserId = userId;
    }

    try {
      const transactions = await prisma.ryderCashTransaction.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to last 50 transactions
      });

      res.status(200).json(transactions);
    } catch (error) {
      console.error("Failed to fetch RyderCash transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "POST") {
    // Only admins can manually create transactions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { userId, type, amount, description, reference } = req.body;

    if (!userId || !type || amount === undefined || !description) {
      return res.status(400).json({ 
        message: "userId, type, amount, and description are required" 
      });
    }

    try {
      // Get current user balance
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { ryderCash: true }
      });

      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBalance = targetUser.ryderCash + amount;

      // Ensure balance doesn't go negative (unless it's an admin adjustment)
      if (newBalance < 0 && type !== "admin_adjustment") {
        return res.status(400).json({ 
          message: "Insufficient RyderCash balance" 
        });
      }

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Update user balance
        await tx.user.update({
          where: { id: userId },
          data: { ryderCash: newBalance }
        });

        // Create transaction record
        const transaction = await tx.ryderCashTransaction.create({
          data: {
            userId,
            type,
            amount,
            balance: newBalance,
            description,
            reference: reference || null,
            createdBy: session.user.id
          }
        });

        return transaction;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Failed to create RyderCash transaction:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
