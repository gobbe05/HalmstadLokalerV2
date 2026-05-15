// components/seo/RealEstateListingSchema.tsx
import { Property } from "@/types/property";

interface RealEstateListingSchemaProps {
  property: Property;
  currentCity?: {
    name?: string;
    domain?: string;
  };
}

export function RealEstateListingSchema({
  property,
  currentCity,
}: RealEstateListingSchemaProps) {
  const cityName = currentCity?.name || "Halmstad";

  const siteUrl = currentCity?.domain
    ? `https://${currentCity.domain}`
    : "https://halmstadlokaler.se";

  const propertyUrl = `${siteUrl}/lokal/${property.slug}`;

  const monthlyRent =
    property.rentPerSqmYear && property.area
      ? Math.round((property.rentPerSqmYear * property.area) / 12)
      : null;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.descriptionShort || property.description,
    url: propertyUrl,
    datePosted: property.createdAt,
  };

  if (property.images?.length) {
    structuredData.image = property.images;
  }

  if (monthlyRent) {
    structuredData.offers = {
      "@type": "Offer",
      price: monthlyRent,
      priceCurrency: "SEK",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: monthlyRent,
        priceCurrency: "SEK",
        unitText: "månad",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "MON",
        },
      },
      availability: "https://schema.org/InStock",
    };
  }

  if (property.address || property.city || property.postalCode) {
    structuredData.address = {
      "@type": "PostalAddress",
      streetAddress: property.address || undefined,
      postalCode: property.postalCode || undefined,
      addressLocality: property.city || cityName,
      addressCountry: "SE",
    };
  }

  if (property.latitude && property.longitude) {
    structuredData.geo = {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }

  if (property.area) {
    structuredData.floorSize = {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK",
      unitText: "m²",
    };
  }

  if (property.typeLabel) {
    structuredData.additionalType = property.typeLabel;
  }

  if (property.advertiser) {
    const seller: Record<string, unknown> = {
      "@type": "Organization",
      name: property.advertiser.companyName || "Annonsör",
    };

    if (property.advertiser.email) seller.email = property.advertiser.email;
    if (property.advertiser.phone) seller.telephone = property.advertiser.phone;
    if (property.advertiser.companyLogo) seller.logo = property.advertiser.companyLogo;

    if (property.advertiser.address || property.advertiser.city) {
      seller.address = {
        "@type": "PostalAddress",
        streetAddress: property.advertiser.address || undefined,
        addressLocality: property.advertiser.city || undefined,
        addressCountry: "SE",
      };
    }

    structuredData.seller = seller;
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
