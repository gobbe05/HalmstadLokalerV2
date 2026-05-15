import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicListing {
  id: string;
  titel: string;
  adress: string | null;
  stad: string | null;
  postnummer: string | null;
  kommun: string | null;
  typ: string | null;
  area_sqm: number | null;
  hyra_per_m2_ar: number | null;
  beskrivning_kort: string | null;
  beskrivning_lang: string | null;
  koordinater_lat: number | null;
  koordinater_lng: number | null;
  bilder: string[];
  market: string | null;
  created_at: string;
  user_id: string | null;
  advertiser_name: string | null;
  advertiser_email: string | null;
  advertiser_phone: string | null;
}

export interface Advertiser {
  user_id: string;
  display_name: string | null;
}

export function usePublicListings(market?: string) {
  return useQuery({
    queryKey: ["public-listings", market],
    queryFn: async (): Promise<PublicListing[]> => {
      let query = supabase
        .from("listings")
        .select(`
          *,
          profiles!listings_user_id_profiles_fkey(display_name, email, phone)
        `)
        .eq("status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (market) {
        query = query.ilike("market", `%${market}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((listing: any) => ({
        ...listing,
        bilder: listing.bilder || [],
        advertiser_name: listing.profiles?.display_name || null,
        advertiser_email: listing.profiles?.email || null,
        advertiser_phone: listing.profiles?.phone || null,
      }));
    },
  });
}

export function useAdvertisers() {
  return useQuery({
    queryKey: ["advertisers"],
    queryFn: async (): Promise<Advertiser[]> => {
      // Get unique user_ids from published listings
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("user_id")
        .eq("status", "published")
        .not("user_id", "is", null);

      if (listingsError) throw listingsError;

      const uniqueUserIds = [...new Set((listings || []).map(l => l.user_id).filter(Boolean))];
      
      if (uniqueUserIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", uniqueUserIds);

      if (profilesError) throw profilesError;

      return (profiles || []).map(p => ({
        user_id: p.user_id,
        display_name: p.display_name,
      }));
    },
  });
}

export function usePublicListing(id: string | undefined) {
  return useQuery({
    queryKey: ["public-listing", id],
    queryFn: async (): Promise<PublicListing | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          profiles!listings_user_id_profiles_fkey(display_name, email, phone)
        `)
        .eq("id", id)
        .eq("status", "published")
        .is("deleted_at", null)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Track view event
      await supabase.from("listing_events").insert({
        listing_id: id,
        event_type: "view",
        source: "internal-preview",
      });

      return {
        ...data,
        bilder: data.bilder || [],
        advertiser_name: (data as any).profiles?.display_name || null,
        advertiser_email: (data as any).profiles?.email || null,
        advertiser_phone: (data as any).profiles?.phone || null,
      };
    },
    enabled: !!id,
  });
}
