'use client'

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface City {
  id: string;
  name: string;
  domain: string | null;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  intro_text: string | null;
  hero_image_url: string | null;
  hero_blur_placeholder: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CityContextValue {
  currentCity: City | null;
  cities: City[];
  isLoading: boolean;
  getCityById: (id: string) => City | undefined;
}

const CityContext = createContext<CityContextValue | undefined>(undefined);

// Detect city from hostname
function detectCityFromDomain(cities: City[], hostname: string): City | null {
  // Check exact domain match
  const exactMatch = cities.find(c => c.domain === hostname);
  if (exactMatch) return exactMatch;

  // Check subdomain match (e.g., halmstad.example.com)
  const subdomain = hostname.split('.')[0];
  const subdomainMatch = cities.find(c => c.id === subdomain);
  if (subdomainMatch) return subdomainMatch;

  // Default to first city (halmstad) or null
  return cities.find(c => c.id === 'halmstad') || cities[0] || null;
}

export function CityProvider({ children }: { children: ReactNode }) {
  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: async (): Promise<City[]> => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const currentCity = useMemo(() => {
    if (cities.length === 0) return null;
    const hostname = window.location.hostname;
    return detectCityFromDomain(cities, hostname);
  }, [cities]);

  const getCityById = (id: string) => cities.find(c => c.id === id);

  return (
    <CityContext.Provider value={{ currentCity, cities, isLoading, getCityById }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCityContext() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCityContext must be used within a CityProvider");
  }
  return context;
}
