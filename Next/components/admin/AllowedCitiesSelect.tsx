'use client'
import { useCities } from "@/hooks/useCities";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";

interface AllowedCitiesSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
}

export function AllowedCitiesSelect({
  value = [],
  onChange,
  label = "Tillåtna städer",
}: AllowedCitiesSelectProps) {
  const { data: cities = [], isLoading } = useCities();

  const handleToggle = (cityId: string) => {
    if (value.includes(cityId)) {
      onChange(value.filter(id => id !== cityId));
    } else {
      onChange([...value, cityId]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">Laddar städer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {label}
      </Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border border-border rounded-md bg-muted/30">
        {cities.map((city) => (
          <label
            key={city.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1.5 rounded"
          >
            <Checkbox
              checked={value.includes(city.id)}
              onCheckedChange={() => handleToggle(city.id)}
            />
            <span className="text-sm">{city.name}</span>
          </label>
        ))}
      </div>
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Ingen stad vald - annonsören kan inte skapa lokaler
        </p>
      )}
    </div>
  );
}

