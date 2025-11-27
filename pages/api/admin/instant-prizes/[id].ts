import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "../../../../lib/prisma";
import { deleteInstantPrize } from "../../../../lib/instantWin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return res.status(401).json({ message: "Unauthorized - Admin access required" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Prize ID is required" });
  }

  // GET - Get single instant prize
  if (req.method === "GET") {
    try {
      const prize = await prisma.instantPrize.findUnique({
        where: { id },
        include: {
          competition: {
            select: { id: true, title: true },
          },
        },
      });

      if (!prize) {
        return res.status(404).json({ message: "Prize not found" });
      }

      return res.status(200).json({
        ...prize,
        claimed: prize.totalWins - prize.remainingWins,
      });
    } catch (error: any) {
      console.error("Error fetching instant prize:", error);
      return res.status(500).json({ message: error.message || "Failed to fetch prize" });
    }
  }

  // DELETE - Delete instant prize
  if (req.method === "DELETE") {
    try {
      await deleteInstantPrize(id);

      // Check if competition still has any instant prizes
      const prize = await prisma.instantPrize.findFirst({
        where: { id },
      });

      if (prize) {
        const remainingPrizes = await prisma.instantPrize.count({
          where: { competitionId: prize.competitionId },
        });

        // If no prizes left, disable instant wins on competition
        if (remainingPrizes === 0) {
          await prisma.competition.update({
            where: { id: prize.competitionId },
            data: { hasInstantWins: false },
          });
        }
      }

      return res.status(200).json({ message: "Prize deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting instant prize:", error);
      return res.status(400).json({ message: error.message || "Failed to delete prize" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

