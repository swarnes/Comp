import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";

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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          role: user.role
        } as any;
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
};

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
        isActive 
      } = req.body;

      // Validation
      if (!title || !description || !startDate || !endDate || ticketPrice < 0 || maxTickets < 1) {
        return res.status(400).json({ message: "All fields are required and must be valid" });
      }

      // Prepare data object, conditionally including prizeValue
      const createData: any = {
        title,
        description,
        image: image || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ticketPrice,
        maxTickets,
        isActive
      };

      // Only include prizeValue if it's provided and the column exists
      if (prizeValue !== undefined && prizeValue !== null) {
        createData.prizeValue = prizeValue;
      }

      const competition = await prisma.competition.create({
        data: createData
      });

      res.status(201).json(competition);
    } catch (error) {
      console.error("Failed to create competition:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
