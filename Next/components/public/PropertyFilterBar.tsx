'use client'
import { Search, X, ChevronDown, Check, Banknote } from "lucide-react";
import { PropertyType, PROPERTY_TYPE_LABELS } from "@/types/property";
import { SortOption } from "@/lib/properties";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPE_ICONS } from "@/config/propertyTypeIcons";

const ALL_TYPES: PropertyType[] = [
  "SHOP",
  "INDUSTRY_WORKSHOP",
  "OFFICE",
  "OFFICE_HOTEL_COWORKING",
  "WAREHOUSE_LOGISTICS",
  "RESTAURANT_CAFE",
  "SCHOOL_CARE",
  "OTHER",
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Nyast först" },
  { value: "area_desc", label: "Störst area" },
  { value: "area_asc", label: "Minst area" },
];


// Price range options (kr/m²/år)
const PRICE_OPTIONS: { label: string; min?: number; max?: number }[] = [
  { label: "Alla priser" },
  { label: "Under 1000 kr/m²/år", max: 1000 },
  { label: "1000–1500 kr/m²/år", min: 1000, max: 1500 },
  { label: "1500–2000 kr/m²/år", min: 1500, max: 2000 },
  { label: "Över 2000 kr/m²/år", min: 2000 },
];


export interface PriceRange {
  min?: number;
  max?: number;
}

interface PropertyFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedTypes: PropertyType[];
  onTypesChange: (types: PropertyType[]) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClear: () => void;
  activeFilterCount: number;
  priceRange?: PriceRange;
  onPriceRangeChange?: (range: PriceRange) => void;
  hideSearch?: boolean;
  hideTypeFilter?: boolean;
}

export function PropertyFilterBar({
  search,
  onSearchChange,
  selectedTypes,
  onTypesChange,
  sort,
  onSortChange,
  onClear,
  activeFilterCount,
  priceRange,
  onPriceRangeChange,
  hideSearch = false,
  hideTypeFilter = false,
}: PropertyFilterBarProps) {

  const toggleType = (type: PropertyType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || "Sortera";
  
  // Get current price label
  const priceLabel = priceRange?.min || priceRange?.max
    ? PRICE_OPTIONS.find(o => o.min === priceRange.min && o.max === priceRange.max)?.label || "Pris"
    : "Pris";
  const hasPriceFilter = priceRange?.min !== undefined || priceRange?.max !== undefined;

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Search row - conditionally rendered */}
      {!hideSearch && (
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Sök på adress, typ eller titel..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 sm:pl-11 h-9 sm:h-11 rounded-full bg-secondary border-0 text-sm focus-visible:ring-1 focus-visible:ring-foreground/20"
          />
        </div>
      )}

      {/* Filter buttons - horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap scrollbar-hide">
        {/* Type filter - conditionally rendered */}
        {!hideTypeFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 border-2",
                  selectedTypes.length > 0 
                    ? "bg-accent text-white border-accent" 
                    : "bg-transparent border-accent/40 hover:border-accent hover:bg-accent/5"
                )}
              >
                <span>Typ</span>
                {selectedTypes.length > 0 && (
                  <span className="opacity-80">({selectedTypes.length})</span>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-64 bg-background border border-border shadow-lg rounded-xl p-1.5"
            >
              {ALL_TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type);
                const Icon = PROPERTY_TYPE_ICONS[type];
                return (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm",
                      isSelected ? "bg-accent/10" : "hover:bg-accent/5"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4",
                      isSelected ? "text-accent" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "flex-1",
                      isSelected && "font-medium"
                    )}>{PROPERTY_TYPE_LABELS[type]}</span>
                    {isSelected && <Check className="h-4 w-4 text-accent" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}


        {/* Price filter */}
        {onPriceRangeChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 border-2",
                  hasPriceFilter 
                    ? "bg-accent text-white border-accent" 
                    : "bg-transparent border-accent/40 hover:border-accent hover:bg-accent/5"
                )}
              >
                <Banknote className="h-3.5 w-3.5 opacity-70" />
                <span>{hasPriceFilter ? priceLabel : "Pris"}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-52 bg-background border border-border shadow-lg rounded-xl p-1.5"
            >
              {PRICE_OPTIONS.map((option, index) => {
                const isSelected = priceRange?.min === option.min && priceRange?.max === option.max;
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => onPriceRangeChange({ min: option.min, max: option.max })}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm",
                      isSelected ? "bg-accent/10" : "hover:bg-accent/5"
                    )}
                  >
                    <span className={cn(isSelected && "font-medium")}>{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-accent" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                "bg-secondary hover:bg-secondary/80"
              )}
            >
              <span>{sortLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-44 bg-background border border-border shadow-lg rounded-lg p-1"
          >
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm",
                  sort === option.value && "bg-secondary"
                )}
              >
                <span>{option.label}</span>
                {sort === option.value && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear filters - only show if active */}
        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 px-3 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Rensa ({activeFilterCount})</span>
            <span className="sm:hidden">({activeFilterCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}

