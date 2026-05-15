import { Store, Factory, Building2, Users, Warehouse, UtensilsCrossed, GraduationCap, LayoutGrid } from "lucide-react";
import { PropertyType } from "@/types/property";
import { ComponentType } from "react";

export const PROPERTY_TYPE_ICONS: Record<PropertyType, ComponentType<{ className?: string }>> = {
  SHOP: Store,
  INDUSTRY_WORKSHOP: Factory,
  OFFICE: Building2,
  OFFICE_HOTEL_COWORKING: Users,
  WAREHOUSE_LOGISTICS: Warehouse,
  RESTAURANT_CAFE: UtensilsCrossed,
  SCHOOL_CARE: GraduationCap,
  OTHER: LayoutGrid,
};

// Shorter labels for badges (similar to competitors)
export const PROPERTY_TYPE_SHORT_LABELS: Record<PropertyType, string> = {
  SHOP: "Butik",
  INDUSTRY_WORKSHOP: "Verkstad",
  OFFICE: "Kontor",
  OFFICE_HOTEL_COWORKING: "Coworking",
  WAREHOUSE_LOGISTICS: "Lager",
  RESTAURANT_CAFE: "Restaurang",
  SCHOOL_CARE: "Skola",
  OTHER: "Övrigt",
};
