import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../lib/prisma";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";

// Re-import authOptions for getServerSession
const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role } as any;
      }
    })
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({ token, user }: any) { if (user) { token.role = user.role; } return token; },
    async session({ session, token }: any) { if (token && token.sub) { session.user.id = token.sub; session.user.role = token.role; } return session; }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/auth/signin' },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || !session.user || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { userId, amount, description, type = "admin_adjustment" } = req.body;

  if (!userId || !amount || !description) {
    return res.status(400).json({ message: "User ID, amount, and description are required" });
  }

  if (typeof amount !== "number" || amount === 0) {
    return res.status(400).json({ message: "Amount must be a non-zero number" });
  }

  try {
    // Get current user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, ryderCash: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate new balance
    const newBalance = user.ryderCash + amount;

    if (newBalance < 0) {
      return res.status(400).json({ 
        message: `Insufficient balance. User has ₹${user.ryderCash.toFixed(2)}, cannot deduct ₹${Math.abs(amount).toFixed(2)}` 
      });
    }

    // Update user balance and create transaction in a single database transaction
    const result = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { ryderCash: newBalance }
      }),
      prisma.ryderCashTransaction.create({
        data: {
          userId,
          type: amount > 0 ? "credit" : "debit",
          amount,
          balance: newBalance,
          description,
          createdBy: session.user.id
        }
      })
    ]);

    const [updatedUser, transaction] = result;

    res.status(200).json({
      success: true,
      message: `Successfully ${amount > 0 ? 'added' : 'deducted'} ₹${Math.abs(amount).toFixed(2)} ${amount > 0 ? 'to' : 'from'} ${user.name || user.email}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        previousBalance: user.ryderCash,
        newBalance: updatedUser.ryderCash,
        amountChanged: amount
      },
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt
      }
    });

  } catch (error) {
    console.error("Failed to update RyderCash balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
