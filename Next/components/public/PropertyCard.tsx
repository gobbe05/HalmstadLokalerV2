'use client'
import { Star } from "lucide-react";
import { Property } from "@/types/property";
import { Card, CardContent } from "@/components/ui/card";
import { BlurImage } from "@/components/ui/blur-image";
import { getImageUrl, getSrcSet, getSizes, isOptimizedImage } from "@/lib/imageUtils";
import { PropertyTypeBadges } from "./PropertyTypeBadges";
import Link from "next/link";

interface PropertyCardProps {
  property: Property;
  /** Show "Utvald" badge for featured listings (not shown on whitelabel pages) */
  showFeaturedBadge?: boolean;
}

// Strip HTML tags from text
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function PropertyCard({ property, showFeaturedBadge = false }: PropertyCardProps) {
  const mainImage = property.images[0] || "/placeholder.svg";
  const smallImage = getImageUrl(mainImage, 'small');
  const srcSet = getSrcSet(mainImage);
  const monthlyRent = property.rentPerSqmYear && property.area
    ? Math.round((property.rentPerSqmYear * property.area) / 12)
    : null;

  // Generate USP from short description
  const usp = property.descriptionShort ? stripHtml(property.descriptionShort) : null;

  return (
    <Link href={`/lokal/${property.slug}`} className="group block">
      <Card className="overflow-hidden border-0 bg-card transition-all duration-300 shadow-card sm:border sm:border-border/50 sm:hover:border-accent/30 hover-lift">
        {/* Image - 16:9 on mobile, 4:3 on desktop for more vertical presence */}
        <div className="relative aspect-[16/9] sm:aspect-[4/3] overflow-hidden bg-muted">
          <div className="h-full w-full">
            <BlurImage
              src={smallImage}
              srcSet={srcSet || undefined}
              sizes={isOptimizedImage(mainImage) ? getSizes('card') : undefined}
              alt={property.title}
            />
          </div>
          
          {/* Featured badge */}
          {property.isFeatured && showFeaturedBadge && (
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold shadow-md">
                <Star className="h-3 w-3" />
                Utvald
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-4 sm:p-5">
          {/* Address as title */}
          <h3 className="font-heading font-bold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {property.address || property.title}
          </h3>

          {/* Area - directly under address */}
          {property.area && (
            <p className="text-xs sm:text-sm font-semibold text-foreground mt-1 mb-2">
              {property.area} m²
            </p>
          )}

          {/* USP - highlighted tagline */}
          {usp && (
            <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 mb-2.5">
              {usp}
            </p>
          )}

          {/* Type badges */}
          {property.typeRaw && (
            <div className="flex items-center flex-wrap gap-2">
              <PropertyTypeBadges 
                typeString={property.typeRaw} 
                variant="outline" 
                size="sm" 
                maxVisible={2}
              />
            </div>
          )}

          {/* Price - if available */}
          {monthlyRent && (
            <p className="text-sm sm:text-base font-semibold text-foreground mt-3">
              {monthlyRent.toLocaleString("sv-SE")} <span className="text-muted-foreground font-normal text-xs">kr/mån</span>
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

