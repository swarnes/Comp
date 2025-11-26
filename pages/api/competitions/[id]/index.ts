import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Competition ID required" });
  }

  try {
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        winner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    res.status(200).json(competition);

  } catch (error) {
    console.error("Competition fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
