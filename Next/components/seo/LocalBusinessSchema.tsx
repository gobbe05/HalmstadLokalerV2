'use client'
import { useCityContext } from "@/contexts/CityContext";
import { useSiteSchemaConfig } from "@/hooks/useSiteSchemaConfig";

interface LocalBusinessSchemaProps {
  /** Override city ID (defaults to current city) */
  cityId?: string;
}

/**
 * Renders LocalBusiness/RealEstateAgent JSON-LD structured data
 * for the current city/site. Used on home pages.
 */
export function LocalBusinessSchema({ cityId }: LocalBusinessSchemaProps) {
  const { currentCity } = useCityContext();
  const { data: schemaConfig } = useSiteSchemaConfig(cityId);

  // Don't render if no city or schema disabled
  if (!currentCity) return null;
  if (schemaConfig && !schemaConfig.local_business_enabled) return null;

  const siteUrl = currentCity.domain
    ? `https://${currentCity.domain}`
    : `https://${currentCity.id}lokaler.se`;

  const siteName = `${currentCity.name}Lokaler`;

  // Parse opening hours into OpeningHoursSpecification if available
  const openingHoursSpec = schemaConfig?.opening_hours
    ? parseOpeningHours(schemaConfig.opening_hours)
    : undefined;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaConfig?.local_business_type || "RealEstateAgent",
    name: siteName,
    url: siteUrl,
    description: currentCity.seo_description || `Lediga lokaler i ${currentCity.name}`,
    areaServed: {
      "@type": "City",
      name: currentCity.name,
    },
  };

  // Add optional fields if configured
  if (schemaConfig?.phone) {
    structuredData.telephone = schemaConfig.phone;
  }

  if (schemaConfig?.email) {
    structuredData.email = schemaConfig.email;
  }

  if (schemaConfig?.price_range) {
    structuredData.priceRange = schemaConfig.price_range;
  }

  if (openingHoursSpec) {
    structuredData.openingHoursSpecification = openingHoursSpec;
  }

  if (schemaConfig?.same_as && schemaConfig.same_as.length > 0) {
    structuredData.sameAs = schemaConfig.same_as;
  }

  if (schemaConfig?.geo_radius_km) {
    structuredData.areaServed = {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        // Default coordinates for city center - could be stored in cities table
        addressCountry: "SE",
      },
      geoRadius: `${schemaConfig.geo_radius_km} km`,
    };
  }

  // Add logo if city has OG image
  if (currentCity.og_image_url) {
    structuredData.logo = currentCity.og_image_url;
  }

  return (
    /*
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>*/
    <></>
  );
}

/**
 * Parse opening hours string (e.g., "Mo-Fr 08:00-17:00") 
 * into schema.org OpeningHoursSpecification format
 */
function parseOpeningHours(hoursString: string): Record<string, unknown>[] | undefined {
  // Simple parser for common formats like "Mo-Fr 08:00-17:00"
  const patterns = [
    {
      regex: /Mo-Fr\s+(\d{2}:\d{2})-(\d{2}:\d{2})/i,
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    {
      regex: /Mo-Su\s+(\d{2}:\d{2})-(\d{2}:\d{2})/i,
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
  ];

  for (const pattern of patterns) {
    const match = hoursString.match(pattern.regex);
    if (match) {
      return [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: pattern.days,
        opens: match[1],
        closes: match[2],
      }];
    }
  }

  // Return undefined if pattern not recognized
  return undefined;
}

