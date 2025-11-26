import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../../lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]";
import type { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || !session.user || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Competition ID required" });
  }

  try {
    console.log(`Starting draw for competition ${id}`);
    
    // Get competition with all entries
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        entries: {
          where: { paymentStatus: "completed" },
          include: { user: true }
        }
      }
    });

    console.log(`Competition found: ${competition?.title}, entries: ${competition?.entries.length}`);

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    if (competition.winnerId) {
      return res.status(400).json({ message: "Winner already selected for this competition" });
    }

    if (competition.entries.length === 0) {
      return res.status(400).json({ message: "No valid entries found for this competition" });
    }

    // Build array of ALL ticket numbers with their owners
    const allTickets: { ticketNumber: number; userId: string; userName: string; userEmail: string }[] = [];
    let currentTicketNumber = 1;
    
    competition.entries.forEach(entry => {
      try {
        const ticketNumbers = JSON.parse(entry.ticketNumbers) as number[];
        ticketNumbers.forEach(ticketNumber => {
          allTickets.push({
            ticketNumber,
            userId: entry.userId,
            userName: entry.user.name || "Anonymous",
            userEmail: entry.user.email
          });
        });
      } catch (error) {
        // Fallback for malformed ticket numbers - assign sequential numbers
        console.log(`Fallback ticket assignment for entry ${entry.id}, quantity: ${entry.quantity}`);
        for (let i = 0; i < entry.quantity; i++) {
          allTickets.push({
            ticketNumber: currentTicketNumber++,
            userId: entry.userId,
            userName: entry.user.name || "Anonymous",
            userEmail: entry.user.email
          });
        }
      }
    });

    if (allTickets.length === 0) {
      return res.status(400).json({ message: "No valid tickets found" });
    }

    console.log(`Total tickets collected: ${allTickets.length}`);

    // Fair random selection: pick a random ticket number
    const randomIndex = Math.floor(Math.random() * allTickets.length);
    const winningTicket = allTickets[randomIndex];

    console.log(`Selected winning ticket: #${winningTicket.ticketNumber} owned by ${winningTicket.userName}`);

    // Generate a unique draw ID for transparency
    const drawId = `draw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update competition with winner and draw details
    const drawTimestamp = new Date();
    const updatedCompetition = await prisma.competition.update({
      where: { id },
      data: { 
        winnerId: winningTicket.userId,
        winningTicketNumber: winningTicket.ticketNumber,
        drawId,
        drawTimestamp,
        isActive: false // End the competition
      }
    });

    console.log(`Competition updated successfully with winner ${winningTicket.userId}`);

    // Return full draw results for transparency
    res.status(200).json({
      success: true,
      drawId,
      competition: {
        id: competition.id,
        title: competition.title
      },
      totalTickets: allTickets.length,
      totalParticipants: competition.entries.length,
      winningTicket: {
        number: winningTicket.ticketNumber,
        user: {
          id: winningTicket.userId,
          name: winningTicket.userName,
          email: winningTicket.userEmail
        }
      },
      drawTimestamp: new Date().toISOString(),
      randomSeed: randomIndex, // For transparency
      message: `Winner selected! Ticket #${winningTicket.ticketNumber} owned by ${winningTicket.userName}`
    });

  } catch (error) {
    console.error("Draw winner error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      competitionId: id
    });
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : "Unknown error") : undefined
    });
  }
}
