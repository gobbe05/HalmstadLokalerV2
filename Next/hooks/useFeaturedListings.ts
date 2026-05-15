import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FEATURED = 4;

interface ToggleFeaturedParams {
  listingId: string;
  isFeatured: boolean;
}

/**
 * Hook for managing featured listings (admin only)
 */
export function useToggleFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, isFeatured }: ToggleFeaturedParams) => {
      if (isFeatured) {
        // Check how many featured listings exist
        const { count, error: countError } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("is_featured", true);

        if (countError) throw countError;

        if (count && count >= MAX_FEATURED) {
          throw new Error(`Max ${MAX_FEATURED} utvalda annonser tillåtna`);
        }

        // Get next featured_order
        const { data: maxOrderData } = await supabase
          .from("listings")
          .select("featured_order")
          .eq("is_featured", true)
          .order("featured_order", { ascending: false })
          .limit(1)
          .single();

        const nextOrder = (maxOrderData?.featured_order || 0) + 1;

        // Set as featured
        const { error } = await supabase
          .from("listings")
          .update({ 
            is_featured: true, 
            featured_order: nextOrder 
          })
          .eq("id", listingId);

        if (error) throw error;
      } else {
        // Remove featured status
        const { error } = await supabase
          .from("listings")
          .update({ 
            is_featured: false, 
            featured_order: 0 
          })
          .eq("id", listingId);

        if (error) throw error;
      }
    },
    onSuccess: (_, { isFeatured }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["featured-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success(isFeatured ? "Annons markerad som utvald" : "Annons borttagen från utvalda");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunde inte uppdatera utvald-status");
    },
  });
}

/**
 * Get count of currently featured listings
 */
export async function getFeaturedCount(): Promise<number> {
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("is_featured", true);

  if (error) {
    console.error("Error getting featured count:", error);
    return 0;
  }

  return count || 0;
}

export { MAX_FEATURED };
