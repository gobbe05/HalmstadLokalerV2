'use client'
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPropertiesPaginated, fetchProperties, SortOption } from "@/lib/properties";
import { PropertyType, PROPERTY_TYPE_LABELS } from "@/types/property";
import { SEOHead } from "@/components/seo/SEOHead";
import { ItemListSchema } from "@/components/seo/ItemListSchema";
import { SeoHiddenText } from "@/components/seo/SeoHiddenText";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PropertyGrid } from "@/components/public/PropertyGrid";
import { PropertyMap } from "@/components/public/PropertyMap";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { PaginationControls } from "@/components/public/PaginationControls";
import { StickyFilterBar, ViewMode } from "@/components/public/StickyFilterBar";
import { useCityContext } from "@/contexts/CityContext";
import { TYPE_TO_SLUG } from "@/config/categoryHeroConfig";
import { useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE = 24;

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentCity } = useCityContext();
  const cityName = currentCity?.name || "din stad";
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Get current page from URL
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // 301-style redirect: If ?type=X query param is used with a single type, redirect to canonical slug
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam && !typeParam.includes(",")) {
      const validType = typeParam as PropertyType;
      const canonicalSlug = TYPE_TO_SLUG[validType];
      if (canonicalSlug) {
        router.replace(`/${canonicalSlug}/`);
        return;
      }
    }
  }, [searchParams, router]);

  // Search from URL query param
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>(() => {
    const typeParam = searchParams.get("type");
    if (typeParam) {
      const types = typeParam.split(",") as PropertyType[];
      return types.filter((t) => Object.keys(PROPERTY_TYPE_LABELS).includes(t));
    }
    return [];
  });
  
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest"
  );

  // Fetch paginated data for list view
  const { data: paginatedResult, isLoading } = useQuery({
    queryKey: ["properties", "paginated", currentCity?.id, selectedTypes, search, sort, currentPage],
    queryFn: () => fetchPropertiesPaginated(
      { 
        cityId: currentCity?.id, 
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        search: search.trim() || undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
      }, 
      sort
    ),
    enabled: !!currentCity,
  });

  // Fetch ALL properties for map view (needs all markers)
  const { data: allProperties = [], isLoading: isLoadingMap } = useQuery({
    queryKey: ["properties", "all-for-map", currentCity?.id, selectedTypes, search, sort],
    queryFn: () => fetchProperties(
      { 
        cityId: currentCity?.id, 
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        search: search.trim() || undefined,
      }, 
      sort
    ),
    enabled: !!currentCity && viewMode === "map",
  });

  const properties = paginatedResult?.properties || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = paginatedResult?.totalPages || 1;

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    router.replace(`?${newParams.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page > 1 ? String(page) : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTypesChange = (types: PropertyType[]) => {
    setSelectedTypes(types);
    updateSearchParams({ 
      type: types.length > 0 ? types.join(",") : null,
      page: null,
    });
  };

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    updateSearchParams({ 
      sort: value !== "newest" ? value : null,
      page: null,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedTypes([]);
    setSort("newest");
    router.replace(`?${new URLSearchParams({}).toString()}`, { scroll: true });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateSearchParams({ 
      search: value.trim() || null,
      page: null,
    });
  };

  const activeFilterCount = (selectedTypes.length > 0 ? 1 : 0) + (search.trim() ? 1 : 0);

  // SEO: Add page number to title for pages > 1
  const pageIndicator = currentPage > 1 ? ` – Sida ${currentPage}` : "";
  
  const seoTitle = selectedTypes.length === 1
    ? `${PROPERTY_TYPE_LABELS[selectedTypes[0]]} i ${cityName}${pageIndicator} | Lediga lokaler`
    : `Alla lediga lokaler i ${cityName}${pageIndicator} | ${cityName}Lokaler`;

  const seoDescription = selectedTypes.length === 1
    ? `Hitta lediga ${PROPERTY_TYPE_LABELS[selectedTypes[0]].toLowerCase()} i ${cityName}. ${totalCount} lokaler tillgängliga nu.`
    : `Bläddra bland ${totalCount} lediga kommersiella lokaler i ${cityName}. Kontor, lager, butiker och mer.`;

  // Canonical URL without page param for page 1
  const canonicalUrl = currentPage > 1 ? `/lokaler?page=${currentPage}` : "/lokaler";
  
  // Pagination rel links for SEO
  const prevPageUrl = currentPage > 1 
    ? (currentPage === 2 ? "/lokaler" : `/lokaler?page=${currentPage - 1}`)
    : undefined;
  const nextPageUrl = currentPage < totalPages ? `/lokaler?page=${currentPage + 1}` : undefined;

  // ItemList name for schema
  const itemListName = selectedTypes.length === 1
    ? `${PROPERTY_TYPE_LABELS[selectedTypes[0]]} i ${cityName}`
    : `Lediga lokaler i ${cityName}`;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        prevPage={prevPageUrl}
        nextPage={nextPageUrl}
      />
      <ItemListSchema 
        name={itemListName} 
        properties={properties} 
        maxItems={10} 
      />

      <div className="min-h-screen grid grid-rows-[auto_auto_auto_1fr_auto]">
        <PublicHeader />

        {/* Hero Section */}
        <section className="py-sp-3 md:py-sp-4 border-b border-border/50">
          <div className="container mx-auto px-4">
            <Breadcrumbs
              items={[{ label: "Lediga lokaler" }]}
              className="mb-2"
            />

            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">
                Lediga lokaler i {cityName}
              </h1>
              <p className="text-base text-muted-foreground mb-sp-2">
                {isLoading
                  ? "Laddar..."
                  : `${totalCount} lokaler tillgängliga`}
              </p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              <strong className="font-semibold text-foreground">Lediga lokaler i {cityName}.</strong>
              {" "}Hitta rätt lokal – kontor, butik, lager, verkstad och mer.
            </p>

            <SeoHiddenText>
              Här samlas alla lediga lokaler i {cityName} på ett och samma ställe. 
              Du hittar kontor, butikslokaler, lager- och logistiklokaler, verkstadslokaler, 
              industrilokaler, restaurang- och cafélokaler samt andra typer av lokaler, 
              samlade för enkel överblick. Målet är att göra det lätt att hitta rätt lokal 
              – inte bara en ledig.
            </SeoHiddenText>
          </div>
        </section>

        {/* Sticky Filter bar */}
        <StickyFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        selectedTypes={selectedTypes}
        onTypesChange={handleTypesChange}
        sort={sort}
        onSortChange={handleSortChange}
        onClear={clearFilters}
        activeFilterCount={activeFilterCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        scrollThreshold={200}
        zIndex="z-40"
        />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-sp-3 md:py-sp-4">
            {/* Results - List or Map view */}
            {viewMode === "list" ? (
              <>
                <PropertyGrid
                  properties={properties}
                  loading={isLoading}
                  layout="list"
                  showFeaturedBadge
                />
                
                {/* Pagination */}
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalCount}
                  pageSize={PAGE_SIZE}
                />
              </>
            ) : (
              <div className="h-[600px] md:h-[700px]">
                <PropertyMap
                  properties={allProperties}
                  loading={isLoadingMap}
                />
              </div>
            )}
          </div>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
