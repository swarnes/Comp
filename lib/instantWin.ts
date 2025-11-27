// lib/instantWin.ts
// Instant Win Engine - Handles the lottery system for instant win prizes

import { prisma } from './prisma';
import { InstantPrizeType } from '@prisma/client';

export interface InstantWinResult {
  ticketNumber: number;
  result: 'NONE' | 'WIN';
  prizeId?: string;
  prizeName?: string;
  prizeType?: 'CASH' | 'RYDER_CASH';
  value?: number;
}

export interface ProcessInstantWinsResult {
  entryId: string;
  results: InstantWinResult[];
  wins: InstantWinResult[];
  totalCashWon: number;
  totalRyderCashWon: number;
}

/**
 * Generate random ticket numbers for a purchase
 * Returns unique random numbers that haven't been used in this competition
 * Uses a range based on competition's maxTickets to ensure reasonable win odds
 */
export async function generateRandomTicketNumbers(
  competitionId: string,
  quantity: number,
  tx?: any
): Promise<number[]> {
  const db = tx || prisma;
  
  // Get competition to determine number range
  const competition = await db.competition.findUnique({
    where: { id: competitionId },
    select: { maxTickets: true },
  });
  
  // Use maxTickets to create a reasonable range (same as ticket generation)
  const maxRange = Math.max((competition?.maxTickets || 10000) * 2, 10000);
  const minNumber = 1000;
  
  // Get existing ticket numbers from all entries
  const existingEntries = await db.entry.findMany({
    where: { competitionId },
    select: { ticketNumbers: true },
  });

  const usedNumbers = new Set<number>();
  existingEntries.forEach((entry: any) => {
    try {
      const numbers = JSON.parse(entry.ticketNumbers);
      if (Array.isArray(numbers)) {
        numbers.forEach((n: number) => usedNumbers.add(n));
      }
    } catch {
      // Skip invalid entries
    }
  });

  // Generate unique random numbers within the competition's range
  const ticketNumbers: number[] = [];
  const maxAttempts = quantity * 100; // Prevent infinite loops
  let attempts = 0;

  while (ticketNumbers.length < quantity && attempts < maxAttempts) {
    const num = Math.floor(Math.random() * maxRange) + minNumber;
    if (!usedNumbers.has(num) && !ticketNumbers.includes(num)) {
      ticketNumbers.push(num);
      usedNumbers.add(num);
    }
    attempts++;
  }

  // If we couldn't generate enough unique numbers, throw an error
  if (ticketNumbers.length < quantity) {
    throw new Error('Could not generate enough unique ticket numbers');
  }

  return ticketNumbers.sort((a, b) => a - b);
}

/**
 * Process instant wins for a newly created entry
 * This checks if any purchased ticket numbers match pre-assigned winning tickets
 * 
 * @param entryId - The ID of the entry to process
 * @param ticketNumbers - Array of ticket numbers in this entry
 * @returns Results including any wins and updated user balances
 */
export async function processInstantWinsForEntry(
  entryId: string,
  ticketNumbers: number[]
): Promise<ProcessInstantWinsResult> {
  return prisma.$transaction(async (tx) => {
    // Get the entry with competition
    const entry = await tx.entry.findUnique({
      where: { id: entryId },
      include: {
        competition: {
          include: {
            instantPrizes: true,
          },
        },
        user: true,
      },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    if (!entry.competition) {
      throw new Error('Competition not found');
    }

    const results: InstantWinResult[] = [];
    let totalCashWon = 0;
    let totalRyderCashWon = 0;

    // Debug logging
    console.log('[InstantWin] Processing entry:', entryId);
    console.log('[InstantWin] Competition:', entry.competition.title);
    console.log('[InstantWin] hasInstantWins:', entry.competition.hasInstantWins);
    console.log('[InstantWin] Tickets to process:', ticketNumbers);

    // If competition doesn't have instant wins, return all as NONE
    if (!entry.competition.hasInstantWins || entry.competition.instantPrizes.length === 0) {
      console.log('[InstantWin] No instant wins configured - skipping');
      for (const ticketNumber of ticketNumbers) {
        results.push({
          ticketNumber,
          result: 'NONE',
        });
      }

      await tx.entry.update({
        where: { id: entryId },
        data: {
          instantWinResults: JSON.stringify(results),
          hasInstantWin: false,
        },
      });

      return {
        entryId,
        results,
        wins: [],
        totalCashWon: 0,
        totalRyderCashWon: 0,
      };
    }

    // Check if there are pre-generated InstantWinTickets
    const instantWinTickets = await tx.instantWinTicket.findMany({
      where: {
        competitionId: entry.competitionId,
        ticketNumber: { in: ticketNumbers },
        winnerId: null, // Not yet claimed
        prizeId: { not: null }, // Has a prize assigned
      },
      include: {
        prize: true,
      },
    });

    console.log('[InstantWin] Found matching winning tickets:', instantWinTickets.length);

    // Process each ticket
    for (const ticketNumber of ticketNumbers) {
      const winningTicket = instantWinTickets.find(t => t.ticketNumber === ticketNumber);

      if (winningTicket && winningTicket.prize) {
        // This ticket is a winner!
        console.log('[InstantWin] 🎉 WIN! Ticket #' + ticketNumber + ' won:', winningTicket.prize.name);

        // Mark the InstantWinTicket as claimed
        await tx.instantWinTicket.update({
          where: { id: winningTicket.id },
          data: {
            winnerId: entry.userId,
            winnerName: entry.user.name || entry.user.email?.split('@')[0] || 'Winner',
            claimedAt: new Date(),
          },
        });

        // Decrement remaining wins on the prize
        await tx.instantPrize.update({
          where: { id: winningTicket.prize.id },
          data: {
            remainingWins: { decrement: 1 },
          },
        });

        // Record the result
        results.push({
          ticketNumber,
          result: 'WIN',
          prizeId: winningTicket.prize.id,
          prizeName: winningTicket.prize.name,
          prizeType: winningTicket.prize.prizeType,
          value: winningTicket.prize.value,
        });

        // Apply prize to user balance
        if (winningTicket.prize.prizeType === InstantPrizeType.CASH) {
          totalCashWon += winningTicket.prize.value;
          
          await tx.user.update({
            where: { id: entry.userId },
            data: {
              cashBalance: { increment: winningTicket.prize.value },
            },
          });
        } else if (winningTicket.prize.prizeType === InstantPrizeType.RYDER_CASH) {
          totalRyderCashWon += winningTicket.prize.value;
          
          const currentUser = await tx.user.findUnique({
            where: { id: entry.userId },
            select: { ryderCash: true },
          });
          
          const newBalance = (currentUser?.ryderCash || 0) + winningTicket.prize.value;
          
          await tx.user.update({
            where: { id: entry.userId },
            data: {
              ryderCash: newBalance,
            },
          });

          await tx.ryderCashTransaction.create({
            data: {
              userId: entry.userId,
              type: 'instant_win',
              amount: winningTicket.prize.value,
              balance: newBalance,
              description: `Instant Win: ${winningTicket.prize.name} from ${entry.competition.title}`,
              reference: entryId,
            },
          });
        }
      } else {
        // No win for this ticket
        results.push({
          ticketNumber,
          result: 'NONE',
        });
      }
    }

    const wins = results.filter((r) => r.result === 'WIN');

    // Update entry with instant win results
    await tx.entry.update({
      where: { id: entryId },
      data: {
        instantWinResults: JSON.stringify(results),
        hasInstantWin: wins.length > 0,
      },
    });

    return {
      entryId,
      results,
      wins,
      totalCashWon,
      totalRyderCashWon,
    };
  });
}

/**
 * Get summary of instant prizes for a competition
 * Useful for displaying prize information to users
 */
export async function getInstantPrizeSummary(competitionId: string) {
  const prizes = await prisma.instantPrize.findMany({
    where: { competitionId },
    orderBy: { value: 'desc' },
  });

  return prizes.map((prize) => ({
    id: prize.id,
    name: prize.name,
    prizeType: prize.prizeType,
    value: prize.value,
    totalWins: prize.totalWins,
    remainingWins: prize.remainingWins,
    claimed: prize.totalWins - prize.remainingWins,
  }));
}

/**
 * Create or update instant prizes for a competition
 * Used by admin to set up instant wins
 */
export async function upsertInstantPrize(data: {
  id?: string;
  competitionId: string;
  name: string;
  prizeType: InstantPrizeType;
  value: number;
  totalWins: number;
}) {
  const { id, competitionId, name, prizeType, value, totalWins } = data;

  if (id) {
    // Update existing prize
    const existing = await prisma.instantPrize.findUnique({ where: { id } });
    if (!existing) throw new Error('Prize not found');

    // Calculate how many have been claimed
    const claimed = existing.totalWins - existing.remainingWins;
    
    // Don't allow reducing totalWins below claimed amount
    if (totalWins < claimed) {
      throw new Error(`Cannot reduce total wins below ${claimed} (already claimed)`);
    }

    return prisma.instantPrize.update({
      where: { id },
      data: {
        name,
        prizeType,
        value,
        totalWins,
        remainingWins: totalWins - claimed,
      },
    });
  }

  // Create new prize
  return prisma.instantPrize.create({
    data: {
      competitionId,
      name,
      prizeType,
      value,
      totalWins,
      remainingWins: totalWins,
    },
  });
}

/**
 * Delete an instant prize
 * Only allowed if no prizes have been claimed yet
 */
export async function deleteInstantPrize(prizeId: string) {
  const prize = await prisma.instantPrize.findUnique({ where: { id: prizeId } });
  if (!prize) throw new Error('Prize not found');

  const claimed = prize.totalWins - prize.remainingWins;
  if (claimed > 0) {
    throw new Error(`Cannot delete prize: ${claimed} have already been claimed`);
  }

  return prisma.instantPrize.delete({ where: { id: prizeId } });
}
