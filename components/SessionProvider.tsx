"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={30 * 60} // Refetch session every 30 minutes
      refetchOnWindowFocus={false} // Disable to prevent unnecessary refetches
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
