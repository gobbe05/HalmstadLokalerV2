import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ListingEvent {
  id: string;
  listing_id: string;
  event_type: string;
  source: string | null;
  session_id: string | null;
  created_at: string;
}

export function useListingEvents(listingId: string | undefined) {
  return useQuery({
    queryKey: ["listing-events", listingId],
    queryFn: async (): Promise<ListingEvent[]> => {
      if (!listingId) return [];

      const { data, error } = await supabase
        .from("listing_events")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!listingId,
  });
}
