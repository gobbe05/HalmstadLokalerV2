// components/seo/ItemListSchema.tsx
import { Property } from "@/types/property";

interface ItemListSchemaProps {
  name: string;
  properties: Property[];
  maxItems?: number;
  currentCity?: {
    name?: string;
    domain?: string;
  };
}

export function ItemListSchema({
  name,
  properties,
  maxItems = 10,
  currentCity,
}: ItemListSchemaProps) {
  const siteUrl = currentCity?.domain
    ? `https://${currentCity.domain}`
    : "https://halmstadlokaler.se";

  const limitedProperties = properties.slice(0, maxItems);

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
