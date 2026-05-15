'use client'
import { Helmet } from "react-helmet-async";
import { useCityContext } from "@/contexts/CityContext";
import { useSiteSchemaConfig } from "@/hooks/useSiteSchemaConfig";

interface ArticleSchemaProps {
  /** Article headline/title */
  headline: string;
  /** Article description/excerpt */
  description: string;
  /** ISO date string of publication */
  datePublished: string;
  /** ISO date string of last modification (optional) */
  dateModified?: string;
  /** Author name */
  authorName?: string;
  /** Main image URL */
  image?: string;
  /** Article URL path (without domain) */
  url: string;
}

/**
 * Renders Article JSON-LD structured data for blog posts, guides, etc.
 * Uses site schema config for publisher information.
 */
export function ArticleSchema({
  headline,
  description,
  datePublished,
  dateModified,
  authorName,
  image,
  url,
}: ArticleSchemaProps) {
  const { currentCity } = useCityContext();
  const { data: schemaConfig } = useSiteSchemaConfig();

  const siteUrl = currentCity?.domain
    ? `https://${currentCity.domain}`
    : "https://halmstadlokaler.se";

  const siteName = `${currentCity?.name || "Halmstad"}Lokaler`;
  const publisherName = schemaConfig?.article_publisher || siteName;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: headline,
    description: description,
    url: `${siteUrl}${url}`,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}${url}`,
    },
    publisher: {
      "@type": "Organization",
      name: publisherName,
      url: siteUrl,
      ...(currentCity?.og_image_url && {
        logo: {
          "@type": "ImageObject",
          url: currentCity.og_image_url,
        },
      }),
    },
  };

  // Author
  if (authorName) {
    structuredData.author = {
      "@type": "Person",
      name: authorName,
    };
  } else {
    structuredData.author = {
      "@type": "Organization",
      name: publisherName,
    };
  }

  // Image
  if (image) {
    structuredData.image = {
      "@type": "ImageObject",
      url: image,
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

