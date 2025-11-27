import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

console.log('[NextAuth Config] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('[NextAuth Config] NEXTAUTH_SECRET set:', !!process.env.NEXTAUTH_SECRET);

export const authOptions: NextAuthOptions = {
  // No adapter - using JWT only for credentials provider
  debug: true,
  // Force useSecureCookies to false to avoid __Secure- prefix issues
  useSecureCookies: false,
  // Explicit cookie configuration to ensure cookies pass through proxy
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true, // Required for HTTPS
      },
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
        console.log('[NextAuth] authorize called with email:', credentials?.email);
        
        // Handle normal password-based authentication
        if (!credentials?.email || !credentials?.password) {
          console.log('[NextAuth] Missing credentials');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          console.log('[NextAuth] User lookup result:', user ? { id: user.id, email: user.email, hasPassword: !!user.password } : 'NOT FOUND');

          if (!user || !user.password) {
            console.log('[NextAuth] User not found or no password');
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          console.log('[NextAuth] Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('[NextAuth] Password mismatch');
            return null;
          }

          console.log('[NextAuth] Login successful for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            role: user.role
          } as any;
        } catch (error) {
          console.error('[NextAuth] Error during authorization:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Let NextAuth handle cookies automatically based on NEXTAUTH_URL
  callbacks: {
    async jwt({ token, user, trigger }) {
      console.log('[NextAuth JWT] trigger:', trigger, 'hasUser:', !!user, 'tokenSub:', token?.sub);
      if (user) {
        token.id = user.id;
        token.role = user.role;
        console.log('[NextAuth JWT] Added user to token:', { id: user.id, role: user.role });
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth Session] Creating session, tokenId:', token?.id);
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      console.log('[NextAuth Session] Returning session:', { userId: session?.user?.id, role: session?.user?.role });
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
};

export default NextAuth(authOptions);
