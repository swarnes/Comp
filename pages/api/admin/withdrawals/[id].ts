import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { sendWithdrawalProcessedEmail } from "../../../../lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id || session.user.role !== "admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "Invalid withdrawal ID" });
  }

  if (req.method === "PATCH") {
    const { action, rejectionReason, notes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    if (action === 'reject' && !rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    try {
      // Get the withdrawal request
      const withdrawal = await prisma.withdrawalRequest.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }

      if (withdrawal.status !== "PENDING") {
        return res.status(400).json({ message: "This request has already been processed" });
      }

      if (action === 'approve') {
        // Approve the withdrawal
        const updatedWithdrawal = await prisma.withdrawalRequest.update({
          where: { id },
          data: {
            status: "COMPLETED",
            processedBy: session.user.id,
            processedAt: new Date(),
            notes: notes || null
          }
        });

        // Send email notification to user about approval
        sendWithdrawalProcessedEmail({
          userName: withdrawal.user.name || withdrawal.user.email,
          userEmail: withdrawal.user.email,
          amount: withdrawal.amount,
          status: 'approved'
        }).catch(err => console.error("Failed to send approval email:", err));

        res.status(200).json({
          message: "Withdrawal approved successfully",
          withdrawal: updatedWithdrawal
        });
      } else {
        // Reject the withdrawal - refund the amount to user's cash balance
        const result = await prisma.$transaction(async (tx) => {
          // Refund the amount
          await tx.user.update({
            where: { id: withdrawal.userId },
            data: { cashBalance: { increment: withdrawal.amount } }
          });

          // Update the withdrawal request
          const updatedWithdrawal = await tx.withdrawalRequest.update({
            where: { id },
            data: {
              status: "REJECTED",
              rejectionReason,
              processedBy: session.user.id,
              processedAt: new Date(),
              notes: notes || null
            }
          });

          return updatedWithdrawal;
        });

        // Send email notification to user about rejection
        sendWithdrawalProcessedEmail({
          userName: withdrawal.user.name || withdrawal.user.email,
          userEmail: withdrawal.user.email,
          amount: withdrawal.amount,
          status: 'rejected',
          rejectionReason
        }).catch(err => console.error("Failed to send rejection email:", err));

        res.status(200).json({
          message: "Withdrawal rejected and amount refunded",
          withdrawal: result
        });
      }
    } catch (error) {
      console.error("Failed to process withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal request" });
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    res.status(405).json({ message: "Method not allowed" });
  }
}

