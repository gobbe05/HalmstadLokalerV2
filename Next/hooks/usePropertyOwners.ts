import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCityContext } from "@/contexts/CityContext";

export interface PropertyOwner {
  id: string;
  name: string;
  companyName: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  companyLogo: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  orgNumber: string | null;
  slug: string;
  listingsCount: number;
}

// Generate URL-friendly slug from company name
function generateOwnerSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Fetch all property owners (advertisers with approved status) for the current city
export function usePropertyOwners() {
  const { currentCity } = useCityContext();
  const cityId = currentCity?.id;

  return useQuery({
    queryKey: ["property-owners", cityId],
    queryFn: async (): Promise<PropertyOwner[]> => {
      // Get all approved, active advertisers with allowed_cities containing current city
      let query = supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          company_name,
          email,
          phone,
          website,
          company_logo,
          address,
          city,
          postal_code,
          org_number,
          allowed_cities
        `)
        .eq("status", "approved")
        .eq("is_active", true)
        .is("deleted_at", null);

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Filter by city if cityId is available
      const filteredProfiles = cityId 
        ? (profiles || []).filter((p) => 
            p.allowed_cities && Array.isArray(p.allowed_cities) && p.allowed_cities.includes(cityId)
          )
        : profiles || [];

      // Get published listings count per owner for current city
      let listingsQuery = supabase
        .from("listings")
        .select("owner_id")
        .eq("status", "published");
      
      if (cityId) {
        listingsQuery = listingsQuery.eq("city_id", cityId);
      }

      const { data: listings, error: listingsError } = await listingsQuery;

      if (listingsError) throw listingsError;

      // Count listings per owner
      const listingsCountMap: Record<string, number> = {};
      (listings || []).forEach((listing) => {
        if (listing.owner_id) {
          listingsCountMap[listing.owner_id] = (listingsCountMap[listing.owner_id] || 0) + 1;
        }
      });

      // Transform profiles to PropertyOwner
      const owners: PropertyOwner[] = filteredProfiles
        .filter((p) => p.company_name) // Only include profiles with company name
        .map((profile) => ({
          id: profile.id,
          name: profile.display_name || profile.company_name || "",
          companyName: profile.company_name || "",
          email: profile.email,
          phone: profile.phone,
          website: profile.website,
          companyLogo: profile.company_logo,
          address: profile.address,
          city: profile.city,
          postalCode: profile.postal_code,
          orgNumber: profile.org_number,
          slug: generateOwnerSlug(profile.company_name || profile.id),
          listingsCount: listingsCountMap[profile.id] || 0,
        }));

      // Sort alphabetically by company name
      owners.sort((a, b) => a.companyName.localeCompare(b.companyName, "sv"));

      return owners;
    },
  });
}

// Fetch single property owner by slug
export function usePropertyOwner(slug: string | undefined) {
  return useQuery({
    queryKey: ["property-owner", slug],
    queryFn: async (): Promise<PropertyOwner | null> => {
      if (!slug) return null;

      // Get all approved, active advertisers with company name
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          company_name,
          email,
          phone,
          website,
          company_logo,
          address,
          city,
          postal_code,
          org_number
        `)
        .eq("status", "approved")
        .eq("is_active", true)
        .is("deleted_at", null);

      if (error) throw error;

      // Find profile matching slug
      const profile = (profiles || []).find((p) => {
        if (!p.company_name) return false;
        return generateOwnerSlug(p.company_name) === slug;
      });

      if (!profile) return null;

      // Get published listings count
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id")
        .eq("owner_id", profile.id)
        .eq("status", "published");

      if (listingsError) throw listingsError;

      return {
        id: profile.id,
        name: profile.display_name || profile.company_name || "",
        companyName: profile.company_name || "",
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        companyLogo: profile.company_logo,
        address: profile.address,
        city: profile.city,
        postalCode: profile.postal_code,
        orgNumber: profile.org_number,
        slug: generateOwnerSlug(profile.company_name || profile.id),
        listingsCount: listings?.length || 0,
      };
    },
    enabled: !!slug,
  });
}

// Fetch single property owner by ID (for /annonsorer/:id route)
export function usePropertyOwnerById(id: string | undefined) {
  return useQuery({
    queryKey: ["property-owner-by-id", id],
    queryFn: async (): Promise<PropertyOwner | null> => {
      if (!id) return null;

      // Get profile by ID - must be approved, active, and have published listings
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          company_name,
          email,
          phone,
          website,
          company_logo,
          address,
          city,
          postal_code,
          org_number
        `)
        .eq("id", id)
        .eq("status", "approved")
        .eq("is_active", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) throw error;
      if (!profile || !profile.company_name) return null;

      // Get published listings count
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id")
        .eq("owner_id", profile.id)
        .eq("status", "published");

      if (listingsError) throw listingsError;

      return {
        id: profile.id,
        name: profile.display_name || profile.company_name || "",
        companyName: profile.company_name || "",
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        companyLogo: profile.company_logo,
        address: profile.address,
        city: profile.city,
        postalCode: profile.postal_code,
        orgNumber: profile.org_number,
        slug: generateOwnerSlug(profile.company_name || profile.id),
        listingsCount: listings?.length || 0,
      };
    },
    enabled: !!id,
  });
}

// Fetch listings for a specific property owner
export function usePropertyOwnerListings(ownerId: string | undefined) {
  return useQuery({
    queryKey: ["property-owner-listings", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];

      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          profiles!listings_owner_id_fkey(display_name, contact_title, email, phone, company_name, company_logo, website, org_number, address, city, postal_code)
        `)
        .eq("owner_id", ownerId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: !!ownerId,
  });
}
