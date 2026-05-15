'use client'
import { useEffect } from "react";
import { useListings } from "@/hooks/useListings";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

const SESSION_REDIRECT_KEY = "onboarding_redirect_done";

/**
 * Component that checks if the user has any listings.
 * 
 * Routing logic (only runs ONCE per browser session):
 * - If user has no listings → redirect to /app/lokaler/ny to create first listing
 * 
 * After creating a listing, the user is redirected to /app/profil to complete their profile.
 */
export function OnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: listings, isLoading: listingsLoading } = useListings();

  useEffect(() => {
    // Only redirect from the main dashboard
    if (location.pathname !== "/app") return;
    
    // Wait for listings to load
    if (listingsLoading) return;
    
    // Check if redirect already happened this session (persists across navigations)
    if (sessionStorage.getItem(SESSION_REDIRECT_KEY) === "true") return;

    // If user has no listings, redirect to profile page to complete profile first
    if (!listings || listings.length === 0) {
      sessionStorage.setItem(SESSION_REDIRECT_KEY, "true");
      router.replace("/app/profil");
      return;
    }

    // Mark as checked
    sessionStorage.setItem(SESSION_REDIRECT_KEY, "true");
  }, [listings, listingsLoading, router, location.pathname]);

  return null;
}

