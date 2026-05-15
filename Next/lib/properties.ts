'use client'
import { supabase } from "@/integrations/supabase/client";
import {
  Property,
  PropertyType,
  PROPERTY_TYPE_LABELS,
  generateSlug,
  extractIdFromSlug,
  getPrimaryType,
  propertyMatchesTypes,
  SortOption,
} from "@/types/property";

// Re-export SortOption for backwards compatibility
export type { SortOption };

// Transform DB listing to normalized Property
export function transformListing(listing: any): Property {
  const primaryType = getPrimaryType(listing.typ);
  const typeLabel = primaryType ? PROPERTY_TYPE_LABELS[primaryType] : listing.typ || "Lokal";
  const isPrelisting = listing.is_prelisting === true;

  return {
    id: listing.id,
    title: listing.titel,
    description: listing.beskrivning_lang || "",
    descriptionShort: listing.beskrivning_kort || "",
    area: listing.area_sqm,
    type: primaryType,
    typeLabel,
    typeRaw: listing.typ || null,
    address: listing.adress || "",
    postalCode: listing.postnummer || null,
    city: listing.stad || null,
    images: listing.bilder || [],
    documents: listing.dokument || [],
    latitude: listing.koordinater_lat,
    longitude: listing.koordinater_lng,
    rentPerSqmYear: listing.hyra_per_m2_ar,
    createdAt: listing.created_at,
    slug: generateSlug(listing.adress || "", typeLabel, listing.area_sqm, listing.id),
    cityId: listing.city_id,
    isPrelisting,
    isFeatured: listing.is_featured === true,
    ownerId: listing.owner_id || null,
    advertiser: isPrelisting
      ? {
          name: null,
          title: null,
          email: null,
          phone: null,
          companyName: null,
          companyLogo: null,
          website: null,
          orgNumber: null,
          address: null,
          city: null,
          postalCode: null,
        }
      : {
          name: listing.profiles?.display_name || null,
          title: listing.profiles?.contact_title || null,
          email: listing.profiles?.email || null,
          phone: listing.profiles?.phone || null,
          companyName: listing.profiles?.company_name || null,
          companyLogo: listing.profiles?.company_logo || null,
          website: listing.profiles?.website || null,
          orgNumber: listing.profiles?.org_number || null,
          address: listing.profiles?.address || null,
          city: listing.profiles?.city || null,
          postalCode: listing.profiles?.postal_code || null,
        },
  };
}

export interface PropertyFilters {
  types?: PropertyType[];
  minArea?: number;
  maxArea?: number;
  search?: string;
  cityId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPropertyResult {
  properties: Property[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Fetch all published properties with optional filters (without pagination)
export async function fetchProperties(
  filters?: PropertyFilters,
  sort: SortOption = "newest"
): Promise<Property[]> {
  let query = supabase
    .from("listings")
    .select(`
      *,
      profiles!listings_owner_id_fkey(display_name, contact_title, email, phone, company_name, company_logo, website, org_number, address, city, postal_code, is_active, deleted_at, status)
    `)
    .eq("status", "published");

  // Filter by city_id if provided
  if (filters?.cityId) {
    query = query.eq("city_id", filters.cityId);
  }

  // Apply sorting
  switch (sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "area_desc":
      query = query.order("area_sqm", { ascending: false, nullsFirst: false });
      break;
    case "area_asc":
      query = query.order("area_sqm", { ascending: true, nullsFirst: false });
      break;
  }

  const { data, error } = await query;
  if (error) throw error;

  // Filter out listings from inactive, deleted, or non-approved advertisers
  // RLS handles most of this now, but we double-check here for safety
  const activeListings = (data || []).filter(
    (listing: any) => 
      listing.profiles?.is_active !== false && 
      !listing.profiles?.deleted_at &&
      listing.profiles?.status === "approved"
  );

  let properties = activeListings.map(transformListing);

  // Apply client-side filters
  if (filters) {
    if (filters.types && filters.types.length > 0) {
      properties = properties.filter((p) => propertyMatchesTypes(p, filters.types!));
    }
    if (filters.minArea) {
      properties = properties.filter(
        (p) => p.area && p.area >= filters.minArea!
      );
    }
    if (filters.maxArea) {
      properties = properties.filter(
        (p) => p.area && p.area <= filters.maxArea!
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      properties = properties.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.address.toLowerCase().includes(searchLower) ||
          p.typeLabel.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.descriptionShort.toLowerCase().includes(searchLower) ||
          (p.city && p.city.toLowerCase().includes(searchLower)) ||
          (p.advertiser?.companyName && p.advertiser.companyName.toLowerCase().includes(searchLower))
      );
    }
  }

  return properties;
}

// Fetch paginated published properties with optional filters
export async function fetchPropertiesPaginated(
  filters?: PropertyFilters,
  sort: SortOption = "newest"
): Promise<PaginatedPropertyResult> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 24;

  let query = supabase
    .from("listings")
    .select(`
      *,
      profiles!listings_owner_id_fkey(display_name, contact_title, email, phone, company_name, company_logo, website, org_number, address, city, postal_code, is_active, deleted_at, status)
    `, { count: "exact" })
    .eq("status", "published");

  // Filter by city_id if provided
  if (filters?.cityId) {
    query = query.eq("city_id", filters.cityId);
  }

  // Apply sorting
  switch (sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "area_desc":
      query = query.order("area_sqm", { ascending: false, nullsFirst: false });
      break;
    case "area_asc":
      query = query.order("area_sqm", { ascending: true, nullsFirst: false });
      break;
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // Filter out listings from inactive, deleted, or non-approved advertisers
  const activeListings = (data || []).filter(
    (listing: any) => 
      listing.profiles?.is_active !== false && 
      !listing.profiles?.deleted_at &&
      listing.profiles?.status === "approved"
  );

  let properties = activeListings.map(transformListing);

  // Apply client-side filters
  if (filters) {
    if (filters.types && filters.types.length > 0) {
      properties = properties.filter((p) => propertyMatchesTypes(p, filters.types!));
    }
    if (filters.minArea) {
      properties = properties.filter(
        (p) => p.area && p.area >= filters.minArea!
      );
    }
    if (filters.maxArea) {
      properties = properties.filter(
        (p) => p.area && p.area <= filters.maxArea!
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      properties = properties.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.address.toLowerCase().includes(searchLower) ||
          p.typeLabel.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.descriptionShort.toLowerCase().includes(searchLower) ||
          (p.city && p.city.toLowerCase().includes(searchLower)) ||
          (p.advertiser?.companyName && p.advertiser.companyName.toLowerCase().includes(searchLower))
      );
    }
  }

  // Calculate pagination after client-side filtering
  const totalCount = properties.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedProperties = properties.slice(startIndex, startIndex + pageSize);

  return {
    properties: paginatedProperties,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

// Response type for property lookup that includes deletion status
export interface PropertyLookupResult {
  property: Property | null;
  isDeleted: boolean;
}

// Fetch single property by ID - returns deletion status for noindex handling
export async function fetchPropertyById(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from("listings")
    .select(`
      *,
      profiles!listings_owner_id_fkey(display_name, contact_title, email, phone, company_name, company_logo, website, org_number, address, city, postal_code, is_active, deleted_at, status)
    `)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Error fetching property:", error);
    throw error;
  }
  if (!data) return null;

  // Return null if advertiser is inactive, deleted, or not approved
  if (
    data.profiles?.is_active === false || 
    data.profiles?.deleted_at ||
    data.profiles?.status !== "approved"
  ) {
    return null;
  }

  return transformListing(data);
}

// Check if a property was soft-deleted (for noindex handling)
export async function checkPropertyDeleted(id: string): Promise<boolean> {
  // Use service-level query that bypasses RLS to check deleted_at
  const { data, error } = await supabase
    .from("listings")
    .select("id, deleted_at")
    .eq("id", id)
    .maybeSingle();

  // If we get an error or no data via regular query, the listing might be deleted
  // Since RLS excludes deleted listings, no data could mean deleted
  if (error || !data) {
    // We can't definitively know if deleted, but treat missing as potentially deleted
    return true;
  }
  
  return data.deleted_at !== null;
}

// Fetch property by slug (search by matching ID suffix or full slug)
export async function fetchPropertyBySlug(slug: string): Promise<Property | null> {
  // Extract ID suffix from slug for direct lookup
  const idSuffix = extractIdFromSlug(slug);

  // IMPORTANT:
  // PostgREST applies a default limit (often 1000 rows). If we fetch all published
  // listings without pagination, specific items may be missing.
  // So we page through results until we find a match.
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 10; // safety cap (10k listings max scan)

  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        profiles!listings_owner_id_fkey(display_name, contact_title, email, phone, company_name, company_logo, website, org_number, address, city, postal_code, is_active, deleted_at, status)
      `
      )
      .eq("status", "published")
      .range(from, to);

    if (error) throw error;
    if (!data || data.length === 0) break;

    // Filter out listings from inactive, deleted, or non-approved advertisers
    const activeListings = (data || []).filter(
      (listing: any) =>
        listing.profiles?.is_active !== false &&
        !listing.profiles?.deleted_at &&
        listing.profiles?.status === "approved"
    );

    // If we have an ID suffix, find the listing whose ID ends with it
    if (idSuffix) {
      const match = activeListings.find((listing: any) => listing.id.endsWith(idSuffix));
      if (match) return transformListing(match);
    }

    // Fallback: match by full slug (for backward compatibility)
    const properties = activeListings.map(transformListing);
    const slugMatch = properties.find((p) => p.slug === slug);
    if (slugMatch) return slugMatch;

    // If we received fewer than PAGE_SIZE rows, we've reached the end.
    if (data.length < PAGE_SIZE) break;
  }

  return null;
}

// Fetch related properties by type and similar area (±30%)
export async function fetchRelatedProperties(
  currentId: string,
  type: PropertyType | null,
  currentArea?: number | null,
  cityId?: string,
  limit: number = 6
): Promise<Property[]> {
  let query = supabase
    .from("listings")
    .select(`
      *,
      profiles!listings_owner_id_fkey(display_name, contact_title, email, phone, company_name, company_logo, website, org_number, address, city, postal_code, is_active, deleted_at, status)
    `)
    .eq("status", "published")
    .neq("id", currentId)
    .order("created_at", { ascending: false })
    .limit(limit * 4); // Fetch more to filter and sort

  // Filter by city if provided
  if (cityId) {
    query = query.eq("city_id", cityId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Filter out listings from inactive, deleted, or non-approved advertisers
  const activeListings = (data || []).filter(
    (listing: any) => 
      listing.profiles?.is_active !== false && 
      !listing.profiles?.deleted_at &&
      listing.profiles?.status === "approved"
  );

  let properties = activeListings.map(transformListing);

  // Score and sort by relevance
  const scoredProperties = properties.map((p) => {
    let score = 0;

    // Same type gets highest priority
    if (type && p.type === type) {
      score += 100;
    }

    // Similar area (±30%) gets bonus points
    if (currentArea && p.area) {
      const minArea = currentArea * 0.7;
      const maxArea = currentArea * 1.3;
      if (p.area >= minArea && p.area <= maxArea) {
        score += 50;
        // Closer to actual area = higher score
        const areaDiff = Math.abs(p.area - currentArea) / currentArea;
        score += Math.round((1 - areaDiff) * 30);
      }
    }

    return { property: p, score };
  });

  // Sort by score (descending) and take limit
  scoredProperties.sort((a, b) => b.score - a.score);
  
  return scoredProperties.slice(0, limit).map((sp) => sp.property);
}

// Track property view
export async function trackPropertyView(propertyId: string): Promise<void> {
  await supabase.from("listing_events").insert({
    listing_id: propertyId,
    event_type: "view",
    source: "public-website",
  });
}

// Track contact reveal (email or phone)
export async function trackContactReveal(
  propertyId: string,
  revealType: "email" | "phone"
): Promise<void> {
  await supabase.from("listing_events").insert({
    listing_id: propertyId,
    event_type: `reveal_${revealType}`,
    source: "public-website",
  });
}

// Fetch featured properties for homepage
export async function fetchFeaturedProperties(cityId?: string): Promise<Property[]> {
  let query = supabase
    .from("listings")
    .select(`
      *,
      profiles!listings_owner_id_fkey(display_name, contact_title, email, phone, company_name, company_logo, website, org_number, address, city, postal_code, is_active, deleted_at, status)
    `)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("featured_order", { ascending: true })
    .limit(4);

  if (cityId) {
    query = query.eq("city_id", cityId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching featured properties:", error);
    return [];
  }

  // Filter out listings from inactive, deleted, or non-approved advertisers
  const activeListings = (data || []).filter(
    (listing: any) => 
      listing.profiles?.is_active !== false && 
      !listing.profiles?.deleted_at &&
      listing.profiles?.status === "approved"
  );

  return activeListings.map(transformListing);
}

// Submit lead/contact form via edge function (bypasses RLS for public submissions)
export async function submitLead(data: {
  propertyId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke("public-leads", {
      body: {
        listing_id: data.propertyId,
        contact_name: data.name,
        email: data.email,
        phone: data.phone || null,
        company_name: data.company || null,
        message: data.message || null,
      },
    });

    if (error) {
      console.error("Failed to submit lead:", error);
      return { success: false, error: "Kunde inte skicka meddelandet. Försök igen." };
    }

    // Track contact event
    await supabase.from("listing_events").insert({
      listing_id: data.propertyId,
      event_type: "contact",
      source: "public-website",
    });

    return { success: true };
  } catch (err) {
    console.error("Failed to submit lead:", err);
    return { success: false, error: "Kunde inte skicka meddelandet. Försök igen." };
  }
}
