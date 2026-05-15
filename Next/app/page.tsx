'use client'
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { fetchProperties, fetchFeaturedProperties, SortOption } from "@/lib/properties";
import { SEOHead } from "@/components/seo/SEOHead";
import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PropertyGrid } from "@/components/public/PropertyGrid";
import { PropertyMap } from "@/components/public/PropertyMap";
import { StartPageHero } from "@/components/public/StartPageHero";
import { FeaturedPropertiesSection } from "@/components/public/FeaturedPropertiesSection";
import { StickyFilterBar, ViewMode } from "@/components/public/StickyFilterBar";
import { MatchingWidget } from "@/components/public/MatchingWidget";
import { PropertyType, propertyMatchesTypes } from "@/types/property";
import { Button } from "@/components/ui/button";
import { useCityContext } from "@/contexts/CityContext";
import Link from "next/link";

export default function HomePage() {
  const { currentCity, isLoading: cityLoading } = useCityContext();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  
  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>([]);
  const [sort, setSort] = useState<SortOption>("newest");

  // Fetch properties - use default city 'halmstad' if city hasn't loaded yet to enable parallel loading
  const effectiveCityId = currentCity?.id || 'halmstad';
  
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", "home", effectiveCityId],
    queryFn: () => fetchProperties({ cityId: effectiveCityId }, "newest"),
    // Don't wait for city to load - use default city for initial render (PageSpeed LCP optimization)
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Fetch featured properties separately (parallel with main properties query)
  const { data: featuredProperties = [], isLoading: featuredLoading } = useQuery({
    queryKey: ["featured-properties", effectiveCityId],
    queryFn: () => fetchFeaturedProperties(effectiveCityId),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Show loading only on initial properties load (not on city loading)
  const showLoading = isLoading;


  // Filter and sort properties (featured properties now included in main list)
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Type filter - use propertyMatchesTypes for multi-category support
    if (selectedTypes.length > 0) {
      result = result.filter((p) => propertyMatchesTypes(p, selectedTypes));
    }

    // Sorting
    switch (sort) {
      case "newest":
        // Already sorted by newest from API
        break;
      case "area_desc":
        result.sort((a, b) => (b.area || 0) - (a.area || 0));
        break;
      case "area_asc":
        result.sort((a, b) => (a.area || 0) - (b.area || 0));
        break;
    }

    return result;
  }, [properties, selectedTypes, sort]);

  const displayedProperties = useMemo(() => {
    return filteredProperties.length <= 24 ? filteredProperties : filteredProperties.slice(0, 24);
  }, [filteredProperties]);

  // Calculate active filter count
  const activeFilterCount = selectedTypes.length;

  const clearFilters = () => {
    setSelectedTypes([]);
    setSort("newest");
  };

  const cityName = currentCity?.name || "Halmstad";
  const seoTitle = currentCity?.seo_title || `Lediga lokaler i ${cityName} | Hitta din nästa lokal`;
  const seoDescription = currentCity?.seo_description || `Hitta lediga lokaler i ${cityName} för företag i alla storlekar. Sök kontor, lager, butiker och industrilokaler. Jämför lägen och priser för rätt lokal.`;

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        canonical="/" 
      />
      <LocalBusinessSchema currentCity={{
        id: "",
        name: cityName,
        domain: currentCity?.domain || "",
        seo_description: seoDescription,
        og_image_url: currentCity?.og_image_url || ""
      }}  />

      <div className="min-h-screen grid grid-rows-[auto_auto_auto_1fr_auto]">
        <PublicHeader />

        {/* Hero Section with Search */}
        <StartPageHero
          cityName={cityName}
          backgroundImageUrl={currentCity?.hero_image_url}
          blurPlaceholder={currentCity?.hero_blur_placeholder}
          propertyCount={properties.length}
        />

        {/* Sticky Filter Bar */}
        <StickyFilterBar
            selectedTypes={selectedTypes}
            onTypesChange={setSelectedTypes}
            sort={sort}
            onSortChange={setSort}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            hideSearch
            scrollThreshold={400}
        />

        {/* Main Content Area */}
        <main>
          {/* Matching Widget - Lead capture */}
          {viewMode === "list" && (
            <section className="py-6 md:py-10 bg-muted/30">
              <div className="container mx-auto px-4 max-w-2xl">
                <MatchingWidget />
              </div>
            </section>
          )}

          {/* Featured Properties Section - only in list view */}
          {viewMode === "list" && (
            <FeaturedPropertiesSection 
              properties={featuredProperties} 
              loading={cityLoading || featuredLoading} 
            />
          )}

          {/* Properties Section */}
          <section className="py-6 md:py-10">
          <div className="container mx-auto px-4">

            {viewMode === "list" ? (
              <>

                <PropertyGrid
                  properties={displayedProperties}
                  loading={showLoading}
                  emptyMessage="Inga lokaler tillgängliga just nu."
                  layout="list"
                  showFeaturedBadge
                />

                {filteredProperties.length > displayedProperties.length && (
                  <div className="text-center mt-sp-4 md:mt-sp-5">
                    <Link href="/lokaler">
                      <Button 
                        variant="outline"
                        size="lg" 
                        className="gap-2 rounded-full px-8 border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-300"
                      >
                        Se alla {filteredProperties.length} lokaler
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="h-[600px] md:h-[700px] rounded-lg overflow-hidden">
                <PropertyMap properties={filteredProperties} loading={showLoading} />
              </div>
            )}
          </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
