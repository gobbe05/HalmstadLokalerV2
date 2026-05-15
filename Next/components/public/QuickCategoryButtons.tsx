'use client'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PropertyType, PROPERTY_TYPE_LABELS } from "@/types/property";
import { TYPE_TO_SLUG } from "@/config/categoryHeroConfig";
import {
  Store,
  Factory,
  Building2,
  Users,
  Warehouse,
  UtensilsCrossed,
  GraduationCap,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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

// Primary categories shown directly in hero (5 most common)
const PRIMARY_CATEGORIES: PropertyType[] = [
  "OFFICE",
  "WAREHOUSE_LOGISTICS",
  "SHOP",
  "INDUSTRY_WORKSHOP",
  "RESTAURANT_CAFE",
];

// Secondary categories shown in drawer
const SECONDARY_CATEGORIES: PropertyType[] = [
  "OFFICE_HOTEL_COWORKING",
  "SCHOOL_CARE",
  "OTHER",
];

// Full order for default variant
const CATEGORY_ORDER: PropertyType[] = [
  "SHOP",
  "INDUSTRY_WORKSHOP",
  "OFFICE",
  "OFFICE_HOTEL_COWORKING",
  "WAREHOUSE_LOGISTICS",
  "RESTAURANT_CAFE",
  "SCHOOL_CARE",
  "OTHER",
];

interface QuickCategoryButtonsProps {
  selectedTypes: PropertyType[];
  onToggle: (type: PropertyType) => void;
  className?: string;
  variant?: "default" | "hero";
}

export function QuickCategoryButtons({
  selectedTypes,
  onToggle,
  className,
  variant = "default",
}: QuickCategoryButtonsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const isHero = variant === "hero";

  // Navigate to canonical category slug
  const handleSecondaryClick = (type: PropertyType) => {
    setDrawerOpen(false);
    const slug = TYPE_TO_SLUG[type];
    navigate(`/${slug}/`);
  };

  if (isHero) {
    return (
      <>
        <div className={cn("relative", className)}>
          {/* Left fade indicator */}
          <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-black/40 to-transparent z-10 pointer-events-none sm:hidden" />
          
          {/* Scrollable container */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-4 -mx-4 sm:flex-wrap sm:justify-center sm:px-0 sm:mx-0 sm:overflow-visible">
            {/* Primary categories */}
            {PRIMARY_CATEGORIES.map((type) => {
              const Icon = CATEGORY_ICONS[type];
              const isSelected = selectedTypes.includes(type);

              return (
                <button
                  key={type}
                  onClick={() => onToggle(type)}
                  className={cn(
                    "category-btn category-btn-hero snap-start",
                    isSelected && "selected"
                  )}
                >
                  <Icon className="category-icon h-4 w-4" />
                  <span className="hidden sm:inline">{PROPERTY_TYPE_LABELS[type]}</span>
                  <span className="sm:hidden">{PROPERTY_TYPE_LABELS[type].split(" ")[0]}</span>
                </button>
              );
            })}
            
            {/* "Fler typer" button - secondary styling */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 snap-start border-2 border-white/30 text-white/70 hover:text-white hover:border-accent/60 hover:bg-accent/10"
            >
              <span>Fler typer</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {/* Right fade indicator */}
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-black/40 to-transparent z-10 pointer-events-none sm:hidden" />
        </div>

        {/* Drawer for secondary categories */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Fler typer av lokaler</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8">
              <div className="flex flex-col gap-1">
                {SECONDARY_CATEGORIES.map((type) => {
                  const Icon = CATEGORY_ICONS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleSecondaryClick(type)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-accent/5 transition-colors border border-transparent hover:border-accent/20"
                    >
                      <Icon className="h-5 w-5 text-accent" />
                      <span className="font-medium">{PROPERTY_TYPE_LABELS[type]}</span>
                      <ChevronRight className="h-4 w-4 text-accent/60 ml-auto" />
                    </button>
                  );
                })}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Default variant - shows all categories
  return (
    <div className={cn("flex flex-wrap gap-2.5 justify-center", className)}>
      {CATEGORY_ORDER.map((type) => {
        const Icon = CATEGORY_ICONS[type];
        const isSelected = selectedTypes.includes(type);

        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={cn(
              "category-btn category-btn-default",
              isSelected && "selected"
            )}
          >
            <Icon className="category-icon h-4 w-4" />
            <span className="hidden sm:inline">{PROPERTY_TYPE_LABELS[type]}</span>
            <span className="sm:hidden">{PROPERTY_TYPE_LABELS[type].split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

