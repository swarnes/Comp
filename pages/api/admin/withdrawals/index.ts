import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id || session.user.role !== "admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const withdrawals = await prisma.withdrawalRequest.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              cashBalance: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' }
        ]
      });

      res.status(200).json(withdrawals);
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ message: "Method not allowed" });
  }
}

