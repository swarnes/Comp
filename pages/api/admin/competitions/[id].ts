import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { generateUniqueSlug } from "../../../../lib/slug";
import type { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions) as Session | null;

  if (!session || !session.user || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Competition ID required" });
  }

  if (req.method === "PATCH") {
    try {
      const { isActive } = req.body;
      
      const competition = await prisma.competition.update({
        where: { id },
        data: { isActive }
      });

      res.status(200).json(competition);
    } catch (error) {
      console.error("Failed to update competition:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "PUT") {
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

      // Get current competition to check if title changed
      const currentCompetition = await prisma.competition.findUnique({
        where: { id },
        select: { title: true, slug: true }
      });

      // Generate new slug if title changed
      let slug = currentCompetition?.slug;
      if (currentCompetition && currentCompetition.title !== title) {
        slug = await generateUniqueSlug(title, prisma, id);
      }

      // Prepare data object, conditionally including prizeValue
      const updateData: any = {
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
        updateData.prizeValue = prizeValue;
      }

      const competition = await prisma.competition.update({
        where: { id },
        data: updateData
      });

      res.status(200).json(competition);
    } catch (error: any) {
      console.error("Failed to update competition:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      res.status(500).json({ 
        message: "Internal server error", 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } else if (req.method === "DELETE") {
    try {
      const { force } = req.query; // Allow force delete with ?force=true
      
      // Check if competition exists
      const competition = await prisma.competition.findUnique({
        where: { id },
        include: {
          entries: true,
          _count: {
            select: { entries: true }
          }
        }
      });

      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      // Check if competition has entries or a winner
      const hasEntries = competition._count.entries > 0;
      const hasWinner = !!competition.winnerId;
      
      if ((hasEntries || hasWinner) && force !== "true") {
        const reasons = [];
        if (hasEntries) reasons.push(`${competition._count.entries} entries`);
        if (hasWinner) reasons.push("a winner has been drawn");
        
        return res.status(400).json({ 
          message: `Cannot delete competition with ${reasons.join(" and ")}.`,
          canForceDelete: true,
          entriesCount: competition._count.entries,
          hasWinner: hasWinner
        });
      }

      // Force delete: Delete all related data in transaction
      if (force === "true") {
        await prisma.$transaction(async (tx) => {
          // Delete all entries first
          await tx.entry.deleteMany({
            where: { competitionId: id }
          });

          // Delete RyderCash transactions related to this competition
          await tx.ryderCashTransaction.deleteMany({
            where: { reference: id }
          });

          // Delete instant win tickets (cascade will handle InstantPrizes)
          await tx.instantWinTicket.deleteMany({
            where: { competitionId: id }
          });

          // Delete instant prizes
          await tx.instantPrize.deleteMany({
            where: { competitionId: id }
          });

          // Finally delete the competition
          await tx.competition.delete({
            where: { id }
          });
        });

        return res.status(200).json({ 
          message: `Competition and all ${competition._count.entries} entries deleted successfully`,
          deletedCompetition: {
            id: competition.id,
            title: competition.title,
            deletedEntries: competition._count.entries
          }
        });
      }

      // Check if competition has been drawn (has a winner)
      if (competition.winnerId) {
        return res.status(400).json({ 
          message: "Cannot delete a competition that already has a winner drawn.",
          canForceDelete: true
        });
      }

      // Normal delete (no entries exist)
      await prisma.competition.delete({
        where: { id }
      });

      res.status(200).json({ 
        message: "Competition deleted successfully",
        deletedCompetition: {
          id: competition.id,
          title: competition.title
        }
      });
    } catch (error) {
      console.error("Failed to delete competition:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
