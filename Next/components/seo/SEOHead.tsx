// components/seo/SEOHead.tsx
import { Property } from "@/types/property";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  property?: Property;
  type?: "website" | "article";
  image?: string;
  prevPage?: string;
  nextPage?: string;
  currentCity?: {
    name?: string;
    domain?: string;
    seo_title?: string;
    seo_description?: string;
    og_image_url?: string;
    hero_image_url?: string;
  };
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
  currentCity,
}: SEOHeadProps) {
  const cityName = currentCity?.name || "Halmstad";
  const siteName = `${cityName}Lokaler`;
  const siteUrl = currentCity?.domain
    ? `https://${currentCity.domain}`
    : "https://halmstadlokaler.se";

  const defaultTitle =
    currentCity?.seo_title ||
    `Lediga lokaler i ${cityName} – Kontor, Lager & Butiker | ${siteName}`;

  const defaultDescription =
    currentCity?.seo_description ||
    `Hitta lediga lokaler i ${cityName}. Kontor, lager, butiker, industrier, restauranger och mer.`;

  const pageTitle = title || defaultTitle;
  const pageDescription = description || defaultDescription;
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;

  const ogImage =
    image ||
    property?.images?.[0] ||
    currentCity?.og_image_url ||
    currentCity?.hero_image_url ||
    `${siteUrl}${DEFAULT_OG_IMAGE}`;

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
        ...(property.latitude &&
          property.longitude && {
            geo: {
              "@type": "GeoCoordinates",
              latitude: property.latitude,
              longitude: property.longitude,
            },
          }),
        ...(property.rentPerSqmYear &&
          property.area && {
            additionalProperty: {
              "@type": "PropertyValue",
              name: "monthlyRent",
              value: Math.round(
                (property.rentPerSqmYear * property.area) / 12
              ),
              unitCode: "SEK",
            },
          }),
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
    <>
      {/* Basic meta */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Pagination */}
      {prevPage && <link rel="prev" href={`${siteUrl}${prevPage}`} />}
      {nextPage && <link rel="next" href={`${siteUrl}${nextPage}`} />}

      {/* OpenGraph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="sv_SE" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Robots */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />

      {/* Geo */}
      <meta name="geo.region" content="SE-N" />
      <meta name="geo.placename" content={cityName} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </>
  );
}
