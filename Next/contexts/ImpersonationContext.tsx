'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";

interface ImpersonationContextType {
  isImpersonating: boolean;
  originalSession: Session | null;
  startImpersonation: (session: Session) => void;
  endImpersonation: () => Session | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

const STORAGE_KEY = "admin_original_session";

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalSession, setOriginalSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check if there's a stored admin session on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored) as Session;
        setOriginalSession(session);
        setIsImpersonating(true);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const startImpersonation = (session: Session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setOriginalSession(session);
    setIsImpersonating(true);
  };

  const endImpersonation = (): Session | null => {
    const session = originalSession;
    localStorage.removeItem(STORAGE_KEY);
    setOriginalSession(null);
    setIsImpersonating(false);
    return session;
  };

  return (
    <ImpersonationContext.Provider value={{ isImpersonating, originalSession, startImpersonation, endImpersonation }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error("useImpersonation must be used within an ImpersonationProvider");
  }
  return context;
}
