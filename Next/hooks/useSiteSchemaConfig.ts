import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCityContext } from "@/contexts/CityContext";

export interface SiteSchemaConfig {
  id: string;
  city_id: string;
  local_business_enabled: boolean;
  local_business_type: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  price_range: string | null;
  geo_radius_km: number | null;
  same_as: string[];
  article_publisher: string | null;
  created_at: string;
  updated_at: string;
}

export function useSiteSchemaConfig(cityId?: string) {
  const { currentCity } = useCityContext();
  const effectiveCityId = cityId || currentCity?.id;

  return useQuery({
    queryKey: ["site-schema-config", effectiveCityId],
    queryFn: async (): Promise<SiteSchemaConfig | null> => {
      if (!effectiveCityId) return null;

      const { data, error } = await supabase
        .from("site_schema_config")
        .select("*")
        .eq("city_id", effectiveCityId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching site schema config:", error);
        return null;
      }

      return data as SiteSchemaConfig | null;
    },
    enabled: !!effectiveCityId,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}
