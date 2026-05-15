'use client'
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

interface AddressResult {
  address: string;
  postalCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isValidated: boolean;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
  isValidated?: boolean;
  showWarning?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Börja skriva adress...",
  className,
  isValidated = false,
  showWarning = false,
}: AddressAutocompleteProps) {
  const { apiKey, loading: keyLoading, error: keyError } = useGoogleMapsApiKey();

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (keyLoading) return;

    if (keyError) {
      setLoadError(keyError);
      return;
    }

    if (!apiKey) {
      setLoadError("Google Maps API-nyckel saknas.");
      return;
    }

    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true));
      existingScript.addEventListener("error", () =>
        setLoadError("Kunde inte ladda Google Maps-scriptet.")
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places&language=sv&region=SE`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setLoadError("Kunde inte ladda Google Maps-scriptet.");
    document.head.appendChild(script);
  }, [apiKey, keyError, keyLoading]);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "se" },
      fields: ["address_components", "geometry", "formatted_address"],
      types: ["address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.address_components) return;

      let streetNumber = "";
      let route = "";
      let postalCode = "";
      let city = "";

      place.address_components.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number")) {
          streetNumber = component.long_name;
        }
        if (types.includes("route")) {
          route = component.long_name;
        }
        if (types.includes("postal_code")) {
          postalCode = component.long_name;
        }
        if (types.includes("locality") || types.includes("postal_town")) {
          city = component.long_name;
        }
      });

      const address = streetNumber ? `${route} ${streetNumber}` : route;
      const latitude = place.geometry?.location?.lat() ?? null;
      const longitude = place.geometry?.location?.lng() ?? null;

      setInputValue(address);
      onChange({
        address,
        postalCode,
        city,
        latitude,
        longitude,
        isValidated: true,
      });
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded, onChange]);

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle manual input (invalidates the address)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // If user types manually, mark as not validated
    onChange({
      address: newValue,
      postalCode: "",
      city: "",
      latitude: null,
      longitude: null,
      isValidated: false,
    });
  };

  const effectiveLoadError = loadError;

  return (
    <div className="space-y-2">
      <div className="relative">
        <MapPin
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none",
            showWarning ? "text-destructive" : "text-muted-foreground"
          )}
        />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10",
            showWarning && "border-destructive focus-visible:ring-destructive",
            className
          )}
          autoComplete="off"
          disabled={Boolean(effectiveLoadError) || keyLoading}
        />
        {isValidated && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
        {showWarning && !isValidated && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
        )}
      </div>

      {keyLoading && !effectiveLoadError && (
        <p className="text-xs text-muted-foreground">Laddar karttjänst…</p>
      )}

      {effectiveLoadError && <p className="text-xs text-destructive">{effectiveLoadError}</p>}

      {showWarning && !isValidated && !effectiveLoadError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Välj en adress från förslagen för att fortsätta
        </p>
      )}
    </div>
  );
}

