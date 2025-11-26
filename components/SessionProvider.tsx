"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect } from "react";

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  useEffect(() => {
    console.log("SessionProvider: Initial session:", session);
  }, [session]);

  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={0} // Disable automatic refetch
      refetchOnWindowFocus={true} // Enable refetch on focus
    >
      {children}
    </NextAuthSessionProvider>
  );
}
