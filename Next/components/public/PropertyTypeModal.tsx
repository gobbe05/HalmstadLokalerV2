'use client'
import { X, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropertyType, PROPERTY_TYPE_LABELS } from "@/types/property";
import { TYPE_TO_SLUG } from "@/config/categoryHeroConfig";
import {
  Store,
  Factory,
  Building2,
  Users,
  Warehouse,
  UtensilsCrossed,
  GraduationCap,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORY_ICONS: Record<PropertyType, React.ComponentType<{ className?: string }>> = {
  SHOP: Store,
  INDUSTRY_WORKSHOP: Factory,
  OFFICE: Building2,
  OFFICE_HOTEL_COWORKING: Users,
  WAREHOUSE_LOGISTICS: Warehouse,
  RESTAURANT_CAFE: UtensilsCrossed,
  SCHOOL_CARE: GraduationCap,
  OTHER: MoreHorizontal,
};

// Order of categories in the modal
const CATEGORY_ORDER: PropertyType[] = [
  "OFFICE",
  "WAREHOUSE_LOGISTICS",
  "SHOP",
  "INDUSTRY_WORKSHOP",
  "RESTAURANT_CAFE",
  "OFFICE_HOTEL_COWORKING",
  "SCHOOL_CARE",
  "OTHER",
];

interface PropertyTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyTypeModal({ open, onOpenChange }: PropertyTypeModalProps) {
  const router = useRouter();

  const handleTypeClick = (type: PropertyType) => {
    onOpenChange(false);
    const slug = TYPE_TO_SLUG[type];
    router.push(`/${slug}/`);
  };

  const handleShowAll = () => {
    onOpenChange(false);
    router.push("/lokaler");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-bold animate-fade-in">Vad letar du efter?</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 sm:p-6">
          {/* Property type grid with staggered animations */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORY_ORDER.map((type, index) => {
              const Icon = CATEGORY_ICONS[type];
              const label = PROPERTY_TYPE_LABELS[type];
              
              return (
                <button
                  key={type}
                  onClick={() => handleTypeClick(type)}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-accent/30 bg-transparent hover:bg-accent/5 hover:border-accent transition-all duration-200 group opacity-0 animate-fade-in hover:scale-[1.02]"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-200">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-center leading-tight text-foreground">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Show all link at bottom */}
        <div 
          className="px-6 pb-6 pt-2 opacity-0 animate-fade-in"
          style={{ 
            animationDelay: `${CATEGORY_ORDER.length * 50 + 100}ms`,
            animationFillMode: 'forwards'
          }}
        >
          <Button
            variant="ghost"
            onClick={handleShowAll}
            className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
          >
            Visa alla lokaler
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

