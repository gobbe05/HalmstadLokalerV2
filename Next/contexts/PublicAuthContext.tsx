'use client'

/**
 * ============================================================================
 * PublicAuthContext - Public Website Authentication
 * ============================================================================
 * 
 * ⚠️ SECURITY: This context uses the centralized authGuard for account status
 * checks. Do NOT add custom status checks here - use authGuard.ts instead.
 * 
 * ============================================================================
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { checkAccountStatus, ACCOUNT_DISABLED_MESSAGE } from "@/lib/authGuard";
import { addBreadcrumb } from "@/lib/sentry";

interface PublicAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithMicrosoft: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const PublicAuthContext = createContext<PublicAuthContextType | undefined>(undefined);

export function PublicAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // For sign-in events, check account status
        if (event === "SIGNED_IN" && newSession?.user) {
          // Use setTimeout to prevent Supabase auth deadlock
          setTimeout(async () => {
            const status = await checkAccountStatus(newSession.user.id);
            
            if (!status.allowed) {
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              addBreadcrumb("auth", "AUTH_BLOCKED_INACTIVE_ACCOUNT", { 
                userId: newSession.user.id,
                reason: status.reason 
              });
              return;
            }
          }, 0);
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        // Check if existing session belongs to a blocked account
        const status = await checkAccountStatus(existingSession.user.id);
        
        if (!status.allowed) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          addBreadcrumb("auth", "AUTH_BLOCKED_ON_SESSION_RESTORE", { 
            userId: existingSession.user.id,
            reason: status.reason 
          });
          return;
        }
      }
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    // Check account status after successful login
    if (!error && data.user) {
      const status = await checkAccountStatus(data.user.id);
      if (!status.allowed) {
        await supabase.auth.signOut();
        return { error: new Error(ACCOUNT_DISABLED_MESSAGE) as Error | null };
      }
    }
    
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { 
          display_name: name,
          // No user_type - neutral registration
        },
      },
    });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error: error as Error | null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error: error as Error | null };
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: "email profile openid",
      },
    });
    return { error: error as Error | null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error: error as Error | null };
  }, []);

  return (
    <PublicAuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: !!session,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithMicrosoft,
        resetPassword,
      }}
    >
      {children}
    </PublicAuthContext.Provider>
  );
}

export function usePublicAuth() {
  const context = useContext(PublicAuthContext);
  if (context === undefined) {
    throw new Error("usePublicAuth must be used within a PublicAuthProvider");
  }
  return context;
}
