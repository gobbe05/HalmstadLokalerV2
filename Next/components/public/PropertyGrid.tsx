'use client'
import { Property } from "@/types/property";
import { PropertyCard } from "./PropertyCard";
import { PropertyCardHorizontal } from "./PropertyCardHorizontal";

interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
  emptyMessage?: string;
  layout?: "grid" | "list";
  /** Show "Utvald" badge for featured listings (not shown on whitelabel pages) */
  showFeaturedBadge?: boolean;
}

export function PropertyGrid({ properties, loading, emptyMessage, layout = "grid", showFeaturedBadge = false }: PropertyGridProps) {
  if (loading) {
    return layout === "list" ? (
      <div className="flex flex-col gap-4 md:gap-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-card/50 rounded-xl overflow-hidden animate-pulse flex flex-col sm:flex-row shadow-card"
          >
            <div className="w-full sm:w-[300px] md:w-[360px] aspect-[16/10] sm:aspect-[4/3] bg-muted flex-shrink-0" />
            <div className="flex-1 p-4 sm:p-5 space-y-3">
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-card/50 rounded-xl overflow-hidden animate-pulse shadow-card"
          >
            <div className="aspect-[16/9] sm:aspect-[4/3] bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-5 sm:h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12 md:py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted mb-4">
          <svg
            className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">Inga lokaler hittades</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto px-4">
          {emptyMessage || "Prova att ändra dina sökfilter för att hitta fler lokaler."}
        </p>
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className="flex flex-col gap-4 md:gap-5">
        {properties.map((property) => (
          <PropertyCardHorizontal key={property.id} property={property} showFeaturedBadge={showFeaturedBadge} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} showFeaturedBadge={showFeaturedBadge} />
      ))}
    </div>
  );
}
