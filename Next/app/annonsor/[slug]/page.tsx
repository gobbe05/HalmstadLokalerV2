'use client'
import { useEffect, useMemo, useState } from "react";
import { useResolveAdvertiserSlug } from "@/hooks/useAdvertiserSlug";
import { useCityContext } from "@/contexts/CityContext";
import { WhitelabelFooter } from "@/components/public/WhitelabelFooter";
import { getProductionUrl } from "@/lib/siteUtils";
import { usePropertyOwnerListings } from "@/hooks/usePropertyOwners";
import { transformListing } from "@/lib/properties";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, 
  Building2,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PropertyType,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  ALL_PROPERTY_TYPES,
  SORT_OPTIONS,
} from "@/types/property";
import { PropertyCardHorizontal } from "@/components/public/PropertyCardHorizontal";
import { LocalMatchingForm } from "@/components/public/LocalMatchingForm";
import { AnnonsorHeader } from "@/components/public/AnnonsorHeader";
import { cn } from "@/lib/utils";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";


export default function AdvertiserSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const { currentCity, isLoading: cityLoading } = useCityContext();
  const { data: resolveData, isLoading: resolveLoading, error } = useResolveAdvertiserSlug(slug);
  
  const profile = resolveData?.profile;
  const { data: listingsData, isLoading: listingsLoading } = usePropertyOwnerListings(profile?.id);

  
  // Use centralized filter hook
  const {
    selectedTypes,
    sort,
    toggleType,
    setSort,
    activeFilterCount,
    clearFilters,
    filterAndSortProperties,
  } = usePropertyFilter();
  
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Scroll detection for sticky bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Track page view
  useEffect(() => {
    if (!profile?.id) return;
    
    const trackView = async () => {
      try {
        await supabase.from("advertiser_page_views").insert({
          advertiser_id: profile.id,
          session_id: sessionStorage.getItem("session_id") || crypto.randomUUID(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
      } catch (err) {
        console.error("Failed to track page view:", err);
      }
    };
    
    trackView();
  }, [profile?.id]);
  
  // Transform listings using centralized function
  const listings = useMemo(() => {
    if (!listingsData) return [];
    return listingsData
      .map(transformListing)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [listingsData]);
  
  // Category counts
  const categoriesWithCounts = useMemo(() => {
    const catMap = new Map<string, number>();
    listings.forEach((l) => {
      if (l.typeLabel) {
        catMap.set(l.typeLabel, (catMap.get(l.typeLabel) || 0) + 1);
      }
    });
    return Array.from(catMap.entries()).map(([label, count]) => ({ label, count }));
  }, [listings]);

  // Available types (only show types that have listings)
  const availableTypes = useMemo(() => {
    const typesInListings = new Set<PropertyType>();
    listings.forEach((l) => {
      if (l.type) {
        typesInListings.add(l.type);
      }
    });
    return ALL_PROPERTY_TYPES.filter((type) => typesInListings.has(type));
  }, [listings]);
  
  // Filtered and sorted listings using centralized hook
  const filteredListings = useMemo(() => {
    return filterAndSortProperties(listings);
  }, [listings, filterAndSortProperties]);
  
  // Handle loading states
  if (cityLoading || resolveLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-16 w-full max-w-xl mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }
  
  // Handle redirect for old slugs
  if (resolveData?.redirect && resolveData.redirectTo) {
    return redirect(resolveData.redirectTo);
  }
  
  // Handle not found
  if (!resolveData?.found || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Annonsör hittades inte</h1>
          <p className="text-muted-foreground mb-6">
            Vi kunde inte hitta den annonsör du söker.
          </p>
          <Link href="/lokaler">
            <Button>Visa alla lokaler</Button>
          </Link>
        </main>
      </div>
    );
  }
  
  // Build canonical URL
  const site = currentCity
    ? {
        id: currentCity.id,
        name: currentCity.name,
        domain: currentCity.domain,
        is_published: currentCity.is_published,
        seo_title: currentCity.seo_title,
        seo_description: currentCity.seo_description,
        intro_text: currentCity.intro_text,
        hero_image_url: currentCity.hero_image_url,
      }
    : null;
  
  const productionUrl = getProductionUrl(site);
  const canonicalUrl = productionUrl 
    ? `${productionUrl}/annonsor/${slug}`
    : `${window.location.origin}/annonsor/${slug}`;
  
  const pageTitle = `Lediga lokaler hos ${profile.companyName} | ${currentCity?.name || 'Lokaler'}`;
  const pageDescription = `Upptäck ${listings.length} lediga lokaler hos ${profile.companyName}. Kontakta oss direkt för visning.`;
  
  const hasListings = listings.length > 0;
  
  return (
    <>
      <div className="min-h-screen flex flex-col bg-background pb-20 lg:pb-0">
        {/* Sticky bar - visas vid scroll */}
        <div 
          className={cn(
            "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40 shadow-sm transition-all duration-300",
            isScrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          )}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Mini logo + phone */}
              <div className="flex items-center gap-3">
                {profile.companyLogo ? (
                  <img 
                    src={profile.companyLogo} 
                    alt="" 
                    className="w-8 h-8 object-contain rounded" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-accent">
                      {profile.companyName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                {profile.phone && (
                  <a 
                    href={`tel:${profile.phone}`} 
                    className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="hidden sm:inline">{profile.phone}</span>
                  </a>
                )}
              </div>
              
              {/* Right: Filter dropdowns */}
              <div className="flex items-center gap-2">
                {/* Type filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 border",
                        selectedTypes.length > 0 
                          ? "bg-accent text-white border-accent" 
                          : "bg-transparent border-border hover:border-accent hover:bg-accent/5"
                      )}
                    >
                      <span>Typ</span>
                      {selectedTypes.length > 0 && (
                        <span className="opacity-80">({selectedTypes.length})</span>
                      )}
                      <ChevronDown className="h-3 w-3 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-64 bg-background border border-border shadow-lg rounded-xl p-1.5"
                  >
                    {availableTypes.map((type) => {
                      const isSelected = selectedTypes.includes(type);
                      const Icon = PROPERTY_TYPE_ICONS[type];
                      return (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => toggleType(type)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm",
                            isSelected ? "bg-accent/10" : "hover:bg-accent/5"
                          )}
                        >
                          <Icon className={cn(
                            "h-4 w-4",
                            isSelected ? "text-accent" : "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "flex-1",
                            isSelected && "font-medium"
                          )}>{PROPERTY_TYPE_LABELS[type]}</span>
                          {isSelected && <Check className="h-4 w-4 text-accent" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 bg-secondary hover:bg-secondary/80"
                    >
                      <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label || "Sortera"}</span>
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
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
            </div>
          </div>
        </div>

        {/* Global AnnonsorHeader component */}
        <AnnonsorHeader
          logoUrl={profile.companyLogo}
          companyName={profile.companyName || ""}
          contactName={profile.displayName}
          phone={profile.phone}
          email={profile.email}
        />

        <main className="flex-1">
        {/* Filter Dropdowns */}
          {hasListings && (
            <section className="py-4 border-b border-border/40 bg-background">
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Type filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 border-2",
                          selectedTypes.length > 0 
                            ? "bg-accent text-white border-accent" 
                            : "bg-transparent border-accent/40 hover:border-accent hover:bg-accent/5"
                        )}
                      >
                        <span>Typ</span>
                        {selectedTypes.length > 0 && (
                          <span className="opacity-80">({selectedTypes.length})</span>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="start" 
                      className="w-64 bg-background border border-border shadow-lg rounded-xl p-1.5"
                    >
                      {availableTypes.map((type) => {
                        const isSelected = selectedTypes.includes(type);
                        const Icon = PROPERTY_TYPE_ICONS[type];
                        return (
                          <DropdownMenuItem
                            key={type}
                            onClick={() => toggleType(type)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm",
                              isSelected ? "bg-accent/10" : "hover:bg-accent/5"
                            )}
                          >
                            <Icon className={cn(
                              "h-4 w-4",
                              isSelected ? "text-accent" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                              "flex-1",
                              isSelected && "font-medium"
                            )}>{PROPERTY_TYPE_LABELS[type]}</span>
                            {isSelected && <Check className="h-4 w-4 text-accent" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Sort dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                          "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label || "Sortera"}</span>
                        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
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

                  {/* Clear filters */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1 px-3 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Rensa ({activeFilterCount})</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Listings */}
          <section className="py-8 md:py-12">
            <div className="container mx-auto px-4">
              {listingsLoading ? (
                <div className="flex flex-col gap-4 md:gap-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : hasListings ? (
                <div className="flex flex-col gap-4 md:gap-5">
                  {filteredListings.map((listing) => (
                    <PropertyCardHorizontal key={listing.id} property={listing} advertiserSlug={slug} />
                  ))}
                </div>
              ) : (
                <div className="max-w-md mx-auto text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Just nu finns inga aktiva lokaler publicerade.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Local Matching Form */}
          {profile && (
            <section className="container mx-auto px-4">
              {listingsLoading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : (
                <LocalMatchingForm 
                  advertiserId={profile.id} 
                  advertiserName={profile.company_name || profile.display_name || undefined}
                />
              )}
            </section>
          )}
        </main>

        {/* White-label footer */}
        <WhitelabelFooter />
      </div>
    </>
  );
}
