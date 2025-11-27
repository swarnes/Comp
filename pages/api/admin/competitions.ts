import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { generateUniqueSlug } from "../../../lib/slug";
import type { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions) as Session | null;

  if (!session || !session.user || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  if (req.method === "GET") {
    try {
      const competitions = await prisma.competition.findMany({
        include: {
          winner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              instantPrizes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(competitions);
    } catch (error) {
      console.error("Failed to fetch competitions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const { 
        title, 
        description, 
        image, 
        startDate, 
        endDate, 
        ticketPrice, 
        maxTickets, 
        prizeValue,
        isActive 
      } = req.body;

      // Validation
      if (!title || !description || !startDate || !endDate || ticketPrice < 0 || maxTickets < 1) {
        return res.status(400).json({ message: "All fields are required and must be valid" });
      }

      // Generate unique slug from title
      const slug = await generateUniqueSlug(title, prisma);

      // Prepare data object, conditionally including prizeValue
      const createData: any = {
        title,
        slug,
        description,
        image: image || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ticketPrice,
        maxTickets,
        isActive
      };

      // Only include prizeValue if it's provided and the column exists
      if (prizeValue !== undefined && prizeValue !== null) {
        createData.prizeValue = prizeValue;
      }

      const competition = await prisma.competition.create({
        data: createData
      });

      res.status(201).json(competition);
    } catch (error) {
      console.error("Failed to create competition:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
