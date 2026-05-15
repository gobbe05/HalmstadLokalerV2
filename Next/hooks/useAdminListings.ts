/**
 * ADMIN ONLY DATA HOOKS
 * 
 * SECURITY WARNING: This hook fetches data across ALL advertisers.
 * It should ONLY be used in Admin portal routes (/admin/*).
 * 
 * NEVER use this hook in Advertiser portal routes (/app/*).
 * For advertiser-specific data, use useListings() instead.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ListingStatus, ListingWithStats } from "./useListings";

export interface AdminListingWithStats extends ListingWithStats {
  advertiser_name?: string;
  advertiser_company?: string;
  deleted_at?: string | null;
  is_featured?: boolean;
  featured_order?: number;
}

/**
 * ADMIN ONLY: Fetches ALL listings across all advertisers.
 * 
 * @param includeDeleted - If true, includes soft-deleted listings
 * 
 * SECURITY WARNING: This bypasses per-advertiser data isolation.
 * Only use in /admin/* routes where admin RLS policies apply.
 */
export function useAdminListings(includeDeleted: boolean = false) {
  return useQuery({
    queryKey: ["admin-listings", { includeDeleted }],
    queryFn: async (): Promise<AdminListingWithStats[]> => {
      // Fetch all listings - admin RLS policy allows this
      let query = supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });
      
      // By default, exclude soft-deleted listings
      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      const { data: listings, error } = await query;

      if (error) throw error;

      // Fetch all profiles to map owner_id to advertiser info
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, company_name");

      const profilesMap = new Map<string, { display_name: string | null; company_name: string | null }>();
      profiles?.forEach((profile) => {
        profilesMap.set(profile.id, { 
          display_name: profile.display_name, 
          company_name: profile.company_name 
        });
      });

      // Get leads count per listing
      const { data: leadsCounts } = await supabase
        .from("leads")
        .select("listing_id");

      // Get views count per listing
      const { data: viewsCounts } = await supabase
        .from("listing_events")
        .select("listing_id")
        .eq("event_type", "view");

      const leadsMap = new Map<string, number>();
      const viewsMap = new Map<string, number>();

      leadsCounts?.forEach((lead) => {
        if (lead.listing_id) {
          leadsMap.set(lead.listing_id, (leadsMap.get(lead.listing_id) || 0) + 1);
        }
      });

      viewsCounts?.forEach((event) => {
        viewsMap.set(event.listing_id, (viewsMap.get(event.listing_id) || 0) + 1);
      });

      return (listings || []).map((listing) => {
        const advertiser = listing.owner_id ? profilesMap.get(listing.owner_id) : null;
        return {
          ...listing,
          bilder: listing.bilder || [],
          dokument: listing.dokument || [],
          status: listing.status as ListingStatus,
          is_prelisting: listing.is_prelisting || false,
          is_address_validated: listing.is_address_validated || false,
          leads_count: leadsMap.get(listing.id) || 0,
          views_count: viewsMap.get(listing.id) || 0,
          advertiser_name: advertiser?.display_name || undefined,
          advertiser_company: advertiser?.company_name || undefined,
          deleted_at: listing.deleted_at,
          is_featured: listing.is_featured || false,
          featured_order: listing.featured_order || 0,
        };
      });
    },
  });
}
