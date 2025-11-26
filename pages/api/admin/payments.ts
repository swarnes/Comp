import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.role || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  if (req.method === "GET") {
    try {
      // Get all entries with payment information
      const entries = await prisma.entry.findMany({
        where: {
          paymentStatus: "completed"
        },
        select: {
          id: true,
          quantity: true,
          totalCost: true,
          paymentMethod: true,
          paymentStatus: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          competition: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Group entries by user and approximate payment time (within 5 minutes)
      const paymentGroups: { [key: string]: any } = {};
      
      entries.forEach(entry => {
        // Create a key based on user and rough timestamp (rounded to 5-minute intervals)
        const timestamp = new Date(entry.createdAt);
        const roundedTime = new Date(Math.floor(timestamp.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000));
        const groupKey = `${entry.user.id}-${roundedTime.getTime()}`;
        
        if (!paymentGroups[groupKey]) {
          paymentGroups[groupKey] = {
            id: `payment-${groupKey}`,
            paymentIntentId: `pi_${entry.id.substring(0, 20)}`, // Mock payment intent ID
            amount: 0,
            status: entry.paymentStatus,
            method: entry.paymentMethod,
            createdAt: entry.createdAt,
            user: entry.user,
            entries: []
          };
        }
        
        paymentGroups[groupKey].amount += entry.totalCost;
        paymentGroups[groupKey].entries.push({
          id: entry.id,
          quantity: entry.quantity,
          competition: entry.competition
        });
      });

      const payments = Object.values(paymentGroups);
      
      res.status(200).json(payments);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

