import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

export type AppRole = "admin" | "advertiser";

interface PublicUserRole {
  role: AppRole | null;
  isAdmin: boolean;
  isAdvertiser: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Standalone hook that doesn't require PublicAuthProvider.
 * All authenticated users are treated as advertisers.
 */
export function usePublicUserRole(): PublicUserRole {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const { data, isLoading: dataLoading } = useQuery({
    queryKey: ["public-user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return { role: null };
      
      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching user role:", roleError);
      }

      // All users are advertisers (except admins)
      const userRole = roleData?.role as AppRole | null;
      return {
        role: userRole === "admin" ? "admin" : "advertiser",
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const isLoading = authLoading || dataLoading;
  const role = (data?.role as AppRole | null) || null;

  return {
    role,
    isAdmin: role === "admin",
    isAdvertiser: !!user, // All authenticated users are advertisers
    isLoading,
    isAuthenticated: !!user,
  };
}
