import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Check if competition already exists
    const existingCompetition = await prisma.competition.findFirst({
      where: { title: "Kawasaki Ninja ZX-10R" }
    });

    if (existingCompetition) {
      return res.status(200).json({ message: "Sample competition already exists", competition: existingCompetition });
    }

    // Create sample competition
    const competition = await prisma.competition.create({
      data: {
        title: "Kawasaki Ninja ZX-10R",
        description: "Win this stunning Kawasaki Ninja ZX-10R - 200hp superbike with advanced traction control and quick shifter! Experience the thrill of premium motorcycle ownership.",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        ticketPrice: 3.0,
        maxTickets: 5000,
        isActive: true,
        image: "/images/Bikes/61qIUO5qd0L.jpg"
      }
    });

    res.status(201).json({ 
      message: "Sample competition created successfully", 
      competition 
    });

  } catch (error) {
    console.error("Error creating sample competition:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
