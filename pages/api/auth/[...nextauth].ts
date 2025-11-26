import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debugging
  adapter: PrismaAdapter(prisma),
  logger: {
    error: (code, metadata) => {
      console.error("NextAuth Error:", code, metadata);
    },
    warn: (code) => {
      console.warn("NextAuth Warning:", code);
    },
    debug: (code, metadata) => {
      console.debug("NextAuth Debug:", code, metadata);
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("NextAuth authorize called with credentials:", {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
          hasPaymentIntentId: !!(credentials as any)?.paymentIntentId
        });
        // Handle payment-based authentication (for users who just completed payment)
        if ((credentials as any)?.paymentIntentId && !credentials?.password) {
          console.log("Payment-based auth triggered with paymentIntentId:", (credentials as any).paymentIntentId);
          // Verify the payment intent belongs to this user
          const { prisma } = await import("../../../lib/prisma");
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-07-30.basil",
          });

          try {
            const paymentIntent = await stripe.paymentIntents.retrieve((credentials as any).paymentIntentId);
            console.log("Retrieved payment intent:", paymentIntent.id, "status:", paymentIntent.status);
            const userId = paymentIntent.metadata.userId;
            console.log("User ID from metadata:", userId);

            if (userId) {
              const user = await prisma.user.findUnique({
                where: { id: userId }
              });
              console.log("Found user:", user?.email);

              if (user) {
                console.log("Auto-signing in user after payment:", user.email);
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name || undefined,
                  role: user.role
                } as any;
              }
            }
          } catch (error) {
            console.error("Payment-based auth failed:", error);
          }
          return null;
        }

        // Handle normal password-based authentication
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
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Let NextAuth handle all cookie settings automatically
  // This should work better with Cloudflare
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log("JWT callback:", {
        hasToken: !!token,
        hasUser: !!user,
        tokenSub: token?.sub,
        userId: user?.id,
        userRole: user?.role,
        accountProvider: account?.provider,
        isNewUser
      });

      if (user) {
        token.id = user.id;
        token.role = user.role;
        console.log("JWT callback - setting token.id and token.role");
      }

      return token;
    },
    async session({ session, token }) {
      console.log("Session callback:", {
        hasSession: !!session,
        hasToken: !!token,
        tokenId: token?.id,
        tokenRole: token?.role,
        sessionUserId: session?.user?.id
      });

      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        console.log("Session callback - updated session.user");
      }

      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
};

export default NextAuth(authOptions);
