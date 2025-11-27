import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { sendOrderConfirmation, sendInstantWinEmail } from "../../lib/email";
import { processInstantWinsForEntry, ProcessInstantWinsResult } from "../../lib/instantWin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("=== CONFIRM PAYMENT API CALLED ===");
  console.log("Method:", req.method);
  
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { paymentIntentId } = req.body;
  console.log("Payment Intent ID:", paymentIntentId);

  if (!paymentIntentId) {
    return res.status(400).json({ message: "Payment intent ID is required" });
  }

  try {
    // Retrieve the payment intent from Stripe to verify it's paid
    // This is secure because we're fetching directly from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("Payment intent status:", paymentIntent.status);
    console.log("Payment intent metadata:", paymentIntent.metadata);

    if (paymentIntent.status !== "succeeded") {
      console.log("Payment not completed, status:", paymentIntent.status);
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Get user ID from Stripe metadata (set when payment intent was created)
    // This is secure - only the user who created the payment can have this metadata
    const userId = paymentIntent.metadata.userId;
    if (!userId) {
      console.log("No user ID in payment metadata");
      return res.status(400).json({ message: "Invalid payment - no user associated" });
    }

    // Optionally verify session matches (if session exists)
    const session = await getServerSession(req, res, authOptions);
    console.log("Session user ID:", session?.user?.id);
    console.log("Payment metadata user ID:", userId);
    
    if (session?.user?.id && session.user.id !== userId) {
      console.log("Session user doesn't match payment user - using payment user");
    }

    // Parse the items from metadata
    const items = JSON.parse(paymentIntent.metadata.items);
    const paymentMethod = paymentIntent.metadata.paymentMethod || "card";
    const ryderCashAmount = parseFloat(paymentIntent.metadata.ryderCashAmount || "0");
    const cardAmount = parseFloat(paymentIntent.metadata.cardAmount || "0");
    
    console.log("Items to process:", items);
    console.log("Payment method:", paymentMethod);
    console.log("RyderCash amount:", ryderCashAmount);
    console.log("Card amount:", cardAmount);

    // Process payment in a database transaction for mixed payments
    const result = await prisma.$transaction(async (tx) => {
      let userBalance = 0;
      
      // If mixed payment, get user's current balance and validate
      if (paymentMethod === "mixed" && ryderCashAmount > 0) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { ryderCash: true }
        });

        if (!user) {
          throw new Error("User not found");
        }

        if (user.ryderCash < ryderCashAmount) {
          throw new Error(
            `Insufficient RyderCash balance. You have £${user.ryderCash.toFixed(2)}, but need £${ryderCashAmount.toFixed(2)}`
          );
        }

        userBalance = user.ryderCash;
      }

      // Create entries for each item with max tickets validation
      const entries = [];
      
      for (const item of items) {
        // Get competition details including max tickets
        const competition = await tx.competition.findUnique({
          where: { id: item.competitionId },
          include: { entries: true }
        });

        if (!competition) {
          throw new Error(`Competition ${item.competitionId} not found`);
        }

        if (!competition.isActive || new Date(competition.endDate) < new Date()) {
          throw new Error(`Competition "${competition.title}" is no longer active`);
        }

        // Calculate current ticket count
        let currentTickets = 0;
        competition.entries.forEach(entry => {
          try {
            const ticketNumbers = JSON.parse(entry.ticketNumbers);
            currentTickets += Array.isArray(ticketNumbers) ? ticketNumbers.length : entry.quantity;
          } catch {
            currentTickets += entry.quantity;
          }
        });

        // Check if adding these tickets would exceed the maximum
        if (currentTickets + item.quantity > competition.maxTickets) {
          const remainingTickets = Math.max(0, competition.maxTickets - currentTickets);
          throw new Error(
            `Not enough tickets available for "${competition.title}". ` +
            `Requested: ${item.quantity}, Available: ${remainingTickets}`
          );
        }

        // Generate ticket numbers
        const ticketNumbers = [];
        for (let i = 0; i < item.quantity; i++) {
          ticketNumbers.push(currentTickets + i + 1);
        }

        // Create the entry
        const entry = await tx.entry.create({
          data: {
            userId: userId,
            competitionId: item.competitionId,
            ticketNumbers: JSON.stringify(ticketNumbers),
            quantity: item.quantity,
            totalCost: item.ticketPrice * item.quantity,
            paymentMethod: paymentMethod,
            ryderCashUsed: paymentMethod === "mixed" ? ryderCashAmount / items.length : 0, // Distribute RyderCash across items
            paymentStatus: "completed"
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

        entries.push(entry);
      }

      // If mixed payment, deduct RyderCash from user balance and create transaction
      let ryderCashTransaction = null;
      if (paymentMethod === "mixed" && ryderCashAmount > 0) {
        const newBalance = userBalance - ryderCashAmount;
        
        await tx.user.update({
          where: { id: userId },
          data: { ryderCash: newBalance }
        });

        ryderCashTransaction = await tx.ryderCashTransaction.create({
          data: {
            userId: userId,
            type: "debit",
            amount: -ryderCashAmount,
            balance: newBalance,
            description: `Mixed payment for competition entries - ${items.length} item(s)`,
            reference: entries.map(e => e.id).join(",")
          }
        });
      }

      return { entries, ryderCashTransaction };
    });

    console.log("Created entries:", result.entries.length);

    // Process instant wins for each entry
    const instantWinResults: ProcessInstantWinsResult[] = [];
    for (const entry of result.entries) {
      const ticketNumbers = JSON.parse(entry.ticketNumbers) as number[];
      try {
        const instantResult = await processInstantWinsForEntry(entry.id, ticketNumbers);
        instantWinResults.push(instantResult);
        console.log(`Processed instant wins for entry ${entry.id}:`, {
          wins: instantResult.wins.length,
          cashWon: instantResult.totalCashWon,
          ryderCashWon: instantResult.totalRyderCashWon,
        });
      } catch (error) {
        console.error(`Error processing instant wins for entry ${entry.id}:`, error);
        // Don't fail the whole payment if instant wins fail - entries are still valid
      }
    }

    // Get user details for email (refresh to get updated balances)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, ryderCash: true, cashBalance: true }
    });

    // Aggregate instant win results
    const allWins = instantWinResults.flatMap(r => r.wins);
    const totalCashWon = instantWinResults.reduce((sum, r) => sum + r.totalCashWon, 0);
    const totalRyderCashWon = instantWinResults.reduce((sum, r) => sum + r.totalRyderCashWon, 0);

    // Prepare entries for response and email
    const entriesData = result.entries.map(entry => {
      const instantResult = instantWinResults.find(r => r.entryId === entry.id);
      return {
        id: entry.id,
        competitionTitle: entry.competition.title,
        ticketNumbers: JSON.parse(entry.ticketNumbers),
        quantity: entry.quantity,
        totalCost: entry.totalCost,
        instantWins: instantResult?.wins || [],
      };
    });

    // Send order confirmation email (don't block response if it fails)
    if (user?.email) {
      const totalAmount = entriesData.reduce((sum, e) => sum + e.totalCost, 0);
      sendOrderConfirmation({
        customerName: user.name || 'Valued Customer',
        customerEmail: user.email,
        entries: entriesData,
        totalAmount,
        paymentMethod,
        ryderCashUsed: ryderCashAmount
      }).catch(err => console.error('Email sending failed:', err));

      // Send instant win notification email if there are wins
      if (allWins.length > 0) {
        // Get competition titles for email
        const competitionTitles = Array.from(new Set(entriesData.map(e => e.competitionTitle)));
        
        sendInstantWinEmail({
          customerName: user.name || 'Winner',
          customerEmail: user.email,
          competitionTitle: competitionTitles.join(', '),
          wins: allWins.map(win => ({
            ticketNumber: win.ticketNumber,
            prizeName: win.prizeName || 'Instant Prize',
            prizeType: win.prizeType as 'CASH' | 'RYDER_CASH',
            value: win.value || 0,
          })),
          totalCashWon,
          totalRyderCashWon,
        }).catch(err => console.error('Instant win email sending failed:', err));
      }
    }

    const response = {
      success: true,
      message: allWins.length > 0 
        ? `Payment confirmed! You won ${allWins.length} instant prize${allWins.length > 1 ? 's' : ''}!` 
        : "Payment confirmed and entries created",
      paymentMethod: paymentMethod,
      ryderCashUsed: ryderCashAmount,
      cardAmount: cardAmount,
      entries: entriesData,
      user: {
        id: userId,
        name: user?.name || null,
        email: user?.email || null,
        ryderCash: user?.ryderCash || 0,
        cashBalance: user?.cashBalance || 0,
      },
      // Instant win summary
      instantWins: {
        totalWins: allWins.length,
        wins: allWins,
        totalCashWon,
        totalRyderCashWon,
      },
    };

    console.log("Sending response:", response);
    res.status(200).json(response);

  } catch (error: any) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ message: "Internal server error", error: error?.message || "Unknown error" });
  }
}
