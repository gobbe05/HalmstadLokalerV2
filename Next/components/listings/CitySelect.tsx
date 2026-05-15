'use client'
import { ReactNode } from "react";
import { useAllowedCities } from "@/hooks/useAllowedCities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface CitySelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  label?: ReactNode;
  placeholder?: string;
  showLabel?: boolean;
  allowClear?: boolean;
}

export function CitySelect({
  value,
  onChange,
  label = "Stad",
  placeholder = "Välj stad",
  showLabel = true,
  allowClear = false,
}: CitySelectProps) {
  const { cities, isLoading, isRestricted } = useAllowedCities();

  return (
    <div>
      {showLabel && <Label>{label}</Label>}
      <Select
        value={value || ""}
        onValueChange={(v) => onChange(v === "__clear__" ? null : v)}
      >
        <SelectTrigger className={showLabel ? "mt-1.5" : ""}>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <SelectValue placeholder={isLoading ? "Laddar..." : placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {allowClear && (
            <SelectItem value="__clear__">
              <span className="text-muted-foreground">Alla städer</span>
            </SelectItem>
          )}
          {cities.length === 0 && !isLoading && (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              Inga städer tilldelade
            </div>
          )}
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isRestricted && cities.length === 0 && !isLoading && (
        <p className="text-xs text-destructive mt-1">
          Kontakta admin för att få städer tilldelade
        </p>
      )}
    </div>
  );
}

