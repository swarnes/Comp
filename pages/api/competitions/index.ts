import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const competitions = await prisma.competition.findMany({
      where: { 
        endDate: { gte: new Date() },
        isActive: true 
      },
      orderBy: { createdAt: "desc" }, // Newest competitions first
    });

    res.status(200).json(competitions);
  } catch (error) {
    console.error("Failed to fetch competitions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
