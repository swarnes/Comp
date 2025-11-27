import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        ryderCash: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      userId: user.id,
      balance: user.ryderCash,
      formattedBalance: `₹${user.ryderCash.toFixed(2)}`, // Using ₹ symbol for RyderCash
      userName: user.name || user.email
    });

  } catch (error) {
    console.error("Failed to fetch RyderCash balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
