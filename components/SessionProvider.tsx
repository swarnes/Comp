"use client";

import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";

function SessionDebugger() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    console.log("=== SESSION DEBUGGER ===");
    console.log("useSession status:", status);
    console.log("useSession data:", JSON.stringify(session, null, 2));
    console.log("Cookies available:", document.cookie);
    console.log("========================");
  }, [session, status]);
  
  return null;
}

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  useEffect(() => {
    console.log("=== SESSION PROVIDER INIT ===");
    console.log("Initial session prop:", JSON.stringify(session, null, 2));
    console.log("=============================");
  }, [session]);

  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={true}
    >
      <SessionDebugger />
      {children}
    </NextAuthSessionProvider>
  );
}
