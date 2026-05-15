import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  company_logo: string | null;
  display_name: string | null;
  email: string | null;
}

/**
 * Hook to get the current authenticated user's profile.
 * This is the SINGLE SOURCE OF TRUTH for profile data used to filter
 * all advertiser-specific queries.
 * 
 * SECURITY: All hooks that fetch advertiser-specific data MUST use
 * this hook's profile.id to filter by owner_id.
 */
export function useCurrentProfile() {
  return useQuery({
    queryKey: ["current-profile"],
    queryFn: async (): Promise<CurrentProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, user_id, company_name, company_logo, display_name, email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return profile;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Helper function to get current profile ID for use in non-hook contexts.
 * SECURITY: Use this to ensure all queries filter by the correct owner_id.
 */
export async function getCurrentProfileId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return profile?.id || null;
}
