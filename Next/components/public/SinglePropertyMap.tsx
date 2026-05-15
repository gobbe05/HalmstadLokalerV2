'use client'
import { useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

interface SinglePropertyMapProps {
  latitude: number;
  longitude: number;
  title?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

function MapWithMarker({
  apiKey,
  latitude,
  longitude,
  title,
}: {
  apiKey: string;
  latitude: number;
  longitude: number;
  title?: string;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const center = useMemo(
    () => ({ lat: latitude, lng: longitude }),
    [latitude, longitude]
  );

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-secondary rounded-2xl">
        <MapPin className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">Kunde inte ladda kartan</p>
        <p className="text-xs text-muted-foreground/80 max-w-md">
          {loadError.message || "Ett fel uppstod vid laddning av Google Maps."}
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-full rounded-2xl" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={16}
      options={mapOptions}
    >
      <Marker position={center} title={title} />
    </GoogleMap>
  );
}

export function SinglePropertyMap({
  latitude,
  longitude,
  title,
}: SinglePropertyMapProps) {
  const { apiKey, loading: keyLoading, error: keyError } = useGoogleMapsApiKey();

  if (keyLoading) {
    return <Skeleton className="w-full h-full rounded-2xl" />;
  }

  if (keyError || !apiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3 bg-secondary rounded-2xl">
        <MapPin className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">Kartan kunde inte laddas</p>
        <p className="text-xs text-muted-foreground/80 max-w-md">
          {keyError || "Google Maps API-nyckel saknas."}
        </p>
      </div>
    );
  }

  return (
    <MapWithMarker
      apiKey={apiKey}
      latitude={latitude}
      longitude={longitude}
      title={title}
    />
  );
}

