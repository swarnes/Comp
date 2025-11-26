import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../lib/prisma";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

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
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { page = "1", limit = "20" } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  try {
    const [transactions, totalCount] = await Promise.all([
      prisma.ryderCashTransaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.ryderCashTransaction.count({
        where: { userId: session.user.id }
      })
    ]);

    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      formattedAmount: `${transaction.amount >= 0 ? '+' : ''}₹${transaction.amount.toFixed(2)}`,
      balance: transaction.balance,
      formattedBalance: `₹${transaction.balance.toFixed(2)}`,
      description: transaction.description,
      reference: transaction.reference,
      createdAt: transaction.createdAt.toISOString(),
      formattedDate: transaction.createdAt.toLocaleDateString()
    }));

    res.status(200).json({
      transactions: formattedTransactions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNextPage: pageNum * limitNum < totalCount,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error("Failed to fetch RyderCash transactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
