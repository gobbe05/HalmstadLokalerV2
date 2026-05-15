/**
 * ============================================================================
 * CENTRALIZED AUTH GUARD - SINGLE SOURCE OF TRUTH
 * ============================================================================
 * 
 * This module provides the ONLY authorized way to check if an account is
 * allowed to access the application.
 * 
 * ⚠️ SECURITY MANDATE:
 * - NO UI component may perform its own account status checks
 * - ALL authentication flows MUST use checkAccountStatus() from this module
 * - This includes: login, session restore, magic links, password reset, etc.
 * 
 * Blocked accounts (soft-deleted or inactive) will:
 * 1. Have their session terminated
 * 2. Receive the standard error message
 * 3. Have an audit event logged
 * 
 * ============================================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { addBreadcrumb } from "@/lib/sentry";

// Standardized error for blocked accounts
export const ACCOUNT_DISABLED_ERROR = "ACCOUNT_DISABLED";
export const ACCOUNT_DISABLED_MESSAGE = "Detta konto har inaktiverats. Kontakta support för mer information.";

export interface AccountStatusResult {
  allowed: boolean;
  reason?: "soft_deleted" | "inactive" | "not_found";
}

/**
 * Check if an account is allowed to access the application.
 * 
 * @param userId - The user's auth ID
 * @returns AccountStatusResult indicating if access is allowed
 */
export async function checkAccountStatus(userId: string): Promise<AccountStatusResult> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, deleted_at, is_active, email")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[AuthGuard] Error fetching profile:", error);
      // On error, allow access (fail-open for DB errors, fail-closed for security checks)
      return { allowed: true };
    }

    // Profile not found - this could be a new user, allow access
    if (!profile) {
      return { allowed: true };
    }

    // Check if soft-deleted
    if (profile.deleted_at) {
      logBlockedAccess(userId, profile.email, "soft_deleted");
      return { allowed: false, reason: "soft_deleted" };
    }

    // Check if inactive
    if (profile.is_active === false) {
      logBlockedAccess(userId, profile.email, "inactive");
      return { allowed: false, reason: "inactive" };
    }

    return { allowed: true };
  } catch (err) {
    console.error("[AuthGuard] Unexpected error:", err);
    return { allowed: true };
  }
}

/**
 * Enforce account status - signs out user if account is blocked.
 * Use this after login or on session restore.
 * 
 * @param userId - The user's auth ID
 * @returns true if account is allowed, false if blocked (and signed out)
 */
export async function enforceAccountStatus(userId: string): Promise<boolean> {
  const status = await checkAccountStatus(userId);
  
  if (!status.allowed) {
    // Sign out the user
    await supabase.auth.signOut();
    return false;
  }
  
  return true;
}

/**
 * Log audit event for blocked access attempts.
 */
function logBlockedAccess(userId: string, email: string | null, reason: string): void {
  // Log to Sentry for monitoring
  addBreadcrumb("auth", "AUTH_BLOCKED_INACTIVE_ACCOUNT", {
    userId,
    email: email || "unknown",
    reason,
    timestamp: new Date().toISOString(),
  });
  
  console.warn(
    `[AuthGuard] Access blocked for user ${userId} (${email || "unknown"}). Reason: ${reason}`
  );
}

/**
 * Get the standard error message for disabled accounts.
 */
export function getDisabledAccountMessage(): string {
  return ACCOUNT_DISABLED_MESSAGE;
}
