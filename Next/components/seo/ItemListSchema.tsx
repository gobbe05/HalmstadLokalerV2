'use client'
import { Helmet } from "react-helmet-async";
import { Property } from "@/types/property";
import { useCityContext } from "@/contexts/CityContext";

interface ItemListSchemaProps {
  /** List title, e.g., "Lediga kontor i Halmstad" */
  name: string;
  /** Properties to include in the list */
  properties: Property[];
  /** Maximum items to include (default 10 for performance) */
  maxItems?: number;
}

/**
 * Renders ItemList JSON-LD structured data for category/listing pages.
 * This helps Google understand that the page contains a list of items
 * and can enable rich snippets in search results.
 */
export function ItemListSchema({ name, properties, maxItems = 10 }: ItemListSchemaProps) {
  const { currentCity } = useCityContext();

  const siteUrl = currentCity?.domain
    ? `https://${currentCity.domain}`
    : "https://halmstadlokaler.se";

  // Limit items for performance (too many items can slow down parsing)
  const limitedProperties = properties.slice(0, maxItems);

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: name,
    numberOfItems: properties.length,
    itemListElement: limitedProperties.map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "RealEstateListing",
        name: property.title,
        url: `${siteUrl}/lokal/${property.slug}`,
        description: property.descriptionShort || undefined,
        image: property.images?.[0] || undefined,
        ...(property.area && {
          floorSize: {
            "@type": "QuantitativeValue",
            value: property.area,
            unitCode: "MTK",
            unitText: "m²",
          },
        }),
        ...(property.address && {
          address: {
            "@type": "PostalAddress",
            streetAddress: property.address,
            addressLocality: property.city || currentCity?.name,
            addressCountry: "SE",
          },
        }),
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

