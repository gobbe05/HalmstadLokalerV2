import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CategorySeo {
  id: string;
  city_id: string;
  category_slug: string;
  seo_title: string | null;
  subtitle: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategorySeoInput {
  city_id: string;
  category_slug: string;
  seo_title?: string | null;
  subtitle?: string | null;
  description?: string | null;
}

// Fetch all category SEO entries (for admin)
export function useCategorySeoList(cityId?: string) {
  return useQuery({
    queryKey: ["category-seo", cityId],
    queryFn: async () => {
      let query = supabase
        .from("category_seo")
        .select("*")
        .order("category_slug");
      
      if (cityId) {
        query = query.eq("city_id", cityId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as CategorySeo[];
    },
  });
}

// Fetch single category SEO entry (for public pages)
export function useCategorySeo(cityId: string | undefined, categorySlug: string | undefined) {
  return useQuery({
    queryKey: ["category-seo", cityId, categorySlug],
    queryFn: async () => {
      if (!cityId || !categorySlug) return null;
      
      const { data, error } = await supabase
        .from("category_seo")
        .select("*")
        .eq("city_id", cityId)
        .eq("category_slug", categorySlug)
        .maybeSingle();
      
      if (error) throw error;
      return data as CategorySeo | null;
    },
    enabled: !!cityId && !!categorySlug,
  });
}

// Upsert (create or update) category SEO entry
export function useUpsertCategorySeo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CategorySeoInput) => {
      const { data, error } = await supabase
        .from("category_seo")
        .upsert(
          {
            city_id: input.city_id,
            category_slug: input.category_slug,
            seo_title: input.seo_title,
            subtitle: input.subtitle,
            description: input.description,
          },
          { onConflict: "city_id,category_slug" }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data as CategorySeo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["category-seo"] });
      toast.success("SEO-text sparad");
    },
    onError: (error) => {
      console.error("Error saving category SEO:", error);
      toast.error("Kunde inte spara SEO-text");
    },
  });
}

// Delete category SEO entry (revert to default)
export function useDeleteCategorySeo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ cityId, categorySlug }: { cityId: string; categorySlug: string }) => {
      const { error } = await supabase
        .from("category_seo")
        .delete()
        .eq("city_id", cityId)
        .eq("category_slug", categorySlug);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-seo"] });
      toast.success("Återställd till standardtext");
    },
    onError: (error) => {
      console.error("Error deleting category SEO:", error);
      toast.error("Kunde inte återställa text");
    },
  });
}
