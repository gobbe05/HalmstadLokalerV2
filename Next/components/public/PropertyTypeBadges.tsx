'use client'
import { PropertyType, parsePropertyTypes } from "@/types/property";
import { PropertyTypeBadge } from "./PropertyTypeBadge";

interface PropertyTypeBadgesProps {
  typeString: string | null;
  maxVisible?: number;
  variant?: "solid" | "outline" | "subtle";
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function PropertyTypeBadges({ 
  typeString, 
  maxVisible = 3,
  variant = "outline",
  size = "sm",
  showIcon = true,
}: PropertyTypeBadgesProps) {
  const types = parsePropertyTypes(typeString);
  
  if (types.length === 0) return null;

  const visible = types.slice(0, maxVisible);
  const remaining = types.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((type) => (
        <PropertyTypeBadge 
          key={type} 
          type={type} 
          variant={variant} 
          size={size}
          showIcon={showIcon}
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground px-1.5 py-0.5">
          +{remaining}
        </span>
      )}
    </div>
  );
}

