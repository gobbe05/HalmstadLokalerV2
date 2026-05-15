// City-specific hero image configuration
// Add new cities here as they are onboarded

export interface CityImageConfig {
  imageUrl: string;
}

export const cityImageConfig: Record<string, CityImageConfig> = {
  halmstad: {
    imageUrl: "/images/cities/halmstad-hero.jpg",
  },
  varberg: {
    imageUrl: "/images/cities/varberg-hero.jpg",
  },
  falkenberg: {
    imageUrl: "/images/cities/falkenberg-hero.jpg",
  },
  // Add more cities as needed
};

// Fallback gradient when no city image is available
export const fallbackGradient = "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700";

export function getCityImageUrl(cityId: string | undefined): string | null {
  if (!cityId) return null;
  return cityImageConfig[cityId.toLowerCase()]?.imageUrl || null;
}
