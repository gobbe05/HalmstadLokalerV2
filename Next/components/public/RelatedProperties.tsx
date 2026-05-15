'use client'
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { fetchRelatedProperties } from "@/lib/properties";
import { PropertyType } from "@/types/property";
import { PropertyCard } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { useCityContext } from "@/contexts/CityContext";
import Link from "next/link";

interface RelatedPropertiesProps {
  currentId: string;
  currentType: PropertyType | null;
  currentArea?: number | null;
  typeLabel?: string;
}

export function RelatedProperties({
  currentId,
  currentType,
  currentArea,
  typeLabel,
}: RelatedPropertiesProps) {
  const { currentCity } = useCityContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["related-properties", currentId, currentType, currentArea, currentCity?.id],
    queryFn: () => fetchRelatedProperties(currentId, currentType, currentArea, currentCity?.id, 6),
    enabled: !!currentId,
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

  // Get category slug for the link
  const categorySlug = currentType ? {
    OFFICE: "kontor",
    SHOP: "butik",
    WAREHOUSE_LOGISTICS: "lager",
    INDUSTRY_WORKSHOP: "industri",
    RESTAURANT_CAFE: "restaurang",
    OFFICE_HOTEL_COWORKING: "coworking",
    SCHOOL_CARE: "skola-vard-omsorg",
    OTHER: "lokaler",
  }[currentType] : "lokaler";

  const cityName = currentCity?.name || "Halmstad";

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">
          Liknande lokaler i {cityName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Fler {typeLabel?.toLowerCase() || "lokaler"} som kan passa dig
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
        <div
          ref={scrollRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300"
        >
          {properties.slice(currentIndex, currentIndex + visibleCount).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {/* Mobile scroll indicator dots */}
        {properties.length > visibleCount && (
          <div className="flex justify-center gap-2 mt-6 md:hidden">
            {Array.from({ length: Math.ceil(properties.length / visibleCount) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i * visibleCount)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  Math.floor(currentIndex / visibleCount) === i
                    ? "bg-primary"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
        )}

        {/* Desktop pagination dots */}
        {properties.length > visibleCount && (
          <div className="hidden md:flex justify-center gap-2 mt-6">
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

      {/* See all link */}
      <div className="text-center mt-8">
        <Link
          href={`/${categorySlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Se alla {typeLabel?.toLowerCase() || "lokaler"} i {cityName}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

