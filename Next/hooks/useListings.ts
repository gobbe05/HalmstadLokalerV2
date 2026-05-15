/**
 * ADVERTISER DATA HOOKS
 * 
 * SECURITY CRITICAL: These hooks are designed for use in the Advertiser portal (/app/*).
 * They MUST filter all data by the current user's profile.id (owner_id).
 * 
 * NEVER use these hooks to fetch data across multiple advertisers.
 * For admin functionality, use the corresponding useAdmin* hooks instead.
 * 
 * Data isolation requirements:
 * - Listings: Filter by owner_id = current user's profile.id
 * - Leads: Only fetch leads for listings owned by current user
 * - Views/Events: Only fetch events for listings owned by current user
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ListingStatus = "draft" | "internal" | "published" | "pending_approval" | "rented";

export interface Listing {
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
  dokument: string[];
  status: ListingStatus;
  market: string | null;
  city_id: string | null;
  is_prelisting: boolean;
  is_address_validated: boolean;
  is_featured?: boolean;
  featured_order?: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingWithStats extends Listing {
  leads_count: number;
  views_count: number;
}

/**
 * Fetches listings for the CURRENT USER ONLY.
 * 
 * SECURITY: This hook filters by owner_id to ensure advertisers
 * only see their own listings. Never remove this filter!
 * 
 * For admin access to all listings, use useAdminListings() instead.
 */
export function useListings() {
  return useQuery({
    queryKey: ["listings"],
    queryFn: async (): Promise<ListingWithStats[]> => {
      // Get current user's profile to filter listings
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

      // Filter listings by owner_id to only show user's own listings
      const { data: listings, error } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get listing IDs for this user only
      const userListingIds = (listings || []).map(l => l.id);
      
      const leadsMap = new Map<string, number>();
      const viewsMap = new Map<string, number>();

      // Only fetch leads/views for user's own listings
      if (userListingIds.length > 0) {
        // Get leads count per listing - only for user's listings
        const { data: leadsCounts } = await supabase
          .from("leads")
          .select("listing_id")
          .in("listing_id", userListingIds);

        // Get views count per listing - only for user's listings
        const { data: viewsCounts } = await supabase
          .from("listing_events")
          .select("listing_id")
          .eq("event_type", "view")
          .in("listing_id", userListingIds);

        leadsCounts?.forEach((lead) => {
          if (lead.listing_id) {
            leadsMap.set(lead.listing_id, (leadsMap.get(lead.listing_id) || 0) + 1);
          }
        });

        viewsCounts?.forEach((event) => {
          viewsMap.set(event.listing_id, (viewsMap.get(event.listing_id) || 0) + 1);
        });
      }

      return (listings || []).map((listing) => ({
        ...listing,
        bilder: listing.bilder || [],
        dokument: listing.dokument || [],
        status: listing.status as ListingStatus,
        is_prelisting: listing.is_prelisting || false,
        is_address_validated: listing.is_address_validated || false,
        leads_count: leadsMap.get(listing.id) || 0,
        views_count: viewsMap.get(listing.id) || 0,
      }));
    },
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async (): Promise<Listing | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      return {
        ...data,
        bilder: data.bilder || [],
        dokument: data.dokument || [],
        status: data.status as ListingStatus,
        is_prelisting: data.is_prelisting || false,
        is_address_validated: data.is_address_validated || false,
      };
    },
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listing: Partial<Listing>) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error("Du måste vara inloggad för att skapa objekt");
      }

      // Get the user's profile id and prelisting default
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, prelisting_default")
        .eq("user_id", user.id)
        .maybeSingle();

      // If profile is missing (no trigger ran), create a minimal one so the user can create drafts
      if (!profile && !profileError) {
        const displayName =
          (user.user_metadata as { display_name?: string } | null)?.display_name ||
          user.email ||
          "";

        // Use upsert to avoid "duplicate key" races if something else creates the profile at the same time
        const { error: upsertError } = await supabase.from("profiles").upsert(
          {
            user_id: user.id,
            email: user.email,
            display_name: displayName,
            status: "pending",
          },
          { onConflict: "user_id" }
        );

        if (upsertError) {
          console.error("[useCreateListing] profile upsert failed", upsertError);
          throw new Error(
            `Kunde inte skapa din profil: ${upsertError.message}` +
              (upsertError.code ? ` (${upsertError.code})` : "")
          );
        }

        const res = await supabase
          .from("profiles")
          .select("id, prelisting_default")
          .eq("user_id", user.id)
          .maybeSingle();

        profile = res.data;
        profileError = res.error;
      }

      if (profileError || !profile) {
        console.error("[useCreateListing] profile fetch failed", profileError);
        throw new Error(
          `Kunde inte hitta din profil` +
            (profileError?.message ? `: ${profileError.message}` : "")
        );
      }

      // Check if user has advertiser role - if not, assign it (first listing = become advertiser)
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "advertiser")
        .maybeSingle();

      if (!existingRole) {
        // First listing - assign advertiser role
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: user.id, role: "advertiser" },
            { onConflict: "user_id,role" }
          );

        if (roleError) {
          console.warn("[useCreateListing] Could not assign advertiser role:", roleError);
          // Don't throw - continue with listing creation
        } else {
          console.info("[useCreateListing] Automatically assigned advertiser role to user");
        }
      }

      const { data, error } = await supabase
        .from("listings")
        .insert({
          titel: listing.titel || "Ny lokal",
          adress: listing.adress,
          stad: listing.stad,
          postnummer: listing.postnummer,
          kommun: listing.kommun,
          typ: listing.typ,
          area_sqm: listing.area_sqm,
          hyra_per_m2_ar: listing.hyra_per_m2_ar,
          beskrivning_kort: listing.beskrivning_kort,
          beskrivning_lang: listing.beskrivning_lang,
          koordinater_lat: listing.koordinater_lat,
          koordinater_lng: listing.koordinater_lng,
          bilder: listing.bilder || [],
          dokument: listing.dokument || [],
          status: listing.status || "draft",
          market: listing.market,
          city_id: listing.city_id,
          is_prelisting: listing.is_prelisting ?? profile.prelisting_default ?? false,
          is_address_validated: listing.is_address_validated || false,
          user_id: user.id,
          owner_id: profile.id,
        })
        .select()
        .single();

      if (error) {
        console.error("[useCreateListing] listings insert failed", {
          message: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        });

        throw new Error(
          `Kunde inte skapa objekt: ${error.message}` +
            ((error as any).code ? ` (${(error as any).code})` : "")
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["user-role"] }); // Refresh role after auto-assignment
      toast.success("Objekt skapat");
    },
    onError: (error) => {
      toast.error("Kunde inte skapa objekt: " + error.message);
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Listing> & { id: string }) => {
      const { data, error } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", data.id] });
      queryClient.invalidateQueries({ queryKey: ["app-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      
      // Only show toast for pending_approval status (triggered by server)
      // Other status toasts are handled by the calling component
      if (data.status === "pending_approval") {
        toast.info("Lokalen väntar på godkännande", {
          description: "Din lokal publiceras automatiskt när ditt konto har godkänts.",
        });
      }
    },
    onError: (error) => {
      // Check if this is a validation error from the publish trigger
      const isPublishValidationError = 
        error.message.includes("obligatoriskt för att publicera") ||
        error.message.includes("måste vara validerad") ||
        error.message.includes("måste anges och vara större");
      
      if (isPublishValidationError) {
        toast.error("Objektet är inte redo att publiceras", {
          description: "Minst ett obligatoriskt fält saknas. Scrolla igenom formuläret och fyll i de markerade fälten.",
        });
      } else {
        toast.error("Kunde inte uppdatera objekt: " + error.message);
      }
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Objekt borttaget");
    },
    onError: (error) => {
      toast.error("Kunde inte ta bort objekt: " + error.message);
    },
  });
}

/**
 * Soft-delete a listing by setting deleted_at timestamp.
 * This preserves the listing in the database but hides it from public view.
 * Used for permanent removal where we want to signal noindex to search engines.
 */
export function useSoftDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("listings")
        .update({ deleted_at: new Date().toISOString(), status: "draft" as ListingStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Lokal permanent raderad", {
        description: "Lokalen är nu dold och kommer avindexeras från sökmotorer.",
      });
    },
    onError: (error) => {
      toast.error("Kunde inte radera: " + error.message);
    },
  });
}

/**
 * Restore a soft-deleted listing by clearing the deleted_at timestamp.
 */
export function useRestoreListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("listings")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Lokal återställd");
    },
    onError: (error) => {
      toast.error("Kunde inte återställa: " + error.message);
    },
  });
}
