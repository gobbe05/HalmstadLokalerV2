/**
 * ADVERTISER DATA HOOKS - LEADS
 * 
 * SECURITY CRITICAL: These hooks filter leads by the current user's listings.
 * Each advertiser can ONLY see leads for their own listings.
 * 
 * For admin access to all leads, use useAdminLeads() instead.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LeadStatus = "new" | "contacted" | "viewing" | "negotiating" | "won" | "lost";
export type LeadType = "listing" | "matching";

export interface Lead {
  id: string;
  listing_id: string | null;
  advertiser_id: string | null;
  contact_name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  notes: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  // Matching-specific fields
  min_area_sqm: number | null;
  max_area_sqm: number | null;
  move_within_months: number | null;
  lease_status: string | null;
  org_number: string | null;
  lead_type: LeadType | null;
}

export interface LeadWithListing extends Lead {
  listing?: {
    id: string;
    titel: string;
    stad: string | null;
    typ: string | null;
    area_sqm: number | null;
  } | null;
}

export function useLeads(listingId?: string) {
  return useQuery({
    queryKey: ["leads", listingId],
    queryFn: async (): Promise<LeadWithListing[]> => {
      // SECURITY: Get current user's profile to filter leads
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        return [];
      }

      // Get the user's profile id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        return [];
      }

      // First get all listing IDs owned by this user
      const { data: userListings } = await supabase
        .from("listings")
        .select("id")
        .eq("owner_id", profile.id);

      const userListingIds = userListings?.map(l => l.id) || [];

      // SECURITY: Fetch leads where:
      // 1. listing_id is owned by this user, OR
      // 2. advertiser_id matches this user's profile
      // Using RLS policies for actual security, this is just for query efficiency
      let query = supabase
        .from("leads")
        .select(`
          *,
          listing:listings(id, titel, stad, typ, area_sqm)
        `)
        .or(`listing_id.in.(${userListingIds.join(",")}),advertiser_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      if (listingId) {
        // Additional filter if specific listing requested
        query = query.eq("listing_id", listingId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((lead) => ({
        ...lead,
        status: lead.status as LeadStatus,
        lead_type: (lead.lead_type || "listing") as LeadType,
        listing: lead.listing as LeadWithListing["listing"],
      }));
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, oldStatus }: { id: string; status: LeadStatus; oldStatus?: LeadStatus }) => {
      const { data, error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id)
        .select("*, listing:listings(id)")
        .single();

      if (error) throw error;
      
      // Log activity for status change
      const statusLabels: Record<LeadStatus, string> = {
        new: "Ny",
        contacted: "Kontaktad",
        viewing: "Visning",
        negotiating: "Förhandling",
        won: "Lokal uthyrd",
        lost: "Förlorad",
      };
      
      const oldLabel = oldStatus ? statusLabels[oldStatus] : "Okänd";
      const newLabel = statusLabels[status];
      
      await supabase.from("activities").insert([{
        lead_id: id,
        listing_id: data.listing?.id || null,
        type: "STATUS_CHANGED",
        description: `Status ändrad från ${oldLabel} till ${newLabel}`,
        meta: { old_status: oldStatus, new_status: status },
      }]);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Lead-status uppdaterad");
    },
    onError: (error) => {
      toast.error("Kunde inte uppdatera status: " + error.message);
    },
  });
}

export function useUpdateLeadNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update({ notes })
        .eq("id", id)
        .select("*, listing:listings(id)")
        .single();

      if (error) throw error;
      
      // Log activity for note added
      const truncatedNote = notes.length > 80 ? notes.slice(0, 80) + "..." : notes;
      
      await supabase.from("activities").insert([{
        lead_id: id,
        listing_id: data.listing?.id || null,
        type: "NOTE_ADDED",
        description: `Anteckning tillagd: ${truncatedNote}`,
        meta: { note_preview: truncatedNote },
      }]);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Anteckning sparad");
    },
    onError: (error) => {
      toast.error("Kunde inte spara anteckning: " + error.message);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead borttagen");
    },
    onError: (error) => {
      toast.error("Kunde inte ta bort lead: " + error.message);
    },
  });
}
