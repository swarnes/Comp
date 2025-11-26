import { stripe } from "@/lib/stripe";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { competitionId, quantity } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: { name: `Entry for Competition ${competitionId}` },
          unit_amount: 500
        },
        quantity
      }],
      mode: "payment",
      success_url: `${req.headers.origin}/dashboard`,
      cancel_url: `${req.headers.origin}/competition/${competitionId}`
    });

    res.status(200).json({ id: session.id });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
