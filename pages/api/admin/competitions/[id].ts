import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../../lib/prisma";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

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
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.role || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Competition ID required" });
  }

  if (req.method === "PATCH") {
    try {
      const { isActive } = req.body;
      
      const competition = await prisma.competition.update({
        where: { id },
        data: { isActive }
      });

      res.status(200).json(competition);
    } catch (error) {
      console.error("Failed to update competition:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "PUT") {
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
      const updateData: any = {
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
        updateData.prizeValue = prizeValue;
      }

      const competition = await prisma.competition.update({
        where: { id },
        data: updateData
      });

      res.status(200).json(competition);
    } catch (error: any) {
      console.error("Failed to update competition:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      res.status(500).json({ 
        message: "Internal server error", 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } else if (req.method === "DELETE") {
    try {
      // Check if competition exists
      const competition = await prisma.competition.findUnique({
        where: { id },
        include: {
          entries: true,
          _count: {
            select: { entries: true }
          }
        }
      });

      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      // Check if competition has entries
      if (competition._count.entries > 0) {
        return res.status(400).json({ 
          message: `Cannot delete competition with existing entries. This competition has ${competition._count.entries} entries. Please contact support if you need to delete this competition.` 
        });
      }

      // Check if competition has been drawn (has a winner)
      if (competition.winnerId) {
        return res.status(400).json({ 
          message: "Cannot delete a competition that already has a winner drawn." 
        });
      }

      // Delete the competition (no entries exist, so this is safe)
      await prisma.competition.delete({
        where: { id }
      });

      res.status(200).json({ 
        message: "Competition deleted successfully",
        deletedCompetition: {
          id: competition.id,
          title: competition.title
        }
      });
    } catch (error) {
      console.error("Failed to delete competition:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
