import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { City } from "@/contexts/CityContext";

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async (): Promise<City[]> => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCity(id: string | undefined) {
  return useQuery({
    queryKey: ["city", id],
    queryFn: async (): Promise<City | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (city: Partial<City>) => {
      const { data, error } = await supabase
        .from("cities")
        .insert({
          id: city.id,
          name: city.name,
          domain: city.domain || null,
          is_published: city.is_published ?? false,
          seo_title: city.seo_title || null,
          seo_description: city.seo_description || null,
          intro_text: city.intro_text || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("Stad skapad");
    },
    onError: (error) => {
      toast.error("Kunde inte skapa stad: " + error.message);
    },
  });
}

export function useUpdateCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<City> & { id: string }) => {
      const { data, error } = await supabase
        .from("cities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["city", data.id] });
      toast.success("Stad uppdaterad");
    },
    onError: (error) => {
      toast.error("Kunde inte uppdatera stad: " + error.message);
    },
  });
}

export function useDeleteCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("Stad borttagen");
    },
    onError: (error) => {
      toast.error("Kunde inte ta bort stad: " + error.message);
    },
  });
}
