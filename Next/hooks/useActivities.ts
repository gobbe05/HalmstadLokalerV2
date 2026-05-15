import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export type ActivityType = 
  | "LEAD_CREATED" 
  | "STATUS_CHANGED" 
  | "NOTE_ADDED" 
  | "EMAIL_SENT" 
  | "CALL_MADE"
  | "MANUAL_ACTIVITY";

export interface Activity {
  id: string;
  created_at: string;
  user_id: string | null;
  lead_id: string | null;
  listing_id: string | null;
  type: ActivityType;
  description: string;
  meta: Json | null;
}

export function useActivitiesForLead(leadId: string | null, options?: { limit?: number; offset?: number; listingId?: string | null }) {
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;
  
  return useQuery({
    queryKey: ["activities", "lead", leadId, limit, offset],
    queryFn: async (): Promise<{ data: Activity[]; hasMore: boolean }> => {
      if (!leadId) return { data: [], hasMore: false };
      
      // IMPORTANT: Only fetch activities for THIS specific lead, not shared listing activities
      const { data, error, count } = await supabase
        .from("activities")
        .select("*", { count: "exact" })
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { 
        data: (data || []) as Activity[], 
        hasMore: count ? offset + limit < count : false 
      };
    },
    enabled: !!leadId,
  });
}

export function useActivitiesForListing(listingId: string | null, options?: { limit?: number; offset?: number }) {
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;
  
  return useQuery({
    queryKey: ["activities", "listing", listingId, limit, offset],
    queryFn: async (): Promise<{ data: Activity[]; hasMore: boolean }> => {
      if (!listingId) return { data: [], hasMore: false };
      
      // First get all lead IDs for this listing
      const { data: leads } = await supabase
        .from("leads")
        .select("id")
        .eq("listing_id", listingId);
      
      const leadIds = leads?.map(l => l.id) || [];
      
      // Build the filter - activities directly on listing OR on any of its leads
      let query = supabase
        .from("activities")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (leadIds.length > 0) {
        query = query.or(`listing_id.eq.${listingId},lead_id.in.(${leadIds.join(",")})`);
      } else {
        query = query.eq("listing_id", listingId);
      }
      
      const { data, error, count } = await query;

      if (error) throw error;
      return { 
        data: (data || []) as Activity[], 
        hasMore: count ? offset + limit < count : false 
      };
    },
    enabled: !!listingId,
  });
}

export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      listingId,
      type,
      description,
      meta,
    }: {
      leadId?: string | null;
      listingId?: string | null;
      type: ActivityType;
      description: string;
      meta?: Json;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("activities")
        .insert([{
          user_id: user?.id || null,
          lead_id: leadId || null,
          listing_id: listingId || null,
          type,
          description,
          meta: meta || {},
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ["activities", "lead", variables.leadId] });
      }
      if (variables.listingId) {
        queryClient.invalidateQueries({ queryKey: ["activities", "listing", variables.listingId] });
      }
    },
    onError: (error) => {
      console.error("Failed to log activity:", error);
    },
  });
}

export function useCreateManualActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      listingId,
      description,
    }: {
      leadId?: string | null;
      listingId?: string | null;
      description: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("activities")
        .insert([{
          user_id: user?.id || null,
          lead_id: leadId || null,
          listing_id: listingId || null,
          type: "MANUAL_ACTIVITY",
          description,
          meta: {},
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ["activities", "lead", variables.leadId] });
      }
      if (variables.listingId) {
        queryClient.invalidateQueries({ queryKey: ["activities", "listing", variables.listingId] });
      }
      toast.success("Aktivitet tillagd");
    },
    onError: (error) => {
      toast.error("Kunde inte lägga till aktivitet: " + error.message);
    },
  });
}

export function useCreateTypedActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      listingId,
      type,
      description,
    }: {
      leadId?: string | null;
      listingId?: string | null;
      type: ActivityType;
      description: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("activities")
        .insert([{
          user_id: user?.id || null,
          lead_id: leadId || null,
          listing_id: listingId || null,
          type,
          description,
          meta: {},
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ["activities", "lead", variables.leadId] });
      }
      if (variables.listingId) {
        queryClient.invalidateQueries({ queryKey: ["activities", "listing", variables.listingId] });
      }
      const typeLabels: Record<ActivityType, string> = {
        NOTE_ADDED: "Anteckning tillagd",
        CALL_MADE: "Samtal registrerat",
        EMAIL_SENT: "E-post registrerat",
        LEAD_CREATED: "Lead skapad",
        STATUS_CHANGED: "Status ändrad",
        MANUAL_ACTIVITY: "Aktivitet tillagd",
      };
      toast.success(typeLabels[variables.type] || "Aktivitet tillagd");
    },
    onError: (error) => {
      toast.error("Kunde inte lägga till aktivitet: " + error.message);
    },
  });
}
