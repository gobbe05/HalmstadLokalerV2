'use client'
import { Breadcrumbs } from "./Breadcrumbs";
import { SeoHiddenText } from "@/components/seo/SeoHiddenText";

interface CategoryHeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundVariant: "gradient" | "image";
  backgroundImageUrl?: string;
  gradientClass?: string;
  categorySlug: string;
  cityName: string;
  propertyCount?: number;
  isLoading?: boolean;
  breadcrumbLabel?: string;
}

export function CategoryHeroSection({
  title,
  subtitle,
  description,
  cityName,
  propertyCount,
  isLoading,
  breadcrumbLabel,
}: CategoryHeroSectionProps) {
  return (
    <section className="bg-secondary/30 border-b border-border/50">
      <div className="container mx-auto px-4 py-3 md:py-sp-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Lediga lokaler", href: "/lokaler" },
            { label: breadcrumbLabel || title },
          ]}
          className="mb-2"
        />

        {/* Compact header - title + count on same row */}
        <div className="flex flex-wrap items-baseline gap-x-2 sm:gap-x-3 gap-y-1 mb-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-medium tracking-tight">
              {title}
            </h1>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {isLoading ? (
              "Laddar..."
            ) : (
              <>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{propertyCount || 0}</span>
                {propertyCount === 1 ? " lokal" : " lokaler"}
              </>
            )}
          </span>
        </div>

        {/* Synlig text - endast subtitle */}
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}

        {/* SEO-text - dold visuellt men indexerbar av Google */}
        {description && (
          <SeoHiddenText as="div">
            <span dangerouslySetInnerHTML={{ __html: description }} />
            {` Hitta lediga ${breadcrumbLabel?.toLowerCase() || 'lokaler'} i ${cityName}. Vi samlar alla tillgängliga lokaler på ett ställe för att göra det enkelt att hitta rätt lokal för ditt företag.`}
          </SeoHiddenText>
        )}
      </div>
    </section>
  );
}

