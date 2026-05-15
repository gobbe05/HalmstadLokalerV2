'use client'
import { Property } from "@/types/property";
import { useCityContext } from "@/contexts/CityContext";

interface RealEstateListingSchemaProps {
  property: Property;
}

/**
 * Renders RealEstateListing JSON-LD structured data for property detail pages.
 * This is more specific than the generic Offer+Place schema and is better
 * recognized by Google for real estate listings.
 */
export function RealEstateListingSchema({ property }: RealEstateListingSchemaProps) {
  const { currentCity } = useCityContext();

  const siteUrl = currentCity?.domain
    ? `https://${currentCity.domain}`
    : "https://halmstadlokaler.se";

  const propertyUrl = `${siteUrl}/lokal/${property.slug}`;
  
  const monthlyRent = property.rentPerSqmYear && property.area
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

  // Images
  if (property.images && property.images.length > 0) {
    structuredData.image = property.images;
  }

  // Offer with price
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

  // Address
  if (property.address || property.city || property.postalCode) {
    structuredData.address = {
      "@type": "PostalAddress",
      streetAddress: property.address || undefined,
      postalCode: property.postalCode || undefined,
      addressLocality: property.city || currentCity?.name || "Halmstad",
      addressCountry: "SE",
    };
  }

  // Geo coordinates
  if (property.latitude && property.longitude) {
    structuredData.geo = {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }

  // Floor size
  if (property.area) {
    structuredData.floorSize = {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK",
      unitText: "m²",
    };
  }

  // Property type
  if (property.typeLabel) {
    structuredData.additionalType = property.typeLabel;
  }

  // Seller/advertiser info
  if (property.advertiser) {
    const seller: Record<string, unknown> = {
      "@type": "Organization",
      name: property.advertiser.companyName || "Annonsör",
    };

    if (property.advertiser.email) {
      seller.email = property.advertiser.email;
    }
    if (property.advertiser.phone) {
      seller.telephone = property.advertiser.phone;
    }
    if (property.advertiser.companyLogo) {
      seller.logo = property.advertiser.companyLogo;
    }
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
    /*<Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>*/
    <></>
  );
}

