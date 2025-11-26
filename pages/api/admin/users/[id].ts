import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "../../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.role || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "User ID is required" });
  }

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          entries: {
            include: {
              competition: {
                select: {
                  id: true,
                  title: true,
                  endDate: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          ryderCashTransactions: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 20
          }
        }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "PATCH") {
    try {
      const { role } = req.body;

      if (!role || !["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

