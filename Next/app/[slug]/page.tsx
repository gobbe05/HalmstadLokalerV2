'use client'
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "@/lib/properties";
import {
  PropertyType,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  SORT_OPTIONS,
  SortOption,
  propertyMatchesType,
} from "@/types/property";
import { SEOHead } from "@/components/seo/SEOHead";
import { MatchingWidget } from "@/components/public/MatchingWidget";
import { ItemListSchema } from "@/components/seo/ItemListSchema";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PropertyGrid } from "@/components/public/PropertyGrid";
import { PropertyMap } from "@/components/public/PropertyMap";
import { CategoryHeroSection } from "@/components/public/CategoryHeroSection";
import { useCityContext } from "@/contexts/CityContext";
import { SLUG_TO_TYPE, LEGACY_SLUG_REDIRECTS, categoryHeroConfig } from "@/config/categoryHeroConfig";
import { useCategorySeo } from "@/hooks/useCategorySeo";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, List, Map } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Component that handles 301-style redirects for legacy category slugs.
 * Redirects snake_case and other non-canonical slugs to their canonical versions.
 */
export function CategoryRedirect({ children }: { children: React.ReactNode }) {
  const { slug } = useParams() as { slug?: string };
  const router = useRouter();

  useEffect(() => {
    if (!slug) return;

    const canonicalSlug = LEGACY_SLUG_REDIRECTS[slug.toLowerCase()];

    if (canonicalSlug) {
      router.replace(`/${canonicalSlug}/`);
      return;
    }

    if (slug.includes("_")) {
      const normalizedSlug = slug.replace(/_/g, "-");
      if (SLUG_TO_TYPE[normalizedSlug]) {
        router.replace(`/${normalizedSlug}/`);
        return;
      }
    }
  }, [slug, router]);

  return <>{children}</>;
}

export default function CategoryListingsPage() {
  const { slug } = useParams() as { slug?: string };
  const router = useRouter();
  const { currentCity } = useCityContext();
  const cityName = currentCity?.name || "din stad";

  const [sort, setSort] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Get the property type from the URL slug
  const propertyType = slug ? SLUG_TO_TYPE[slug] : null;

  useEffect(() => {
    if (slug && propertyType === null) {
      router.replace("/lokaler");
    }
  }, [slug, propertyType, router]);
  
  // Fetch custom SEO from database (with fallback to config)
  const { data: customSeo } = useCategorySeo(currentCity?.id, slug);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", "all"],
    queryFn: () => fetchProperties(undefined, "newest"),
  });

  const filteredProperties = useMemo(() => {
    if (!propertyType) return [];
    
    // Use propertyMatchesType to check ALL categories, not just primary type
    let result = properties.filter((p) => propertyMatchesType(p, propertyType));


    switch (sort) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "area_desc":
        result.sort((a, b) => (b.area || 0) - (a.area || 0));
        break;
      case "area_asc":
        result.sort((a, b) => (a.area || 0) - (b.area || 0));
        break;
    }

    return result;
  }, [properties, propertyType, sort]);

  if (!propertyType) {
    return null;
  }

  // Get hero config - prioritize DB values, fallback to config
  const defaultConfig = slug ? categoryHeroConfig[slug] : null;
  const heroConfig = useMemo(() => {
    if (!slug || !defaultConfig) return null;
    
    // Use DB values if available, otherwise use defaults
    const seoTitle = customSeo?.seo_title || defaultConfig.seoTitle;
    const subtitle = customSeo?.subtitle || defaultConfig.subtitle;
    const description = customSeo?.description || defaultConfig.description;
    
    // Replace {cityName} placeholder
    return {
      seoTitle: seoTitle.replace("{cityName}", cityName),
      subtitle: subtitle.replace("{cityName}", cityName),
      description: description.replace("{cityName}", cityName),
      backgroundVariant: defaultConfig.backgroundVariant,
      gradientClass: defaultConfig.gradientClass,
      backgroundImageUrl: defaultConfig.backgroundImageUrl,
    };
  }, [slug, defaultConfig, customSeo, cityName]);
  
  const categoryLabel = PROPERTY_TYPE_LABELS[propertyType];
  const CategoryIcon = PROPERTY_TYPE_ICONS[propertyType];
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || "Sortera";

  // SEO meta
  const seoTitle = heroConfig
    ? `${heroConfig.seoTitle} | ${cityName}Lokaler`
    : `Lediga lokaler i ${cityName}`;
  const seoDescription = heroConfig?.description || "";

  // ItemList name for schema
  const itemListName = heroConfig?.seoTitle || `Lediga ${categoryLabel?.toLowerCase() || 'lokaler'} i ${cityName}`;

  return (
    <CategoryRedirect>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={`/${slug}/`}
      />
      <ItemListSchema 
        name={itemListName} 
        properties={filteredProperties} 
        maxItems={10} 
      />

      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />

        {/* Hero Section */}
        {heroConfig && (
          <CategoryHeroSection
            title={heroConfig.seoTitle}
            subtitle={heroConfig.subtitle}
            description={heroConfig.description}
            backgroundVariant={heroConfig.backgroundVariant as "gradient" | "image"}
            backgroundImageUrl={heroConfig.backgroundImageUrl}
            gradientClass={heroConfig.gradientClass}
            categorySlug={slug || ""}
            cityName={cityName}
            propertyCount={filteredProperties.length}
            isLoading={isLoading}
            breadcrumbLabel={categoryLabel}
          />
        )}

        <main className="flex-1">
          <div className="container mx-auto px-4 pt-0 pb-sp-3 md:pb-sp-4">
            {/* Minimal filter bar */}
            <div className="sticky top-14 sm:top-16 z-40 bg-background/95 backdrop-blur-sm py-2 sm:py-3 -mx-4 px-4 mb-sp-3 shadow-sm flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap scrollbar-hide">
                {/* Sort dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                        "bg-secondary hover:bg-secondary/80"
                      )}
                    >
                      <span>{sortLabel}</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-44 bg-background border border-border shadow-lg rounded-lg p-1"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setSort(option.value)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm",
                          sort === option.value && "bg-secondary"
                        )}
                      >
                        <span>{option.label}</span>
                        {sort === option.value && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 shrink-0">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="gap-2"
                >
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">Karta</span>
                </Button>
              </div>
            </div>

            {/* Results - List or Map view */}
            {viewMode === "list" ? (
              <>
                <PropertyGrid properties={filteredProperties} loading={isLoading} layout="list" showFeaturedBadge />
                
                {/* Matching Widget after listings */}
                <div className="mt-8 md:mt-12 max-w-2xl mx-auto">
                  <MatchingWidget preselectedType={propertyType} />
                </div>
              </>
            ) : (
              <div className="h-[600px] md:h-[700px]">
                <PropertyMap properties={filteredProperties} loading={isLoading} />
              </div>
            )}
          </div>
        </main>

        <PublicFooter />
      </div>
    </CategoryRedirect>
  );
}

