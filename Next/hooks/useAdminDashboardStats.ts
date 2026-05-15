'use client'
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format } from "date-fns";
import { sv } from "date-fns/locale";

export interface AdminDashboardStats {
  // Aggregate stats
  totalLeads: number;
  newLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalListings: number;
  publishedListings: number;
  draftListings: number;
  totalViews: number;
  totalCustomers: number;
  activeCustomers: number;
  
  // Time-based stats
  viewsByMonth: { month: string; views: number }[];
  leadsByMonth: { month: string; leads: number }[];
  leadsByStatus: { status: string; count: number }[];
  
  // Top performers
  topListingsByViews: { id: string; titel: string; views: number; owner_name: string }[];
  topListingsByLeads: { id: string; titel: string; leads: number; owner_name: string }[];
}

/**
 * Admin-only hook to fetch aggregated statistics across ALL customers.
 * This should only be used in the Admin portal (/admin/*).
 */
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async (): Promise<AdminDashboardStats> => {
      // Fetch all listings with owner info
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select(`
          id, 
          titel, 
          status,
          owner:profiles!listings_owner_id_fkey(id, display_name, company_name)
        `);
      
      if (listingsError) throw listingsError;

      const allListings = listings || [];
      const listingIds = allListings.map(l => l.id);

      // Fetch all leads
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id, status, created_at, listing_id");
      
      if (leadsError) throw leadsError;
      const allLeads = leads || [];

      // Fetch all view events
      const { data: events, error: eventsError } = await supabase
        .from("listing_events")
        .select("id, listing_id, created_at")
        .eq("event_type", "view");
      
      if (eventsError) throw eventsError;
      const allEvents = events || [];

      // Fetch all advertiser user_ids first
      const { data: advertiserRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "advertiser");
      
      if (rolesError) throw rolesError;
      const advertiserUserIds = (advertiserRoles || []).map(r => r.user_id);

      // Fetch customers (profiles with advertiser role only)
      let allCustomers: { id: string; is_active: boolean; deleted_at: string | null }[] = [];
      
      if (advertiserUserIds.length > 0) {
        const { data: customers, error: customersError } = await supabase
          .from("profiles")
          .select("id, is_active, deleted_at")
          .in("user_id", advertiserUserIds);
        
        if (customersError) throw customersError;
        allCustomers = (customers || []).filter(c => !c.deleted_at);
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
      const draftListings = allListings.filter((l) => l.status === "draft").length;

      // Calculate customer stats
      const totalCustomers = allCustomers.length;
      const activeCustomers = allCustomers.filter(c => c.is_active).length;

      // Calculate views stats
      const totalViews = allEvents.length;

      // Build views per listing map
      const viewsPerListing = new Map<string, number>();
      allEvents.forEach((e) => {
        viewsPerListing.set(e.listing_id, (viewsPerListing.get(e.listing_id) || 0) + 1);
      });

      // Build leads per listing map
      const leadsPerListing = new Map<string, number>();
      allLeads.forEach((l) => {
        if (l.listing_id) {
          leadsPerListing.set(l.listing_id, (leadsPerListing.get(l.listing_id) || 0) + 1);
        }
      });

      // Top listings by views
      const topListingsByViews = allListings
        .map((l) => ({
          id: l.id,
          titel: l.titel,
          views: viewsPerListing.get(l.id) || 0,
          owner_name: (l.owner as any)?.company_name || (l.owner as any)?.display_name || "Okänd",
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Top listings by leads
      const topListingsByLeads = allListings
        .map((l) => ({
          id: l.id,
          titel: l.titel,
          leads: leadsPerListing.get(l.id) || 0,
          owner_name: (l.owner as any)?.company_name || (l.owner as any)?.display_name || "Okänd",
        }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 5);

      // Calculate views by month (last 6 months)
      const viewsByMonth: { month: string; views: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = startOfMonth(subMonths(new Date(), i - 1));
        const monthViews = allEvents.filter((e) => {
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
        draftListings,
        totalViews,
        totalCustomers,
        activeCustomers,
        viewsByMonth,
        leadsByMonth,
        leadsByStatus,
        topListingsByViews,
        topListingsByLeads,
      };
    },
  });
}
