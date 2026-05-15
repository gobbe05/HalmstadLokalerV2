import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdvertiserPageStats {
  isActive: boolean;
  totalViews: number;
  views30d: number;
  activeListingsCount: number;
  publicProfileUrl: string;
}

/**
 * Hook to fetch advertiser public page statistics for admin view.
 * Returns stats about the advertiser's public profile page.
 */
export function useAdvertiserPageStats(advertiserId: string | undefined) {
  return useQuery({
    queryKey: ["advertiser-page-stats", advertiserId],
    queryFn: async (): Promise<AdvertiserPageStats | null> => {
      if (!advertiserId) return null;

      // Fetch profile to check if active and approved
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_active, status")
        .eq("id", advertiserId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return null;

      // Count published listings
      const { count: activeListingsCount, error: listingsError } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", advertiserId)
        .eq("status", "published");

      if (listingsError) throw listingsError;

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Count total views
      const { count: totalViews, error: totalViewsError } = await supabase
        .from("advertiser_page_views")
        .select("*", { count: "exact", head: true })
        .eq("advertiser_id", advertiserId);

      if (totalViewsError) throw totalViewsError;

      // Count views in last 30 days
      const { count: views30d, error: views30dError } = await supabase
        .from("advertiser_page_views")
        .select("*", { count: "exact", head: true })
        .eq("advertiser_id", advertiserId)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (views30dError) throw views30dError;

      // Determine if public page is active
      // Active = has at least 1 published listing AND is_active = true AND status = approved
      const isActive = 
        profile.is_active && 
        profile.status === "approved" && 
        (activeListingsCount || 0) > 0;

      // Build public profile URL
      const publicProfileUrl = `/annonsorer/${advertiserId}`;

      return {
        isActive,
        totalViews: totalViews || 0,
        views30d: views30d || 0,
        activeListingsCount: activeListingsCount || 0,
        publicProfileUrl,
      };
    },
    enabled: !!advertiserId,
  });
}

/**
 * Batch hook to fetch advertiser page status for multiple advertisers (for list view).
 * Returns a map of advertiserId -> isActive status.
 */
export function useAdvertiserPageStatusBatch(advertiserIds: string[]) {
  return useQuery({
    queryKey: ["advertiser-page-status-batch", advertiserIds],
    queryFn: async (): Promise<Map<string, boolean>> => {
      if (advertiserIds.length === 0) return new Map();

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, is_active, status")
        .in("id", advertiserIds);

      if (profilesError) throw profilesError;

      // Get all published listings grouped by owner
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("owner_id")
        .in("owner_id", advertiserIds)
        .eq("status", "published");

      if (listingsError) throw listingsError;

      // Count published listings per owner
      const publishedCountMap = new Map<string, number>();
      (listings || []).forEach((listing) => {
        if (listing.owner_id) {
          publishedCountMap.set(
            listing.owner_id,
            (publishedCountMap.get(listing.owner_id) || 0) + 1
          );
        }
      });

      // Build result map
      const result = new Map<string, boolean>();
      (profiles || []).forEach((profile) => {
        const hasPublishedListings = (publishedCountMap.get(profile.id) || 0) > 0;
        const isActive = 
          profile.is_active && 
          profile.status === "approved" && 
          hasPublishedListings;
        result.set(profile.id, isActive);
      });

      return result;
    },
    enabled: advertiserIds.length > 0,
  });
}
