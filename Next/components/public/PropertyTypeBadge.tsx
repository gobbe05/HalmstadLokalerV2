'use client'
import { PropertyType } from "@/types/property";
import { PROPERTY_TYPE_ICONS, PROPERTY_TYPE_SHORT_LABELS } from "@/config/propertyTypeIcons";
import { cn } from "@/lib/utils";

interface PropertyTypeBadgeProps {
  type: PropertyType;
  variant?: "solid" | "outline" | "subtle";
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function PropertyTypeBadge({ 
  type, 
  variant = "outline", 
  size = "sm",
  showIcon = true,
  className 
}: PropertyTypeBadgeProps) {
  const Icon = PROPERTY_TYPE_ICONS[type];
  const label = PROPERTY_TYPE_SHORT_LABELS[type];

  const variants = {
    solid: "bg-accent/90 text-white backdrop-blur-sm shadow-sm",
    outline: "border border-border bg-background text-foreground",
    subtle: "bg-muted text-muted-foreground",
  };

  const sizes = {
    sm: "text-[10px] sm:text-xs px-2 py-0.5 gap-1",
    md: "text-xs sm:text-sm px-2.5 py-1 gap-1.5",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-md font-medium whitespace-nowrap",
      variants[variant],
      sizes[size],
      className
    )}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {label}
    </span>
  );
}

