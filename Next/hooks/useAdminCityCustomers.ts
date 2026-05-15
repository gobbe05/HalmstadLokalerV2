import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CityCustomer {
  id: string;
  company_name: string | null;
  display_name: string | null;
  email: string | null;
  status: string;
}

/**
 * ADMIN ONLY: Fetches customers connected to a specific city via allowed_cities.
 */
export function useAdminCityCustomers(cityId: string | null) {
  return useQuery({
    queryKey: ["admin-city-customers", cityId],
    queryFn: async (): Promise<CityCustomer[]> => {
      if (!cityId) return [];

      // Fetch profiles where cityId is in allowed_cities array
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, company_name, display_name, email, status")
        .contains("allowed_cities", [cityId])
        .is("deleted_at", null)
        .order("company_name", { ascending: true });

      if (error) {
        console.error("Error fetching city customers:", error);
        return [];
      }

      return profiles || [];
    },
    enabled: !!cityId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
