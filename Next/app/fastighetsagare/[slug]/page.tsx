'use client'
import { useEffect, useMemo, useState } from "react";
import { Phone, Mail, Building2 } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PropertyCardHorizontal } from "@/components/public/PropertyCardHorizontal";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { AnnonsorHeader } from "@/components/public/AnnonsorHeader";
import { usePropertyOwner, usePropertyOwnerListings } from "@/hooks/usePropertyOwners";
import { useCityContext } from "@/contexts/CityContext";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import { transformListing } from "@/lib/properties";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import {
  PropertyType,
  PROPERTY_TYPE_LABELS,
  SORT_OPTIONS,
} from "@/types/property";
import { useParams } from "next/navigation";
import Link from "next/link";


export default function PropertyOwnerProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { currentCity } = useCityContext();
  const { data: owner, isLoading: ownerLoading } = usePropertyOwner(slug);
  const { data: listingsData, isLoading: listingsLoading } = usePropertyOwnerListings(owner?.id);
  const cityName = currentCity?.name || "Halmstad";
  
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Scroll detection for sticky bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // Use centralized filter hook
  const {
    selectedType,
    setSelectedType,
    sort,
    setSort,
    clearFilters,
    filterAndSortProperties,
  } = usePropertyFilter({ multiSelect: false });

  // Transform listings to Property type using centralized function
  const listings = useMemo(() => {
    if (!listingsData) return [];
    return listingsData.map(transformListing);
  }, [listingsData]);

  // Get unique types from listings
  const availableTypes = useMemo(() => {
    const types = new Set<PropertyType>();
    listings.forEach((l) => {
      if (l.type) types.add(l.type);
    });
    return Array.from(types);
  }, [listings]);

  // Apply filters and sort using centralized function
  const filteredListings = useMemo(() => {
    return filterAndSortProperties(listings);
  }, [listings, filterAndSortProperties]);

  const hasListings = listings.length > 0;

  // Loading state
  if (ownerLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // Not found
  if (!owner) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Fastighetsägare hittades inte</h1>
          <p className="text-muted-foreground mb-6">
            Vi kunde inte hitta den fastighetsägare du söker.
          </p>
          <Link href="/fastighetsagare">
            <Button>Visa alla fastighetsägare</Button>
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const pageTitle = `${owner.companyName} – Fastighetsägare i ${cityName}`;
  const pageDescription = `Hitta lediga lokaler hos ${owner.companyName} i ${cityName}. Kontakta fastighetsägaren för mer information om lokaler.`;
  const canonicalUrl = `https://halmstadlokaler.se/fastighetsagare/${owner.slug}`;

  const initials = owner.companyName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const breadcrumbs = [
    { label: "Start", href: "/" },
    { label: "Fastighetsägare", href: "/fastighetsagare" },
    { label: owner.companyName },
  ];

  // JSON-LD structured data for Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: owner.companyName,
    url: canonicalUrl,
    ...(owner.companyLogo && { logo: owner.companyLogo }),
    ...(owner.email && { email: owner.email }),
    ...(owner.phone && { telephone: owner.phone }),
    ...(owner.website && { 
      sameAs: [owner.website.startsWith("http") ? owner.website : `https://${owner.website}`] 
    }),
    ...(owner.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: owner.address,
        ...(owner.postalCode && { postalCode: owner.postalCode }),
        ...(owner.city && { addressLocality: owner.city }),
        addressCountry: "SE",
      },
    }),
    areaServed: {
      "@type": "City",
      name: cityName,
    },
    ...(hasListings && {
      makesOffer: listings.map((listing) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Place",
          name: listing.title,
          address: listing.address,
        },
      })),
    }),
  };

  // JSON-LD structured data for BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Start",
        item: "https://halmstadlokaler.se/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Fastighetsägare",
        item: "https://halmstadlokaler.se/fastighetsagare",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: owner.companyName,
        item: canonicalUrl,
      },
    ],
  };

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
                {owner.companyLogo ? (
                  <img 
                    src={getImageUrl(owner.companyLogo, "small")} 
                    alt="" 
                    className="w-8 h-8 object-contain rounded" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-accent">
                      {owner.companyName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                {owner.phone && (
                  <a 
                    href={`tel:${owner.phone}`} 
                    className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="hidden sm:inline">{owner.phone}</span>
                  </a>
                )}
              </div>
              
              {/* Right: Email CTA */}
              {owner.email && (
                <a
                  href={`mailto:${owner.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                             bg-background border border-accent/30 text-foreground font-medium text-sm
                             hover:border-accent hover:bg-accent/5 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Skicka e-post</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <PublicHeader />

        <main className="flex-1">
          {/* Breadcrumbs */}
          <div className="border-b border-border/50">
            <div className="container mx-auto px-4 py-3">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          </div>

          {/* Global AnnonsorHeader component */}
          <AnnonsorHeader
            logoUrl={owner.companyLogo ? getImageUrl(owner.companyLogo, "medium") : null}
            companyName={owner.companyName}
            contactName={owner.name}
            phone={owner.phone}
            email={owner.email}
          />

          {/* Listings section */}
          <section className="py-8 md:py-12">
            <div className="container mx-auto px-4">
              {hasListings ? (
                <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <h2 className="text-xl md:text-2xl font-medium">
                      Lediga lokaler
                    </h2>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type filter */}
                      {availableTypes.length > 1 && (
                        <select
                          value={selectedType || ""}
                          onChange={(e) => setSelectedType(e.target.value as PropertyType || null)}
                          className="text-sm border border-border rounded-lg px-3 py-2 bg-background"
                        >
                          <option value="">Alla typer</option>
                          {availableTypes.map((type) => (
                            <option key={type} value={type}>
                              {PROPERTY_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Sort filter */}
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as any)}
                        className="text-sm border border-border rounded-lg px-3 py-2 bg-background"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {listingsLoading ? (
                    <div className="flex flex-col gap-4 md:gap-5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-lg" />
                      ))}
                    </div>
                  ) : filteredListings.length > 0 ? (
                    <div className="flex flex-col gap-4 md:gap-5">
                      {filteredListings.map((listing) => (
                        <PropertyCardHorizontal key={listing.id} property={listing} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        Inga lokaler matchar dina filter.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          clearFilters();
                        }}
                      >
                        Återställ filter
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                /* No listings - simple empty state */
                <div className="max-w-md mx-auto text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Just nu finns inga aktiva lokaler publicerade.
                  </p>
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
