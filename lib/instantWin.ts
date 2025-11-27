// lib/instantWin.ts
// Instant Win Engine - Handles the lottery system for instant win prizes

import { prisma } from './prisma';
import { InstantPrizeType } from '@prisma/client';

// Tweak for odds: higher multiplier = more no-win outcomes
// e.g., NO_WIN_MULTIPLIER = 10 means for every prize in the pool, there are 10 "no win" entries
// Lower = more wins, Higher = fewer wins
// Win rate formula: 1 / (1 + multiplier) → multiplier 10 = ~9% win rate
const NO_WIN_MULTIPLIER = 10;

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
 * Process instant wins for a newly created entry
 * This should be called AFTER the entry is created and payment is confirmed
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
    // Get the entry with competition and instant prizes
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
    console.log('[InstantWin] Instant prizes count:', entry.competition.instantPrizes.length);
    console.log('[InstantWin] Tickets to process:', ticketNumbers.length);

    // If competition doesn't have instant wins, return all as NONE
    if (!entry.competition.hasInstantWins || entry.competition.instantPrizes.length === 0) {
      console.log('[InstantWin] No instant wins configured - skipping');
      for (const ticketNumber of ticketNumbers) {
        results.push({
          ticketNumber,
          result: 'NONE',
        });
      }

      // Update entry with results
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

    // Process each ticket for instant wins
    // We need to re-fetch prizes each time because remainingWins may change
    for (const ticketNumber of ticketNumbers) {
      // Get fresh prize data for each ticket
      const prizes = await tx.instantPrize.findMany({
        where: {
          competitionId: entry.competitionId,
          remainingWins: { gt: 0 },
        },
      });

      if (ticketNumber === ticketNumbers[0]) {
        // Log prize pool info for first ticket only
        console.log('[InstantWin] Available prizes:', prizes.map(p => ({
          name: p.name,
          remaining: p.remainingWins
        })));
      }

      const pickedPrize = pickInstantPrize(prizes);

      if (!pickedPrize) {
        // No win
        results.push({
          ticketNumber,
          result: 'NONE',
        });
        continue;
      }
      
      console.log('[InstantWin] 🎉 WIN! Ticket #' + ticketNumber + ' won:', pickedPrize.name);

      // Try to decrement remainingWins atomically
      const updatedPrize = await tx.instantPrize.updateMany({
        where: {
          id: pickedPrize.id,
          remainingWins: { gt: 0 },
        },
        data: {
          remainingWins: { decrement: 1 },
        },
      });

      if (updatedPrize.count === 0) {
        // Race condition: prize just ran out, treat as no win
        results.push({
          ticketNumber,
          result: 'NONE',
        });
        continue;
      }

      // WIN! Record the result
      results.push({
        ticketNumber,
        result: 'WIN',
        prizeId: pickedPrize.id,
        prizeName: pickedPrize.name,
        prizeType: pickedPrize.prizeType,
        value: pickedPrize.value,
      });

      // Apply prize to user balance
      if (pickedPrize.prizeType === InstantPrizeType.CASH) {
        totalCashWon += pickedPrize.value;
        
        await tx.user.update({
          where: { id: entry.userId },
          data: {
            cashBalance: { increment: pickedPrize.value },
          },
        });
      } else if (pickedPrize.prizeType === InstantPrizeType.RYDER_CASH) {
        totalRyderCashWon += pickedPrize.value;
        
        // Get current balance for transaction record
        const currentUser = await tx.user.findUnique({
          where: { id: entry.userId },
          select: { ryderCash: true },
        });
        
        const newBalance = (currentUser?.ryderCash || 0) + pickedPrize.value;
        
        await tx.user.update({
          where: { id: entry.userId },
          data: {
            ryderCash: newBalance,
          },
        });

        // Create RyderCash transaction record
        await tx.ryderCashTransaction.create({
          data: {
            userId: entry.userId,
            type: 'instant_win',
            amount: pickedPrize.value,
            balance: newBalance,
            description: `Instant Win: ${pickedPrize.name} from ${entry.competition.title}`,
            reference: entryId,
          },
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
 * Pick an instant prize from available prizes using weighted random selection
 * Returns null if no prize is won (based on NO_WIN_MULTIPLIER odds)
 */
function pickInstantPrize(prizes: Array<{
  id: string;
  prizeType: InstantPrizeType;
  value: number;
  remainingWins: number;
  name: string;
}>) {
  const available = prizes.filter((p) => p.remainingWins > 0);
  if (available.length === 0) return null;

  // Build a weighted pool based on remainingWins
  // Each prize gets entries equal to its remainingWins
  const pool: (string | null)[] = [];
  
  for (const prize of available) {
    for (let i = 0; i < prize.remainingWins; i++) {
      pool.push(prize.id);
    }
  }

  // Add no-win entries to control overall odds
  // The more prizes in the pool, the more no-wins we add
  const noWinCount = pool.length * NO_WIN_MULTIPLIER;
  for (let i = 0; i < noWinCount; i++) {
    pool.push(null);
  }

  // Pick randomly from the pool
  const randomIndex = Math.floor(Math.random() * pool.length);
  const pickedId = pool[randomIndex];

  if (!pickedId) return null;
  return available.find((p) => p.id === pickedId) ?? null;
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

