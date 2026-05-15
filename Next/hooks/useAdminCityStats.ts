import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CityStats {
  id: string;
  listings_count: number;
  customers_count: number;
}

/**
 * ADMIN ONLY: Fetches statistics per city.
 * - listings_count: Number of published listings in this city
 * - customers_count: Number of customers with this city in allowed_cities
 */
export function useAdminCityStats() {
  return useQuery({
    queryKey: ["admin-city-stats"],
    queryFn: async (): Promise<Map<string, CityStats>> => {
      // Fetch all listings grouped by city_id
      const { data: listings } = await supabase
        .from("listings")
        .select("city_id")
        .eq("status", "published")
        .is("deleted_at", null);

      // Fetch all profiles with allowed_cities
      const { data: profiles } = await supabase
        .from("profiles")
        .select("allowed_cities")
        .is("deleted_at", null);

      // Count listings per city
      const listingsMap = new Map<string, number>();
      listings?.forEach((listing) => {
        if (listing.city_id) {
          listingsMap.set(listing.city_id, (listingsMap.get(listing.city_id) || 0) + 1);
        }
      });

      // Count customers per city
      const customersMap = new Map<string, number>();
      profiles?.forEach((profile) => {
        if (profile.allowed_cities && Array.isArray(profile.allowed_cities)) {
          profile.allowed_cities.forEach((cityId: string) => {
            customersMap.set(cityId, (customersMap.get(cityId) || 0) + 1);
          });
        }
      });

      // Combine into result map
      const result = new Map<string, CityStats>();
      const allCityIds = new Set([...listingsMap.keys(), ...customersMap.keys()]);
      
      allCityIds.forEach((cityId) => {
        result.set(cityId, {
          id: cityId,
          listings_count: listingsMap.get(cityId) || 0,
          customers_count: customersMap.get(cityId) || 0,
        });
      });

      return result;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
