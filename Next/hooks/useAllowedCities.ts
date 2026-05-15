import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCities } from "./useCities";

export function useAllowedCities() {
  const { data: allCities = [], isLoading: citiesLoading } = useCities();

  const { data: allowedCityIds, isLoading: profileLoading } = useQuery({
    queryKey: ["my-allowed-cities"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("allowed_cities")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return profile?.allowed_cities || [];
    },
  });

  // If allowed_cities is null/empty, return all cities (admin or not restricted)
  const cities = allowedCityIds && allowedCityIds.length > 0
    ? allCities.filter(city => allowedCityIds.includes(city.id))
    : allCities;

  return {
    cities,
    allowedCityIds,
    isLoading: citiesLoading || profileLoading,
    isRestricted: allowedCityIds && allowedCityIds.length > 0,
  };
}
