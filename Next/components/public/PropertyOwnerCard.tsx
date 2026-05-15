'use client'
import { Link } from "react-router-dom";
import { Building2, Phone, Mail, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyOwner } from "@/hooks/usePropertyOwners";
import { getImageUrl } from "@/lib/imageUtils";

interface PropertyOwnerCardProps {
  owner: PropertyOwner;
}

export function PropertyOwnerCard({ owner }: PropertyOwnerCardProps) {
  const hasListings = owner.listingsCount > 0;
  const initials = owner.companyName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="overflow-hidden border-border/50 bg-card transition-all duration-300 hover:shadow-sm hover:border-border group">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo or Initials */}
          <div className="shrink-0">
            {owner.companyLogo ? (
              <img
                src={getImageUrl(owner.companyLogo, "small")}
                alt={owner.companyName}
                className="h-16 w-16 rounded-lg object-contain bg-secondary"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center">
                <span className="text-lg font-semibold text-muted-foreground">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-snug line-clamp-1 group-hover:text-muted-foreground transition-colors">
              {owner.companyName}
            </h3>

            {/* Status text */}
            <p className="text-sm text-muted-foreground mt-1">
              {hasListings ? (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {owner.listingsCount} {owner.listingsCount === 1 ? "ledig lokal" : "lediga lokaler"}
                </span>
              ) : (
                <span>Inga lediga lokaler just nu</span>
              )}
            </p>

            {/* CTA */}
            <div className="mt-3">
              {hasListings ? (
                <Link to={`/fastighetsagare/${owner.slug}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Visa lokaler
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {owner.phone && (
                    <a href={`tel:${owner.phone}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        Ring
                      </Button>
                    </a>
                  )}
                  {owner.email && (
                    <a href={`mailto:${owner.email}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        E-post
                      </Button>
                    </a>
                  )}
                  {!owner.phone && !owner.email && (
                    <Link to={`/fastighetsagare/${owner.slug}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        Kontakta fastighetsägare
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

