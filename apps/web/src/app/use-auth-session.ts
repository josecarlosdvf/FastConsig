"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readSession, type SessionState } from "../services/session-client";

export function useAuthSession(): SessionState | null {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    setSession(current);
  }, [router]);

  return session;
}

