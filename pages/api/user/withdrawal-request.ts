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
    // Get user's withdrawal requests
    try {
      const requests = await prisma.withdrawalRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
      });

      res.status(200).json(requests);
    } catch (error) {
      console.error("Failed to fetch withdrawal requests:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "POST") {
    // Create new withdrawal request
    const { amount, paymentMethod, paymentDetails } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Please enter a valid withdrawal amount" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "Please select a payment method" });
    }

    if (!paymentDetails) {
      return res.status(400).json({ message: "Please provide payment details" });
    }

    // Minimum withdrawal amount (e.g., £5)
    const MIN_WITHDRAWAL = 5;
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ message: `Minimum withdrawal amount is £${MIN_WITHDRAWAL}` });
    }

    try {
      // Get user's current cash balance
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { cashBalance: true }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has sufficient balance
      if (user.cashBalance < amount) {
        return res.status(400).json({ 
          message: `Insufficient balance. You have £${user.cashBalance.toFixed(2)} available.` 
        });
      }

      // Check for pending withdrawal requests
      const pendingRequests = await prisma.withdrawalRequest.findMany({
        where: {
          userId: session.user.id,
          status: "PENDING"
        }
      });

      if (pendingRequests.length > 0) {
        return res.status(400).json({ 
          message: "You already have a pending withdrawal request. Please wait for it to be processed." 
        });
      }

      // Create withdrawal request and deduct from balance atomically
      const result = await prisma.$transaction(async (tx) => {
        // Deduct from cash balance
        await tx.user.update({
          where: { id: session.user.id },
          data: { cashBalance: { decrement: amount } }
        });

        // Create withdrawal request
        const withdrawalRequest = await tx.withdrawalRequest.create({
          data: {
            userId: session.user.id,
            amount,
            paymentMethod,
            paymentDetails: JSON.stringify(paymentDetails)
          }
        });

        return withdrawalRequest;
      });

      res.status(201).json({
        message: "Withdrawal request submitted successfully",
        request: result
      });
    } catch (error: any) {
      console.error("Failed to create withdrawal request:", error);
      // Provide more specific error message
      let errorMessage = "Failed to process withdrawal request. Please try again.";
      if (error?.code === 'P2002') {
        errorMessage = "A duplicate request was detected. Please try again.";
      } else if (error?.code === 'P2025') {
        errorMessage = "User record not found. Please refresh and try again.";
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }
      res.status(500).json({ message: errorMessage });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ message: "Method not allowed" });
  }
}

