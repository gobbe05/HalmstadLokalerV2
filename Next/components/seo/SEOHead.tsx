'use client'
//import { Helmet } from "react-helmet-async";
import { Property } from "@/types/property";
import { useCityContext } from "@/contexts/CityContext";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  property?: Property;
  type?: "website" | "article";
  image?: string;
  /** For paginated pages: URL of the previous page (without domain) */
  prevPage?: string;
  /** For paginated pages: URL of the next page (without domain) */
  nextPage?: string;
}

const DEFAULT_OG_IMAGE = "/og-image.jpg";

export function SEOHead({
  title,
  description,
  canonical,
  property,
  type = "website",
  image,
  prevPage,
  nextPage,
}: SEOHeadProps) {
  const { currentCity } = useCityContext();
  
  // Dynamic defaults based on current city
  const cityName = currentCity?.name || "Halmstad";
  const siteName = `${cityName}Lokaler`;
  const siteUrl = currentCity?.domain 
    ? `https://${currentCity.domain}` 
    : "https://halmstadlokaler.se";
  
  const defaultTitle = currentCity?.seo_title || 
    `Lediga lokaler i ${cityName} – Kontor, Lager & Butiker | ${siteName}`;
  const defaultDescription = currentCity?.seo_description ||
    `Hitta lediga lokaler i ${cityName}. Kontor, lager, butiker, industrier, restauranger och mer. Filtrera snabbt bland kommersiella objekt och kontakta fastighetsägare direkt.`;

  const pageTitle = title || defaultTitle;
  const pageDescription = description || defaultDescription;
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;
  
  // OG image priority: explicit prop → property image → city OG image → city hero → default
  const ogImage = image 
    || property?.images?.[0] 
    || currentCity?.og_image_url 
    || currentCity?.hero_image_url
    || `${siteUrl}${DEFAULT_OG_IMAGE}`;

  // Generate structured data for property (Place schema for SEO)
  const structuredData = property
    ? {
        "@context": "https://schema.org",
        "@type": "Place",
        name: property.title,
        description: property.descriptionShort || property.description,
        image: property.images,
        address: {
          "@type": "PostalAddress",
          streetAddress: property.address,
          postalCode: property.postalCode,
          addressLocality: property.city || cityName,
          addressCountry: "SE",
        },
        ...(property.latitude && property.longitude
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: property.latitude,
                longitude: property.longitude,
              },
            }
          : {}),
        ...(property.rentPerSqmYear && property.area
          ? {
              additionalProperty: {
                "@type": "PropertyValue",
                name: "monthlyRent",
                value: Math.round((property.rentPerSqmYear * property.area) / 12),
                unitCode: "SEK",
              },
            }
          : {}),
      }
    : {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteName,
        description: defaultDescription,
        url: siteUrl,
        areaServed: {
          "@type": "City",
          name: cityName,
        },
      };

  return (
    <></>

  );
}

