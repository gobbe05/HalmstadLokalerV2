// components/seo/LocalBusinessSchema.tsx
interface LocalBusinessSchemaProps {
  currentCity: {
    id: string;
    name: string;
    domain?: string;
    seo_description?: string;
    og_image_url?: string;
  };
  schemaConfig?: {
    local_business_enabled?: boolean;
    local_business_type?: string;
    phone?: string;
    email?: string;
    price_range?: string;
    opening_hours?: string;
    same_as?: string[];
    geo_radius_km?: number;
  };
}

export function LocalBusinessSchema({ currentCity, schemaConfig }: LocalBusinessSchemaProps) {
  if (!currentCity) return null;
  if (schemaConfig && !schemaConfig.local_business_enabled) return null;

  const siteUrl = currentCity.domain
    ? `https://${currentCity.domain}`
    : `https://${currentCity.id}lokaler.se`;

  const siteName = `${currentCity.name}Lokaler`;

  const openingHoursSpec = schemaConfig?.opening_hours
    ? parseOpeningHours(schemaConfig.opening_hours)
    : undefined;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaConfig?.local_business_type || "RealEstateAgent",
    name: siteName,
    url: siteUrl,
    description:
      currentCity.seo_description ||
      `Lediga lokaler i ${currentCity.name}`,
    areaServed: {
      "@type": "City",
      name: currentCity.name,
    },
  };

  if (schemaConfig?.phone) structuredData.telephone = schemaConfig.phone;
  if (schemaConfig?.email) structuredData.email = schemaConfig.email;
  if (schemaConfig?.price_range) structuredData.priceRange = schemaConfig.price_range;
  if (openingHoursSpec) structuredData.openingHoursSpecification = openingHoursSpec;
  if (schemaConfig?.same_as?.length) structuredData.sameAs = schemaConfig.same_as;

  if (schemaConfig?.geo_radius_km) {
    structuredData.areaServed = {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        addressCountry: "SE",
      },
      geoRadius: `${schemaConfig.geo_radius_km} km`,
    };
  }

  if (currentCity.og_image_url) {
    structuredData.logo = currentCity.og_image_url;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

function parseOpeningHours(hoursString: string): Record<string, unknown>[] | undefined {
  const patterns = [
    {
      regex: /Mo-Fr\s+(\d{2}:\d{2})-(\d{2}:\d{2})/i,
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    {
      regex: /Mo-Su\s+(\d{2}:\d{2})-(\d{2}:\d{2})/i,
      days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
  ];

  for (const pattern of patterns) {
    const match = hoursString.match(pattern.regex);
    if (match) {
      return [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: pattern.days,
          opens: match[1],
          closes: match[2],
        },
      ];
    }
  }

  return undefined;
}
