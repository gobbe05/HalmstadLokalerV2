import { supabase } from "@/integrations/supabase/client";
import type { PropertyType } from "@/types/property";

export interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  city: string;
  area: string | null;
  category: string | null;
  categories: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  image: string | null;
  published: boolean;
  featured: boolean;
  sort_order: number;
  reading_time: number | null;
  created_at: string;
  updated_at: string;
}

export const GUIDE_CATEGORIES = [
  "kontor",
  "lager",
  "butik",
  "verkstad",
  "restaurang",
  "annat",
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  kontor: "Kontor",
  lager: "Lager",
  butik: "Butik",
  verkstad: "Verkstad",
  restaurang: "Restaurang",
  annat: "Annat",
};

// Map guide category -> existing PropertyType values used in the listings system.
// A category can map to multiple PropertyTypes (used for filtering related properties).
export const CATEGORY_TO_TYPES: Record<GuideCategory, PropertyType[]> = {
  kontor: ["OFFICE", "OFFICE_HOTEL_COWORKING"],
  lager: ["WAREHOUSE_LOGISTICS"],
  butik: ["SHOP"],
  verkstad: ["INDUSTRY_WORKSHOP"],
  restaurang: ["RESTAURANT_CAFE"],
  annat: ["OTHER", "SCHOOL_CARE"],
};

export function calculateReadingTime(content: string | null | undefined): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getGuideCategories(guide: Pick<Guide, "category" | "categories">): string[] {
  if (guide.categories && guide.categories.length > 0) return guide.categories;
  if (guide.category) return [guide.category];
  return [];
}

export function slugifyGuideTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/&/g, "och")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export interface FetchGuidesParams {
  publishedOnly?: boolean;
  featured?: boolean;
  limit?: number;
  city?: string;
  area?: string;
  category?: string;
  excludeSlug?: string;
}

export async function fetchGuides(params: FetchGuidesParams = {}): Promise<Guide[]> {
  const {
    publishedOnly = true,
    featured,
    limit,
    city,
    area,
    category,
    excludeSlug,
  } = params;

  let query = supabase.from("guides").select("*");

  if (publishedOnly) query = query.eq("published", true);
  if (typeof featured === "boolean") query = query.eq("featured", featured);
  if (city) query = query.eq("city", city);
  if (area) query = query.eq("area", area);
  if (category) query = query.or(`category.eq.${category},categories.cs.{${category}}`);
  if (excludeSlug) query = query.neq("slug", excludeSlug);

  query = query
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Guide[];
}

export async function fetchGuideBySlug(slug: string): Promise<Guide | null> {
  const { data, error } = await supabase
    .from("guides")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  return (data as Guide) || null;
}

export async function fetchAllGuidesAdmin(): Promise<Guide[]> {
  const { data, error } = await supabase
    .from("guides")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as Guide[];
}
