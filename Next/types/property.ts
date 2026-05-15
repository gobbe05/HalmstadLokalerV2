import {
  Building2,
  Warehouse,
  Store,
  Factory,
  UtensilsCrossed,
  GraduationCap,
  Users,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";

// Property type enum matching the 8 categories
export type PropertyType =
  | "SHOP"
  | "INDUSTRY_WORKSHOP"
  | "OFFICE"
  | "OFFICE_HOTEL_COWORKING"
  | "WAREHOUSE_LOGISTICS"
  | "RESTAURANT_CAFE"
  | "SCHOOL_CARE"
  | "OTHER";

// All property types in display order
export const ALL_PROPERTY_TYPES: PropertyType[] = [
  "SHOP",
  "INDUSTRY_WORKSHOP",
  "OFFICE",
  "OFFICE_HOTEL_COWORKING",
  "WAREHOUSE_LOGISTICS",
  "RESTAURANT_CAFE",
  "SCHOOL_CARE",
  "OTHER",
];

// Swedish labels for property types
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  SHOP: "Butiker",
  INDUSTRY_WORKSHOP: "Industrier & Verkstäder",
  OFFICE: "Kontor",
  OFFICE_HOTEL_COWORKING: "Kontorshotell & Coworking",
  WAREHOUSE_LOGISTICS: "Lager & Logistik",
  RESTAURANT_CAFE: "Restauranger & caféer",
  SCHOOL_CARE: "Skola, vård & omsorg",
  OTHER: "Övrigt",
};

// Icons for each property type
export const PROPERTY_TYPE_ICONS: Record<PropertyType, LucideIcon> = {
  SHOP: Store,
  INDUSTRY_WORKSHOP: Factory,
  OFFICE: Building2,
  OFFICE_HOTEL_COWORKING: Users,
  WAREHOUSE_LOGISTICS: Warehouse,
  RESTAURANT_CAFE: UtensilsCrossed,
  SCHOOL_CARE: GraduationCap,
  OTHER: MoreHorizontal,
};

// Sort options for property listings
export type SortOption = "newest" | "area_desc" | "area_asc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Nyast först" },
  { value: "area_desc", label: "Störst area" },
  { value: "area_asc", label: "Minst area" },
];


// Map from DB typ field to PropertyType enum
export const DB_TYPE_TO_ENUM: Record<string, PropertyType> = {
  "Butiker": "SHOP",
  "Industrier & verkstäder": "INDUSTRY_WORKSHOP",
  "Kontor": "OFFICE",
  "Kontorshotell & coworking": "OFFICE_HOTEL_COWORKING",
  "Lager & logistik": "WAREHOUSE_LOGISTICS",
  "Restauranger & caféer": "RESTAURANT_CAFE",
  "Skola, vård & omsorg": "SCHOOL_CARE",
  "Övrigt": "OTHER",
};

// Normalized property interface for frontend use
export interface Property {
  id: string;
  title: string;
  description: string;
  descriptionShort: string;
  area: number | null;
  type: PropertyType | null;
  typeLabel: string;
  /** Raw type string from database for multi-type display */
  typeRaw: string | null;
  address: string;
  postalCode: string | null;
  city: string | null;
  images: string[];
  documents: string[];
  latitude: number | null;
  longitude: number | null;
  rentPerSqmYear: number | null;
  createdAt: string;
  slug: string;
  cityId: string | null;
  isPrelisting: boolean;
  isFeatured: boolean;
  ownerId: string | null;
  advertiser: {
    name: string | null;
    title: string | null;
    email: string | null;
    phone: string | null;
    companyName: string | null;
    companyLogo: string | null;
    website: string | null;
    orgNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  };
}

// Generate SEO-friendly slug from property data with unique ID suffix
export function generateSlug(address: string, type: string, area: number | null, id?: string): string {
  const parts: string[] = [];
  
  if (address) {
    parts.push(address.toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''));
  }
  
  if (type) {
    parts.push(type.toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/&/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''));
  }
  
  if (area) {
    parts.push(`${area}m2`);
  }
  
  // Add last 6 characters of ID as unique suffix to prevent collisions
  if (id) {
    parts.push(id.slice(-6));
  }
  
  return parts.join('-') || 'lokal';
}

// Extract ID suffix from slug (last 6 characters after final hyphen)
export function extractIdFromSlug(slug: string): string | null {
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  // Check if it looks like a UUID suffix (6 hex characters)
  if (lastPart && /^[a-f0-9]{6}$/i.test(lastPart)) {
    return lastPart;
  }
  return null;
}

// Parse type string to get all unique types (supports multi-type)
export function parsePropertyTypes(typeString: string | null): PropertyType[] {
  if (!typeString) return [];
  
  // Normalize to lowercase for case-insensitive matching
  const normalizedTypeString = typeString.toLowerCase();
  
  const types: PropertyType[] = [];
  for (const [dbType, enumType] of Object.entries(DB_TYPE_TO_ENUM)) {
    if (normalizedTypeString.includes(dbType.toLowerCase())) {
      // Only add if not already in the array (avoid duplicates)
      if (!types.includes(enumType)) {
        types.push(enumType);
      }
    }
  }
  return types;
}

// Get primary type from type string
export function getPrimaryType(typeString: string | null): PropertyType | null {
  const types = parsePropertyTypes(typeString);
  return types[0] || null;
}

/**
 * Check if a property matches any of the selected types.
 * IMPORTANT: Always use this function for type filtering to ensure
 * multi-category properties are matched correctly.
 * 
 * @param property - The property to check (must have typeRaw field)
 * @param selectedTypes - Array of PropertyType values to match against
 * @returns true if the property has ANY of the selected types
 */
export function propertyMatchesTypes(
  property: { typeRaw: string | null },
  selectedTypes: PropertyType[]
): boolean {
  if (selectedTypes.length === 0) return true;
  const propertyTypes = parsePropertyTypes(property.typeRaw);
  return propertyTypes.some(type => selectedTypes.includes(type));
}

/**
 * Check if a property matches a single type.
 * IMPORTANT: Always use this function for single-type filtering.
 * 
 * @param property - The property to check (must have typeRaw field)
 * @param selectedType - Single PropertyType to match against
 * @returns true if the property has the selected type
 */
export function propertyMatchesType(
  property: { typeRaw: string | null },
  selectedType: PropertyType
): boolean {
  const propertyTypes = parsePropertyTypes(property.typeRaw);
  return propertyTypes.includes(selectedType);
}
