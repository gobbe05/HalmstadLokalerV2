import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export type AppRole = "admin" | "advertiser";

interface UserRole {
  role: AppRole;
  isAdmin: boolean;
  isAdvertiser: boolean;
  isLoading: boolean;
}

export function useUserRole(): UserRole {
  const { user } = useAuthContext();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return "advertiser" as AppRole;
      }

      // All users are advertisers (except admins)
      const userRole = data?.role as AppRole;
      return userRole === "admin" ? "admin" : "advertiser";
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  return {
    role: role || "advertiser",
    isAdmin: role === "admin",
    isAdvertiser: role === "advertiser" || role === "admin",
    isLoading,
  };
}
