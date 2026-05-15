'use client'
import { Link } from "react-router-dom";
import { Store, Factory, Building2, Users, Warehouse, UtensilsCrossed, GraduationCap, MoreHorizontal, Compass } from "lucide-react";
import { PropertyType, PROPERTY_TYPE_LABELS } from "@/types/property";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<PropertyType, React.ComponentType<{ className?: string }>> = {
  SHOP: Store,
  INDUSTRY_WORKSHOP: Factory,
  OFFICE: Building2,
  OFFICE_HOTEL_COWORKING: Users,
  WAREHOUSE_LOGISTICS: Warehouse,
  RESTAURANT_CAFE: UtensilsCrossed,
  SCHOOL_CARE: GraduationCap,
  OTHER: MoreHorizontal,
};

const CATEGORY_ROUTES: Record<PropertyType, string> = {
  OFFICE: "/kontor",
  WAREHOUSE_LOGISTICS: "/lager",
  SHOP: "/butik",
  INDUSTRY_WORKSHOP: "/industri",
  RESTAURANT_CAFE: "/restaurang",
  OFFICE_HOTEL_COWORKING: "/coworking",
  SCHOOL_CARE: "/skola-vard",
  OTHER: "/ovrigt",
};

// Short labels for chips
const CATEGORY_SHORT_LABELS: Record<PropertyType, string> = {
  SHOP: "Butik",
  INDUSTRY_WORKSHOP: "Industri",
  OFFICE: "Kontor",
  OFFICE_HOTEL_COWORKING: "Coworking",
  WAREHOUSE_LOGISTICS: "Lager",
  RESTAURANT_CAFE: "Restaurang",
  SCHOOL_CARE: "Skola & Vård",
  OTHER: "Övrigt",
};

// Order for display
const CATEGORY_ORDER: PropertyType[] = [
  "OFFICE",
  "WAREHOUSE_LOGISTICS",
  "SHOP",
  "INDUSTRY_WORKSHOP",
  "RESTAURANT_CAFE",
  "OFFICE_HOTEL_COWORKING",
  "SCHOOL_CARE",
  "OTHER",
];

interface QuickCategoryLinksProps {
  propertyCounts: Record<PropertyType, number>;
  className?: string;
}

export function QuickCategoryLinks({ propertyCounts, className }: QuickCategoryLinksProps) {
  // Filter out categories with 0 properties
  const visibleCategories = CATEGORY_ORDER.filter(type => propertyCounts[type] > 0);

  return (
    <div className={cn("relative", className)}>
      {/* Fade edges for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />
      
      {/* Scrollable container */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap scrollbar-hide">
        {visibleCategories.map((type) => {
          const Icon = CATEGORY_ICONS[type];
          const count = propertyCounts[type];
          const route = CATEGORY_ROUTES[type];
          const label = CATEGORY_SHORT_LABELS[type];
          
          return (
            <Link
              key={type}
              to={route}
              className={cn(
                "inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full",
                "text-xs sm:text-sm font-medium whitespace-nowrap shrink-0",
                "bg-secondary/80 hover:bg-secondary border border-border/50",
                "transition-all duration-200 hover:shadow-sm hover:border-border",
                "group"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              <span>{label}</span>
              <span className="text-muted-foreground text-[10px] sm:text-xs bg-background/60 px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            </Link>
          );
        })}

        <Link
          to="/lokalexperten"
          className={cn(
            "inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full",
            "text-xs sm:text-sm font-medium whitespace-nowrap shrink-0",
            "bg-secondary/80 hover:bg-secondary border border-border/50",
            "transition-all duration-200 hover:shadow-sm hover:border-border",
            "group"
          )}
        >
          <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-accent transition-colors" />
          <span>Lokalexperten</span>
        </Link>
      </div>
    </div>
  );
}

