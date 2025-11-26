import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("=== CREATE PAYMENT INTENT API CALLED ===");
  console.log("Method:", req.method);
  console.log("Stripe Secret Key exists:", !!process.env.STRIPE_SECRET_KEY);
  
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  console.log("Session user ID:", session?.user?.id);
  
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { items, paymentMethod = "card", cardAmount, ryderCashAmount = 0 } = req.body;
  console.log("Items received:", items);
  console.log("Payment method:", paymentMethod);
  console.log("Card amount:", cardAmount);
  console.log("RyderCash amount:", ryderCashAmount);

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Items are required" });
  }

  try {
    // Calculate amount to charge to card in pence (Stripe uses smallest currency unit)
    let totalAmount;
    
    if (cardAmount !== undefined) {
      // Use provided card amount for mixed payments
      totalAmount = Math.round(cardAmount * 100);
    } else {
      // Calculate full amount for card-only payments
      totalAmount = items.reduce((sum: number, item: any) => {
        return sum + (item.ticketPrice * item.quantity * 100); // Convert to pence
      }, 0);
    }

    console.log("Stripe amount (pence):", totalAmount);

    // Don't create payment intent if amount is 0 or negative
    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "gbp",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: session.user.id,
        itemCount: items.length.toString(),
        paymentMethod: paymentMethod,
        ryderCashAmount: ryderCashAmount.toString(),
        cardAmount: (totalAmount / 100).toString(),
        items: JSON.stringify(items.map((item: any) => ({
          competitionId: item.competitionId,
          competitionTitle: item.competitionTitle,
          quantity: item.quantity,
          ticketPrice: item.ticketPrice
        })))
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
