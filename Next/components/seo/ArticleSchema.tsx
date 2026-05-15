// components/seo/ArticleSchema.tsx

interface ArticleSchemaProps {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
  url: string;

  currentCity?: {
    name?: string;
    domain?: string;
    og_image_url?: string;
  };

  schemaConfig?: {
    article_publisher?: string;
  };
}

export function ArticleSchema({
  headline,
  description,
  datePublished,
  dateModified,
  authorName,
  image,
  url,
  currentCity,
  schemaConfig,
}: ArticleSchemaProps) {
  const siteUrl = currentCity?.domain
    ? `https://${currentCity.domain}`
    : "https://halmstadlokaler.se";

  const siteName = `${currentCity?.name || "Halmstad"}Lokaler`;
  const publisherName = schemaConfig?.article_publisher || siteName;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: `${siteUrl}${url}`,
    datePublished,
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
  structuredData.author = authorName
    ? {
        "@type": "Person",
        name: authorName,
      }
    : {
        "@type": "Organization",
        name: publisherName,
      };

  // Image
  if (image) {
    structuredData.image = {
      "@type": "ImageObject",
      url: image,
    };
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
