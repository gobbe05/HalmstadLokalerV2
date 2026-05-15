'use client'
import { useState, useCallback, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Property } from "@/types/property";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";
import Link from "next/link";

interface PropertyMapProps {
  properties: Property[];
  loading?: boolean;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Default center (Halmstad)
const defaultCenter = {
  lat: 56.6745,
  lng: 12.8572,
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

function MapCanvas({
  apiKey,
  properties,
  onPropertySelect,
  selectedProperty,
}: {
  apiKey: string;
  properties: Property[];
  selectedProperty: Property | null;
  onPropertySelect: (p: Property | null) => void;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const propertiesWithCoords = useMemo(
    () => properties.filter((p) => p.latitude && p.longitude),
    [properties]
  );

  const center = useMemo(() => {
    if (propertiesWithCoords.length === 0) return defaultCenter;

    const avgLat =
      propertiesWithCoords.reduce((sum, p) => sum + (p.latitude || 0), 0) /
      propertiesWithCoords.length;
    const avgLng =
      propertiesWithCoords.reduce((sum, p) => sum + (p.longitude || 0), 0) /
      propertiesWithCoords.length;

    return { lat: avgLat, lng: avgLng };
  }, [propertiesWithCoords]);

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      // Fit bounds to show all markers
      if (propertiesWithCoords.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        propertiesWithCoords.forEach((p) => {
          if (p.latitude && p.longitude) {
            bounds.extend({ lat: p.latitude, lng: p.longitude });
          }
        });
        mapInstance.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    },
    [propertiesWithCoords]
  );

  if (loadError) {
    return (
      <div className="w-full h-full min-h-[500px] rounded-2xl bg-secondary flex flex-col items-center justify-center gap-3 p-6 text-center">
        <MapPin className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">Kunde inte ladda kartan</p>
        <p className="text-xs text-muted-foreground/80 max-w-md">
          {loadError.message || "Ett fel uppstod vid laddning av Google Maps."}
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-full min-h-[500px] rounded-2xl" />;
  }

  if (propertiesWithCoords.length === 0) {
    return (
      <div className="w-full h-full min-h-[500px] rounded-2xl bg-secondary flex flex-col items-center justify-center gap-3">
        <MapPin className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">Inga lokaler med kartposition hittades</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={propertiesWithCoords.length === 1 ? 15 : 12}
        options={mapOptions}
        onLoad={onLoad}
      >
        {propertiesWithCoords.map((property) => (
          <Marker
            key={property.id}
            position={{
              lat: property.latitude!,
              lng: property.longitude!,
            }}
            title={property.title}
            onClick={() => onPropertySelect(property)}
          />
        ))}

        {selectedProperty && selectedProperty.latitude && selectedProperty.longitude && (
          <InfoWindow
            position={{
              lat: selectedProperty.latitude,
              lng: selectedProperty.longitude,
            }}
            onCloseClick={() => onPropertySelect(null)}
          >
            <div className="p-1 max-w-[250px]">
              {selectedProperty.images?.[0] && (
                <img
                  src={selectedProperty.images[0]}
                  alt={selectedProperty.title}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
              )}
              <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                {selectedProperty.title}
              </h3>
              <p className="text-xs text-gray-600 mb-1">
                {selectedProperty.typeLabel}
                {selectedProperty.area && ` · ${selectedProperty.area} m²`}
              </p>
              <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                {selectedProperty.address}
              </p>
              <Link
                href={`/lokal/${selectedProperty.id}`}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Visa lokal →
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export function PropertyMap({ properties, loading = false }: PropertyMapProps) {
  const { apiKey, loading: keyLoading, error: keyError } = useGoogleMapsApiKey();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  if (loading || keyLoading) {
    return <Skeleton className="w-full h-full min-h-[500px] rounded-2xl" />;
  }

  if (keyError || !apiKey) {
    return (
      <div className="w-full h-full min-h-[500px] rounded-2xl bg-secondary flex flex-col items-center justify-center p-6 text-center gap-3">
        <MapPin className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">Kartan kunde inte laddas</p>
        <p className="text-xs text-muted-foreground/80 max-w-md">
          {keyError || "Google Maps API-nyckel saknas."}
        </p>
      </div>
    );
  }

  return (
    <MapCanvas
      apiKey={apiKey}
      properties={properties}
      selectedProperty={selectedProperty}
      onPropertySelect={setSelectedProperty}
    />
  );
}

