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
        isActive,
        // Prize pool config (optional)
        prizePoolConfig
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
        isActive,
        hasInstantWins: !!prizePoolConfig, // Enable if prize config provided
      };

      // Only include prizeValue if it's provided and the column exists
      if (prizeValue !== undefined && prizeValue !== null) {
        createData.prizeValue = prizeValue;
      }

      // Create competition with prizes in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create competition
        const competition = await tx.competition.create({
          data: createData
        });

        // If prize pool config provided, generate prizes and tickets
        if (prizePoolConfig && prizePoolConfig.tiers && prizePoolConfig.tiers.length > 0) {
          const { rtp, instantPotPercentage, tiers } = prizePoolConfig;
          
          // Calculate prize pool
          const totalPrizePool = maxTickets * ticketPrice * (rtp || 0.5);
          const instantPot = totalPrizePool * (instantPotPercentage || 0.96);

          // Generate prizes from tiers
          const createdPrizes = [];
          for (const tier of tiers) {
            const tierBudget = instantPot * (tier.percentage / 100);
            const prizeCount = Math.max(1, Math.floor(tierBudget / tier.prizeValue));

            if (prizeCount > 0) {
              const prize = await tx.instantPrize.create({
                data: {
                  competitionId: competition.id,
                  name: `£${tier.prizeValue} ${tier.name}`,
                  prizeType: tier.prizeType,
                  value: tier.prizeValue,
                  totalWins: prizeCount,
                  remainingWins: prizeCount,
                },
              });
              createdPrizes.push(prize);
            }
          }

          // Generate instant win tickets
          if (createdPrizes.length > 0) {
            const usedNumbers = new Set<number>();
            const ticketsToCreate: {
              competitionId: string;
              ticketNumber: number;
              prizeId: string;
            }[] = [];

            // Generate winning ticket numbers within 1 to maxTickets
            // This ensures all prizes distribute if competition sells out
            const generateUniqueNumber = (): number => {
              let num: number;
              let attempts = 0;
              const maxAttempts = maxTickets * 2;
              do {
                // Random number between 1 and maxTickets (inclusive)
                num = Math.floor(Math.random() * maxTickets) + 1;
                attempts++;
                if (attempts > maxAttempts) {
                  throw new Error("Could not generate unique ticket number");
                }
              } while (usedNumbers.has(num));
              usedNumbers.add(num);
              return num;
            };

            // Create winning tickets for each prize
            for (const prize of createdPrizes) {
              for (let i = 0; i < prize.totalWins; i++) {
                ticketsToCreate.push({
                  competitionId: competition.id,
                  ticketNumber: generateUniqueNumber(),
                  prizeId: prize.id,
                });
              }
            }

            // Shuffle for randomness
            for (let i = ticketsToCreate.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [ticketsToCreate[i], ticketsToCreate[j]] = [ticketsToCreate[j], ticketsToCreate[i]];
            }

            // Bulk create tickets
            await tx.instantWinTicket.createMany({
              data: ticketsToCreate,
            });
          }

          return {
            competition,
            prizesGenerated: createdPrizes.length,
            ticketsGenerated: createdPrizes.reduce((sum, p) => sum + p.totalWins, 0),
          };
        }

        return { competition, prizesGenerated: 0, ticketsGenerated: 0 };
      });

      res.status(201).json({
        ...result.competition,
        prizesGenerated: result.prizesGenerated,
        ticketsGenerated: result.ticketsGenerated,
      });
    } catch (error) {
      console.error("Failed to create competition:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
