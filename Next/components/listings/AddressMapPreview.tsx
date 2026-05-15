'use client'
import { MapPin, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

interface AddressMapPreviewProps {
  address: string;
  postalCode?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Hide address text and controls, show only the map */
  minimal?: boolean;
}

export function AddressMapPreview({
  address,
  postalCode,
  city,
  latitude,
  longitude,
  minimal = false,
}: AddressMapPreviewProps) {
  const { apiKey, loading: keyLoading, error: keyError } = useGoogleMapsApiKey();

  const hasCoordinates = latitude !== null && latitude !== undefined && 
                         longitude !== null && longitude !== undefined;
  const hasAddress = address && address.trim() !== "";

  if (!hasAddress && !hasCoordinates) {
    return null;
  }

  const fullAddress = [address, postalCode, city].filter(Boolean).join(", ");
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  const renderMapContent = () => {
    if (keyLoading) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (keyError || !apiKey) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {keyError || "Google Maps API-nyckel saknas."}
          </p>
        </div>
      );
    }

    // Use "place" mode with coordinates to show a pin marker on the map
    const embedSrc = hasCoordinates
      ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=16`
      : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(fullAddress)}&zoom=15`;

    return (
      <iframe
        title="Kartförhandsvisning"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={embedSrc}
      />
    );
  };

  // Minimal mode: just the map
  if (minimal) {
    return (
      <div className="aspect-video max-h-[200px] rounded-lg overflow-hidden bg-muted">
        {renderMapContent()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 text-sm">
        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">{address}</p>
          {(postalCode || city) && (
            <p className="text-muted-foreground">
              {[postalCode, city].filter(Boolean).join(" ")}
            </p>
          )}
        </div>
      </div>

      <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted border border-border">
        {renderMapContent()}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Så här visas lokalen publikt
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs h-7"
          asChild
        >
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
            Visa på Google Maps
          </a>
        </Button>
      </div>
    </div>
  );
}

