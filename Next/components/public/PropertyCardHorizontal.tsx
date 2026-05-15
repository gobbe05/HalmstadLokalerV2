'use client'
import { Star } from "lucide-react";
import { Property } from "@/types/property";
import { Card } from "@/components/ui/card";
import { BlurImage } from "@/components/ui/blur-image";
import { getImageUrl, getSrcSet, getSizes, isOptimizedImage } from "@/lib/imageUtils";
import { PropertyTypeBadges } from "./PropertyTypeBadges";
import Link from "next/link";

interface PropertyCardHorizontalProps {
  property: Property;
  /** If provided, links to whitelabel property detail page using slug-based URL */
  advertiserSlug?: string;
  /** Show "Utvald" badge for featured listings (not shown on whitelabel pages) */
  showFeaturedBadge?: boolean;
}

// Strip HTML tags from text
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

// Generic phrases that don't add value - filter these out
const GENERIC_PHRASES = [
  "mycket bra lokal",
  "bra lokal",
  "fin lokal",
  "trevlig lokal",
  "lokal att hyra",
  "lokal för uthyrning",
  "ledig lokal",
];

// Check if the text is meaningful (not generic/empty)
function isValueSentence(text: string | null): boolean {
  if (!text || text.length < 20) return false;
  
  const normalized = text.toLowerCase().trim();
  
  // Check if starts with or is primarily a generic phrase
  for (const phrase of GENERIC_PHRASES) {
    if (normalized.startsWith(phrase) || normalized === phrase) {
      // If the text is just the generic phrase (maybe with punctuation), filter it
      if (normalized.length < phrase.length + 30) return false;
    }
  }
  
  return true;
}

// Extract the first meaningful sentence from description
function extractValueSentence(shortDesc: string | null, longDesc: string | null): string | null {
  // Try short description first
  const short = shortDesc ? stripHtml(shortDesc) : null;
  if (short && isValueSentence(short)) {
    return short;
  }
  
  // Fallback to first sentence of long description
  const long = longDesc ? stripHtml(longDesc) : null;
  if (long && isValueSentence(long)) {
    const firstSentence = long.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 20 && firstSentence.length < 200) {
      return firstSentence.trim();
    }
  }
  
  return null;
}

// Get display text - prioritize value sentence, fallback to any available text
function getDisplayText(shortDesc: string | null, longDesc: string | null): string | null {
  // 1. Try to find a meaningful value sentence first
  const valueSentence = extractValueSentence(shortDesc, longDesc);
  if (valueSentence) return valueSentence;
  
  // 2. Fallback: show shortDesc if it exists (even if generic)
  const short = shortDesc ? stripHtml(shortDesc) : null;
  if (short && short.length > 10) return short;
  
  // 3. Fallback: show first sentence of long description
  const long = longDesc ? stripHtml(longDesc) : null;
  if (long && long.length > 10) {
    const firstSentence = long.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 10) {
      return firstSentence.trim();
    }
    return long.substring(0, 150).trim();
  }
  
  return null;
}

export function PropertyCardHorizontal({ property, advertiserSlug, showFeaturedBadge = false }: PropertyCardHorizontalProps) {
  const mainImage = property.images[0] || "/placeholder.svg";
  const smallImage = getImageUrl(mainImage, 'small');
  const srcSet = getSrcSet(mainImage);
  const monthlyRent = property.rentPerSqmYear && property.area
    ? Math.round((property.rentPerSqmYear * property.area) / 12)
    : null;

  // Get display text - always show something if available
  const displayText = getDisplayText(property.descriptionShort, property.description);

  // Use whitelabel slug-based URL if advertiserSlug is provided
  const detailUrl = advertiserSlug 
    ? `/annonsor/${advertiserSlug}/lokal/${property.slug}`
    : `/lokal/${property.slug}`;

  return (
    <Link href={detailUrl} className="group block">
      <Card className="overflow-hidden border border-border/40 bg-card transition-all duration-300 shadow-sm hover:shadow-md hover:border-accent/20">
        <div className="flex flex-col sm:flex-row">
          {/* Image section - left side */}
          <div className="relative w-full sm:w-[280px] md:w-[320px] lg:w-[360px] flex-shrink-0">
            <div className="aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-muted">
              <div className="h-full w-full">
                <BlurImage
                  src={smallImage}
                  srcSet={srcSet || undefined}
                  sizes={isOptimizedImage(mainImage) ? getSizes('card') : undefined}
                  alt={property.title}
                />
              </div>
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

          {/* Content section - right side */}
          <div className="flex-1 p-5 sm:p-6 md:p-7 flex flex-col min-w-0">
            {/* 1. Address = Focal point (Hero) */}
            <h3 className="font-heading font-semibold text-lg sm:text-xl tracking-tight line-clamp-1 group-hover:text-accent transition-colors">
              {property.address || property.title}
            </h3>

            {/* 2. Area - directly under address */}
            {property.area && (
              <p className="text-xs sm:text-sm font-semibold text-foreground mt-1 mb-2">
                {property.area} m²
              </p>
            )}

            {/* 3. Type badges */}
            {property.typeRaw && (
              <div className="flex items-center flex-wrap gap-2 mb-3">
                <PropertyTypeBadges 
                  typeString={property.typeRaw} 
                  variant="outline" 
                  size="sm" 
                  maxVisible={2}
                />
              </div>
            )}

            {/* 4. Description text - always show if available */}
            {displayText && (
              <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed max-w-xl">
                {displayText}
              </p>
            )}

            {/* 4. Bottom row: Price + Advertiser logo (subdued) */}
            <div className="flex items-end justify-between mt-auto pt-5">
              {/* Price - only show if available */}
              {monthlyRent && (
                <p className="text-base sm:text-lg font-semibold text-foreground">
                  {monthlyRent.toLocaleString("sv-SE")}
                  <span className="text-muted-foreground font-normal text-xs sm:text-sm ml-1">kr/mån</span>
                </p>
              )}

              {/* Advertiser logo - subdued */}
              {property.advertiser?.companyLogo && (
                <img
                  src={property.advertiser.companyLogo}
                  alt={property.advertiser.companyName || "Annonsör"}
                  className="h-8 sm:h-10 max-w-[120px] sm:max-w-[150px] object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

