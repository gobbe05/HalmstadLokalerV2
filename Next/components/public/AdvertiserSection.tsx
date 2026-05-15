'use client'
import { Link } from "react-router-dom";
import { EyeOff, ChevronRight, Building2 } from "lucide-react";
import { useCityContext } from "@/contexts/CityContext";

type AdvertiserSectionProps = {
  companyName: string | null;
  companyLogo?: string | null;
  isPrelisting?: boolean;
  ownerId?: string | null;
};

export function AdvertiserSection({
  companyName,
  companyLogo,
  isPrelisting = false,
  ownerId,
}: AdvertiserSectionProps) {
  const { currentCity } = useCityContext();
  const cityName = currentCity?.name || "oss";

  // Show discrete message for prelisting
  if (isPrelisting) {
    return (
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
          <EyeOff className="h-4 w-4" />
          <p className="text-sm">Diskret annonsering</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Kontakt sker via {cityName}Lokaler
        </p>
      </div>
    );
  }

  if (!companyName) return null;

  // Use ID-based link for advertiser page
  const profileLink = ownerId ? `/annonsorer/${ownerId}` : null;

  return (
    <div className="text-center py-4">
      <p className="text-sm text-muted-foreground mb-2">
        Annonseras av
      </p>
      {profileLink ? (
        <Link
          to={profileLink}
          className="group inline-flex items-center gap-1 hover:text-muted-foreground transition-colors"
        >
          <span className="font-semibold">{companyName}</span>
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      ) : (
        <span className="font-semibold">{companyName}</span>
      )}
      {companyLogo && profileLink && (
        <Link to={profileLink} className="flex justify-center mt-3">
          <img
            src={companyLogo}
            alt={`${companyName} logotyp`}
            className="max-w-[140px] max-h-16 object-contain"
          />
        </Link>
      )}
      {companyLogo && !profileLink && (
        <div className="flex justify-center mt-3">
          <img
            src={companyLogo}
            alt={`${companyName} logotyp`}
            className="max-w-[140px] max-h-16 object-contain"
          />
        </div>
      )}
      
      {/* Link to see more listings from this advertiser */}
      {profileLink && (
        <Link
          to={profileLink}
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
        >
          <Building2 className="h-3.5 w-3.5" />
          Fler lokaler från {companyName}
        </Link>
      )}
    </div>
  );
}

