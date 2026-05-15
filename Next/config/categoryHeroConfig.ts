import { PropertyType } from "@/types/property";

export interface CategoryHeroConfig {
  seoTitle: string;
  subtitle: string;
  description: string;
  backgroundVariant: "gradient" | "image";
  gradientClass: string;
  backgroundImageUrl?: string;
}

// Hero configuration for each category with SEO-optimized content
// {cityName} placeholder will be replaced dynamically
export const categoryHeroConfig: Record<string, CategoryHeroConfig> = {
  kontor: {
    seoTitle: "Lediga kontor i {cityName}",
    subtitle: "Kontorslokaler att hyra i {cityName}.",
    description:
      "Här hittar du lediga kontor och kontorsytor för företag som söker rätt läge och rätt storlek – med tydlig överblick och kontakt med uthyrare.",
    backgroundVariant: "gradient",
    gradientClass: "from-slate-900 via-slate-800 to-slate-900",
  },
  lager: {
    seoTitle: "Lagerlokaler i {cityName}",
    subtitle: "Lagerlokaler och logistiklokaler att hyra i {cityName}.",
    description:
      "Här hittar du lediga lager- och logistikutrymmen för företag som söker rätt läge och rätt yta – med tydlig överblick och kontakt med uthyrare.",
    backgroundVariant: "gradient",
    gradientClass: "from-slate-900 via-stone-700 to-slate-900",
  },
  butik: {
    seoTitle: "Butikslokaler i {cityName}",
    subtitle: "Butikslokaler att hyra i {cityName}.",
    description:
      "Här hittar du lediga butikslokaler och handelsytor för företag som söker rätt läge och rätt förutsättningar – med tydlig överblick och kontakt med uthyrare.",
    backgroundVariant: "gradient",
    gradientClass: "from-slate-900 via-emerald-800 to-slate-900",
  },
  industri: {
    seoTitle: "Industrilokaler i {cityName}",
    subtitle: "Industrilokaler och produktionslokaler att hyra i {cityName}.",
    description:
      "Här hittar du lediga industrilokaler, produktionslokaler och verkstadslokaler för verksamheter som söker rätt förutsättningar – med tydlig överblick och kontakt med uthyrare.",
    backgroundVariant: "gradient",
    gradientClass: "from-slate-900 via-amber-800 to-slate-900",
  },
  restaurang: {
    seoTitle: "Restauranglokaler i {cityName}",
    subtitle: "Restauranglokaler och cafélokaler att hyra i {cityName}.",
    description:
      "Här hittar du lediga restauranglokaler och cafélokaler för verksamheter som söker rätt förutsättningar – med tydlig överblick och kontakt med uthyrare.",
    backgroundVariant: "gradient",
    gradientClass: "from-slate-900 via-rose-800 to-slate-900",
  },
  "skola-vard-omsorg": {
    seoTitle: "Lokaler för skola, vård & omsorg i {cityName}",
    subtitle: "Lokaler för skola, vård och omsorg att hyra i {cityName}.",
    description:
      "Här hittar du lediga lokaler för skola, vård och omsorg för verksamheter som söker rätt förutsättningar – med tydlig överblick och kontakt med uthyrare.",
    backgroundVariant: "gradient",
    gradientClass: "from-slate-900 via-sky-800 to-slate-900",
  },
  coworking: {
    seoTitle: "Kontorshotell & coworking i {cityName}",
    subtitle: "Kontorshotell och coworking att hyra i {cityName}.",
    description:
      "Här hittar du lediga kontorshotell och coworkinglokaler för verksamheter som söker flexibla arbetslösningar – med tydlig överblick och kontakt med uthyrare.",
    backgroundVariant: "gradient",
    gradientClass: "from-slate-900 via-violet-800 to-slate-900",
  },
  ovrigt: {
    seoTitle: "Övriga lokaler i {cityName}",
    subtitle: "Övriga lokaler att hyra i {cityName}.",
    description:
      "Här samlas lokaler som inte passar in i någon annan kategori – för verksamheter som söker andra förutsättningar än de vanliga.",
    backgroundVariant: "gradient",
    gradientClass: "from-slate-900 via-gray-700 to-slate-900",
  },
};

// Canonical slugs for each category (SEO-friendly, no underscores)
export const SLUG_TO_TYPE: Record<string, PropertyType> = {
  kontor: "OFFICE",
  lager: "WAREHOUSE_LOGISTICS",
  butik: "SHOP",
  industri: "INDUSTRY_WORKSHOP",
  restaurang: "RESTAURANT_CAFE",
  "skola-vard-omsorg": "SCHOOL_CARE",
  coworking: "OFFICE_HOTEL_COWORKING",
  ovrigt: "OTHER",
};

// Reverse mapping: PropertyType to canonical slug
export const TYPE_TO_SLUG: Record<PropertyType, string> = {
  OFFICE: "kontor",
  WAREHOUSE_LOGISTICS: "lager",
  SHOP: "butik",
  INDUSTRY_WORKSHOP: "industri",
  RESTAURANT_CAFE: "restaurang",
  SCHOOL_CARE: "skola-vard-omsorg",
  OFFICE_HOTEL_COWORKING: "coworking",
  OTHER: "ovrigt",
};

// Legacy slugs that should 301 redirect to canonical slugs
// Maps snake_case and other legacy formats to canonical slugs
export const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  // snake_case variants
  lager_logistik: "lager",
  warehouse_logistics: "lager",
  industry_workshop: "industri",
  industri_verkstad: "industri",
  restaurant_cafe: "restaurang",
  restaurang_cafe: "restaurang",
  skola_vard_omsorg: "skola-vard-omsorg",
  school_care: "skola-vard-omsorg",
  office_hotel_coworking: "coworking",
  kontorshotell_coworking: "coworking",
  kontorshotell: "coworking",
  office: "kontor",
  shop: "butik",
  other: "ovrigt",
};

// Get hero config with city name replaced
export function getHeroConfig(slug: string, cityName: string): CategoryHeroConfig | null {
  const config = categoryHeroConfig[slug];
  if (!config) return null;

  return {
    ...config,
    seoTitle: config.seoTitle.replace("{cityName}", cityName),
    subtitle: config.subtitle.replace("{cityName}", cityName),
    description: config.description.replace("{cityName}", cityName),
  };
}
