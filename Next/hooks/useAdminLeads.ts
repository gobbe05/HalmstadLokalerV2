import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LeadStatus, LeadType, LeadWithListing } from "./useLeads";

export interface AdminLeadWithListing extends Omit<LeadWithListing, 'listing'> {
  listing: {
    id: string;
    titel: string;
    stad: string | null;
    typ: string | null;
    area_sqm: number | null;
    owner_id: string | null;
    advertiser_name?: string;
    advertiser_company?: string;
  } | null;
}

/**
 * ADMIN ONLY: Fetches all leads across all advertisers.
 * 
 * SECURITY WARNING: This hook should ONLY be used in admin routes (/admin/*).
 * Never use this hook in advertiser routes (/app/*) as it bypasses
 * per-advertiser data isolation.
 * 
 * For advertiser routes, use useLeads() instead which filters by owner_id.
 */
export function useAdminLeads(listingId?: string) {
  return useQuery({
    queryKey: ["admin-leads", listingId],
    queryFn: async (): Promise<AdminLeadWithListing[]> => {
      let query = supabase
        .from("leads")
        .select(`
          *,
          listing:listings(id, titel, stad, typ, area_sqm, owner_id)
        `)
        .order("created_at", { ascending: false });

      if (listingId) {
        query = query.eq("listing_id", listingId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get all unique owner_ids from listings
      const ownerIds = [...new Set(
        (data || [])
          .map(lead => (lead.listing as any)?.owner_id)
          .filter(Boolean)
      )];

      // Fetch profiles for all owners
      let profilesMap = new Map<string, { display_name: string | null; company_name: string | null }>();
      
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, company_name")
          .in("id", ownerIds);

        profiles?.forEach((profile) => {
          profilesMap.set(profile.id, {
            display_name: profile.display_name,
            company_name: profile.company_name,
          });
        });
      }

      return (data || []).map((lead) => {
        const listing = lead.listing as any;
        const advertiser = listing?.owner_id ? profilesMap.get(listing.owner_id) : null;
        
        return {
          ...lead,
          status: lead.status as LeadStatus,
          lead_type: (lead.lead_type || "listing") as LeadType,
          listing: listing ? {
            ...listing,
            advertiser_name: advertiser?.display_name || undefined,
            advertiser_company: advertiser?.company_name || undefined,
          } : null,
        };
      });
    },
  });
}
