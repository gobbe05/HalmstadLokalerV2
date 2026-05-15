'use client'
import { useState, useEffect } from "react";
import { List, Map } from "lucide-react";
import { PropertyFilterBar } from "@/components/public/PropertyFilterBar";
import { Button } from "@/components/ui/button";
import { PropertyType } from "@/types/property";
import { SortOption } from "@/lib/properties";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "map";

interface StickyFilterBarProps {
  // Filter state
  search?: string;
  onSearchChange?: (value: string) => void;
  selectedTypes: PropertyType[];
  onTypesChange: (types: PropertyType[]) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClear: () => void;
  activeFilterCount: number;
  
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Configuration
  hideSearch?: boolean;
  scrollThreshold?: number;
  zIndex?: string;
}

export function StickyFilterBar({
  search = "",
  onSearchChange,
  selectedTypes,
  onTypesChange,
  sort,
  onSortChange,
  onClear,
  activeFilterCount,
  viewMode,
  onViewModeChange,
  hideSearch = false,
  scrollThreshold = 300,
  zIndex = "z-30",
}: StickyFilterBarProps) {
  const [isSticky, setIsSticky] = useState(false);

  // Detect sticky state on scroll
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsSticky(window.scrollY > scrollThreshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold]);

  return (
    <div 
      className={cn(
        "sticky top-16 bg-background border-b transition-all duration-200 ease-in-out",
        zIndex,
        isSticky 
          ? "shadow-lg border-border py-3 md:py-4" 
          : "backdrop-blur-md shadow-sm border-border/40 py-2 md:py-3"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <PropertyFilterBar
              search={search}
              onSearchChange={onSearchChange || (() => {})}
              selectedTypes={selectedTypes}
              onTypesChange={onTypesChange}
              sort={sort}
              onSortChange={onSortChange}
              onClear={onClear}
              activeFilterCount={activeFilterCount}
              hideSearch={hideSearch}
            />
          </div>
          
          {/* Mobile: Compact toggle */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5 shrink-0 sm:hidden">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="h-7 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("map")}
              className="h-7 px-2"
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Desktop: Full toggle with labels */}
          <div className="hidden sm:flex items-center gap-1 bg-secondary rounded-lg p-1 shrink-0">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="gap-1.5 h-8"
            >
              <List className="h-4 w-4" />
              <span>Lista</span>
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("map")}
              className="gap-1.5 h-8"
            >
              <Map className="h-4 w-4" />
              <span>Karta</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
