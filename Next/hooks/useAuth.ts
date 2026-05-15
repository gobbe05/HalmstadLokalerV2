/**
 * ============================================================================
 * useAuth Hook - Core Authentication State Management
 * ============================================================================
 * 
 * ⚠️ SECURITY: This hook uses the centralized authGuard for account status
 * checks. Do NOT add custom status checks here - use authGuard.ts instead.
 * 
 * ============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setUserContext, clearUserContext, addBreadcrumb } from "@/lib/sentry";
import { checkAccountStatus, ACCOUNT_DISABLED_MESSAGE } from "@/lib/authGuard";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // For sign-in events, check account status
        if (event === "SIGNED_IN" && newSession?.user) {
          // Use setTimeout to prevent Supabase auth deadlock
          setTimeout(async () => {
            const status = await checkAccountStatus(newSession.user.id);
            
            if (!status.allowed) {
              // Account is blocked - sign out
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              clearUserContext();
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

        // Update Sentry user context
        if (newSession?.user) {
          setUserContext(newSession.user.id, newSession.user.email);
          addBreadcrumb("auth", `User ${event}`, { userId: newSession.user.id });
        } else {
          clearUserContext();
          addBreadcrumb("auth", "User signed out");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        // Check if existing session belongs to a blocked account
        const status = await checkAccountStatus(existingSession.user.id);
        
        if (!status.allowed) {
          // Account is blocked - sign out
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          clearUserContext();
          addBreadcrumb("auth", "AUTH_BLOCKED_ON_SESSION_RESTORE", { 
            userId: existingSession.user.id,
            reason: status.reason 
          });
          return;
        }
        
        setUserContext(existingSession.user.id, existingSession.user.email);
      }
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Check account status after successful login
    if (!error && data.user) {
      const status = await checkAccountStatus(data.user.id);
      if (!status.allowed) {
        await supabase.auth.signOut();
        return { error: new Error(ACCOUNT_DISABLED_MESSAGE) };
      }
    }
    
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!session,
  };
}
