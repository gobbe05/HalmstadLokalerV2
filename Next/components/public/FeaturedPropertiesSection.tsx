'use client'
import { Property } from "@/types/property";
import { PropertyCard } from "./PropertyCard";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedPropertiesSectionProps {
  properties: Property[];
  loading?: boolean;
}

export function FeaturedPropertiesSection({ properties, loading }: FeaturedPropertiesSectionProps) {
  if (!loading && properties.length === 0) {
    return null;
  }

  return (
    <section className="pt-8 pb-4">
      <div className="container mx-auto px-4">
        {/* Minimalist header with separator */}
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Utvalda
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden border border-border">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Properties grid */}
        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {properties.map((property) => (
              <div key={property.id} className="relative">
                {/* Featured badge overlay */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-md">
                  <Star className="h-3 w-3 fill-white" />
                  <span>Utvald</span>
                </div>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

