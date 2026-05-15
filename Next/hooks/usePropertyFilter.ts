import { useState, useMemo, useCallback } from "react";
import {
  Property,
  PropertyType,
  SortOption,
  propertyMatchesTypes,
  propertyMatchesType,
} from "@/types/property";

export interface UsePropertyFilterOptions {
  /** Enable multi-type selection (default: true) */
  multiSelect?: boolean;
  /** Default sort option */
  defaultSort?: SortOption;
}

export interface UsePropertyFilterReturn {
  // State
  selectedTypes: PropertyType[];
  selectedType: PropertyType | null;
  sort: SortOption;
  
  // Derived values
  activeFilterCount: number;
  
  // Actions
  toggleType: (type: PropertyType) => void;
  setSelectedType: (type: PropertyType | null) => void;
  setSelectedTypes: (types: PropertyType[]) => void;
  setSort: (sort: SortOption) => void;
  clearFilters: () => void;
  
  // Filter function
  filterProperties: (properties: Property[]) => Property[];
  sortProperties: (properties: Property[]) => Property[];
  filterAndSortProperties: (properties: Property[]) => Property[];
}

/**
 * Centralized hook for property filtering and sorting.
 * Use this hook to ensure consistent filtering behavior across all pages.
 * 
 * @example
 * ```tsx
 * const { selectedTypes, toggleType, filterAndSortProperties, clearFilters } = usePropertyFilter();
 * const filteredProperties = filterAndSortProperties(properties);
 * ```
 */
export function usePropertyFilter(
  options: UsePropertyFilterOptions = {}
): UsePropertyFilterReturn {
  const {
    multiSelect = true,
    defaultSort = "newest",
  } = options;

  // State
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>([]);
  const [sort, setSort] = useState<SortOption>(defaultSort);

  // Single type selection (for non-multiselect mode)
  const selectedType = useMemo(() => {
    return selectedTypes.length === 1 ? selectedTypes[0] : null;
  }, [selectedTypes]);

  // Toggle a type in multi-select mode
  const toggleType = useCallback((type: PropertyType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return multiSelect ? [...prev, type] : [type];
    });
  }, [multiSelect]);

  // Set single type (for non-multiselect mode)
  const setSelectedType = useCallback((type: PropertyType | null) => {
    setSelectedTypes(type ? [type] : []);
  }, []);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return selectedTypes.length;
  }, [selectedTypes.length]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedTypes([]);
    setSort(defaultSort);
  }, [defaultSort]);

  // Filter properties by type
  const filterProperties = useCallback(
    (properties: Property[]): Property[] => {
      let result = properties;

      // Type filter - always use centralized matching functions
      if (selectedTypes.length > 0) {
        if (selectedTypes.length === 1) {
          result = result.filter((p) => propertyMatchesType(p, selectedTypes[0]));
        } else {
          result = result.filter((p) => propertyMatchesTypes(p, selectedTypes));
        }
      }

      return result;
    },
    [selectedTypes]
  );

  // Sort properties
  const sortProperties = useCallback(
    (properties: Property[]): Property[] => {
      const result = [...properties];

      switch (sort) {
        case "newest":
          result.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "area_desc":
          result.sort((a, b) => (b.area || 0) - (a.area || 0));
          break;
        case "area_asc":
          result.sort((a, b) => (a.area || 0) - (b.area || 0));
          break;
      }

      return result;
    },
    [sort]
  );

  // Combined filter and sort
  const filterAndSortProperties = useCallback(
    (properties: Property[]): Property[] => {
      return sortProperties(filterProperties(properties));
    },
    [filterProperties, sortProperties]
  );

  return {
    // State
    selectedTypes,
    selectedType,
    sort,
    
    // Derived
    activeFilterCount,
    
    // Actions
    toggleType,
    setSelectedType,
    setSelectedTypes,
    setSort,
    clearFilters,
    
    // Functions
    filterProperties,
    sortProperties,
    filterAndSortProperties,
  };
}
