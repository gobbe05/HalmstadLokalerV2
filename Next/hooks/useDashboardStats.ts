/**
 * ADVERTISER DASHBOARD STATS
 * 
 * SECURITY CRITICAL: This hook calculates stats ONLY for the current user's data.
 * Listings, leads, and events are filtered by owner_id.
 * 
 * For admin stats across all advertisers, use useAdminDashboardStats() instead.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format } from "date-fns";
import { sv } from "date-fns/locale";

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalListings: number;
  publishedListings: number;
  totalViews: number;
  totalReveals: number;
  emailReveals: number;
  phoneReveals: number;
  viewsByMonth: { month: string; views: number }[];
  leadsByStatus: { status: string; count: number }[];
  leadsByMonth: { month: string; leads: number }[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Get current user's profile for filtering
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Get user's profile id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch listings - only for this user
      let listingsQuery = supabase.from("listings").select("id, status");
      
      // Filter by owner_id if profile exists (advertisers see only own)
      if (profile?.id) {
        listingsQuery = listingsQuery.eq("owner_id", profile.id);
      }
      
      const { data: listings, error: listingsError } = await listingsQuery;
      
      if (listingsError) throw listingsError;

      const allListings = listings || [];
      const listingIds = allListings.map(l => l.id);

      // Fetch leads - only for listings owned by this user
      let allLeads: { id: string; status: string; created_at: string }[] = [];
      if (listingIds.length > 0) {
        const { data: leads, error: leadsError } = await supabase
          .from("leads")
          .select("id, status, created_at")
          .in("listing_id", listingIds);
        
        if (leadsError) throw leadsError;
        allLeads = leads || [];
      }

      // Fetch events (views and reveals) - only for this user's listings
      let allEvents: { id: string; event_type: string; created_at: string }[] = [];
      if (listingIds.length > 0) {
        const { data: events, error: eventsError } = await supabase
          .from("listing_events")
          .select("id, event_type, created_at")
          .in("event_type", ["view", "reveal_email", "reveal_phone"])
          .in("listing_id", listingIds);
        
        if (eventsError) throw eventsError;
        allEvents = events || [];
      }

      // Calculate lead stats
      const totalLeads = allLeads.length;
      const newLeads = allLeads.filter((l) => l.status === "new").length;
      const wonLeads = allLeads.filter((l) => l.status === "won").length;
      const lostLeads = allLeads.filter((l) => l.status === "lost").length;
      const closedLeads = wonLeads + lostLeads;
      const conversionRate = closedLeads > 0 ? (wonLeads / closedLeads) * 100 : 0;

      // Calculate listing stats
      const totalListings = allListings.length;
      const publishedListings = allListings.filter((l) => l.status === "published").length;

      // Calculate views stats
      const viewEvents = allEvents.filter(e => e.event_type === "view");
      const totalViews = viewEvents.length;

      // Calculate reveal stats
      const emailReveals = allEvents.filter(e => e.event_type === "reveal_email").length;
      const phoneReveals = allEvents.filter(e => e.event_type === "reveal_phone").length;
      const totalReveals = emailReveals + phoneReveals;

      // Calculate views by month (last 6 months)
      const viewsByMonth: { month: string; views: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = startOfMonth(subMonths(new Date(), i - 1));
        const monthViews = viewEvents.filter((e) => {
          const date = new Date(e.created_at);
          return date >= monthStart && date < monthEnd;
        }).length;
        viewsByMonth.push({
          month: format(monthStart, "MMM", { locale: sv }),
          views: monthViews,
        });
      }

      // Calculate leads by status
      const statusCounts = new Map<string, number>();
      allLeads.forEach((lead) => {
        statusCounts.set(lead.status, (statusCounts.get(lead.status) || 0) + 1);
      });
      const leadsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count,
      }));

      // Calculate leads by month (last 6 months)
      const leadsByMonth: { month: string; leads: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = startOfMonth(subMonths(new Date(), i - 1));
        const monthLeads = allLeads.filter((l) => {
          const date = new Date(l.created_at);
          return date >= monthStart && date < monthEnd;
        }).length;
        leadsByMonth.push({
          month: format(monthStart, "MMM", { locale: sv }),
          leads: monthLeads,
        });
      }

      return {
        totalLeads,
        newLeads,
        wonLeads,
        lostLeads,
        conversionRate,
        totalListings,
        publishedListings,
        totalViews,
        totalReveals,
        emailReveals,
        phoneReveals,
        viewsByMonth,
        leadsByStatus,
        leadsByMonth,
      };
    },
  });
}
