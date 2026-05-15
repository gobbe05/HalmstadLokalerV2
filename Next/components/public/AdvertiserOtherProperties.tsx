'use client'
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MapPin, Maximize } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, getSrcSet, getSizes, isOptimizedImage } from "@/lib/imageUtils";
import { PROPERTY_TYPE_LABELS, getPrimaryType } from "@/types/property";

interface AdvertiserOtherPropertiesProps {
  currentPropertyId: string;
  ownerId: string | null;
  advertiserName: string;
}

export function AdvertiserOtherProperties({
  currentPropertyId,
  ownerId,
  advertiserName,
}: AdvertiserOtherPropertiesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["advertiser-other-properties", ownerId, currentPropertyId],
    queryFn: async () => {
      if (!ownerId) return [];
      
      const { data, error } = await supabase
        .from("listings")
        .select("id, titel, adress, stad, typ, area_sqm, bilder, hyra_per_m2_ar")
        .eq("owner_id", ownerId)
        .eq("status", "published")
        .neq("id", currentPropertyId)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching advertiser properties:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!ownerId,
  });

  if (isLoading || properties.length === 0) {
    return null;
  }

  const visibleCount = 3;
  const maxIndex = Math.max(0, properties.length - visibleCount);
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < maxIndex;

  const scrollLeft = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <section className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-border">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">
          Fler lokaler från {advertiserName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Upptäck fler lediga lokaler
        </p>
      </div>

      {/* Carousel container */}
      <div className="relative">
        {/* Navigation buttons */}
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-background shadow-md hidden md:flex"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-background shadow-md hidden md:flex"
            onClick={scrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Cards container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300">
          {properties.slice(currentIndex, currentIndex + visibleCount).map((listing) => (
            <AdvertiserPropertyCardCompact key={listing.id} listing={listing} />
          ))}
        </div>

        {/* Pagination dots */}
        {properties.length > visibleCount && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  currentIndex === i ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Link to advertiser page */}
      {ownerId && (
        <div className="text-center mt-8">
          <Link
            to={`/annonsorer/${ownerId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Se alla lokaler från {advertiserName}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

// Compact property card for this section
function AdvertiserPropertyCardCompact({ listing }: { listing: any }) {
  const mainImage = listing.bilder?.[0] || "/placeholder.svg";
  const smallImage = getImageUrl(mainImage, "small");
  const srcSet = getSrcSet(mainImage);
  const primaryType = getPrimaryType(listing.typ);
  const typeLabel = primaryType ? PROPERTY_TYPE_LABELS[primaryType] : listing.typ || "Lokal";

  return (
    <Link to={`/lokal/${listing.id}`} className="group block">
      <Card className="overflow-hidden border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:border-accent/30 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={smallImage}
            srcSet={srcSet || undefined}
            sizes={isOptimizedImage(mainImage) ? getSizes("card") : undefined}
            alt={listing.titel}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs font-medium">
              {typeLabel}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-accent transition-colors">
            {listing.titel}
          </h3>

          {/* Facts row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{listing.stad || "Halmstad"}</span>
            </div>
            {listing.area_sqm && (
              <div className="flex items-center gap-1">
                <Maximize className="h-3 w-3" />
                <span>{listing.area_sqm} m²</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

