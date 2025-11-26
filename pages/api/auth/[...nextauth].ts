import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Handle payment-based authentication (for users who just completed payment)
        if ((credentials as any)?.paymentIntentId && !credentials?.password) {
          // Verify the payment intent belongs to this user
          const { prisma } = await import("../../../lib/prisma");
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-07-30.basil",
          });

          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(credentials.paymentIntentId);
            const userId = paymentIntent.metadata.userId;

            if (userId) {
              const user = await prisma.user.findUnique({
                where: { id: userId }
              });

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
  // Explicit cookie settings with domain for proper session persistence
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: 'rydercomps.co.uk',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: 'rydercomps.co.uk',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: 'rydercomps.co.uk',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
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
  // Debug in development
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
