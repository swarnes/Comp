import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { generateUniqueSlug } from "../../../lib/slug";
import type { Session } from "next-auth";

/**
 * One-time migration endpoint to generate slugs for existing competitions
 * Run this once after deploying the slug feature
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions) as Session | null;

  if (!session || !session.user || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Find all competitions without slugs
    const competitionsWithoutSlugs = await prisma.competition.findMany({
      where: { slug: null },
      select: { id: true, title: true }
    });

    if (competitionsWithoutSlugs.length === 0) {
      return res.status(200).json({ 
        message: "All competitions already have slugs",
        updated: 0 
      });
    }

    // Generate and update slugs for each competition
    const results = [];
    for (const competition of competitionsWithoutSlugs) {
      const slug = await generateUniqueSlug(competition.title, prisma, competition.id);
      
      await prisma.competition.update({
        where: { id: competition.id },
        data: { slug }
      });

      results.push({
        id: competition.id,
        title: competition.title,
        slug
      });
    }

    res.status(200).json({
      message: `Successfully generated slugs for ${results.length} competitions`,
      updated: results.length,
      competitions: results
    });

  } catch (error) {
    console.error("Failed to backfill slugs:", error);
    res.status(500).json({ message: "Failed to backfill slugs" });
  }
}

