'use client'
import { Link } from "react-router-dom";
import { Building2, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyOwner } from "@/hooks/usePropertyOwners";
import { getImageUrl } from "@/lib/imageUtils";

interface PropertyOwnerCardHorizontalProps {
  owner: PropertyOwner;
}

export function PropertyOwnerCardHorizontal({ owner }: PropertyOwnerCardHorizontalProps) {
  const hasListings = owner.listingsCount > 0;
  const initials = owner.companyName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link to={`/fastighetsagare/${owner.slug}`} className="group block">
      <Card className="overflow-hidden border border-border/50 bg-card transition-all duration-300 shadow-card hover:border-accent/30 hover:shadow-elevated">
        <div className="flex flex-col sm:flex-row">
          {/* Logo section - left side */}
          <div className="relative w-full sm:w-[180px] md:w-[220px] lg:w-[260px] flex-shrink-0">
            <div className="aspect-[16/10] sm:aspect-[3/2] overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
              {owner.companyLogo ? (
                <img
                  src={getImageUrl(owner.companyLogo, "medium")}
                  alt={owner.companyName}
                  className="h-full w-full object-contain p-6 bg-secondary"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary via-secondary to-muted">
                  <span className="text-5xl sm:text-6xl font-bold text-muted-foreground/40 select-none">
                    {initials}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content section - right side */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center min-w-0">
            {/* Company name */}
            <h3 className="font-heading font-bold text-base sm:text-lg leading-snug line-clamp-2 mb-2 group-hover:text-accent transition-colors">
              {owner.companyName}
            </h3>

            {/* Listings count */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
              <Building2 className="h-3.5 w-3.5 text-accent/70" />
              <span>
                {hasListings 
                  ? `${owner.listingsCount} ${owner.listingsCount === 1 ? "ledig lokal" : "lediga lokaler"}`
                  : "Inga lediga lokaler just nu"
                }
              </span>
            </div>

            {/* CTA button */}
            <div>
              <Button variant="outline" size="sm" className="gap-1.5 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                Visa lokaler
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

