'use client'

import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { PropertyTypeModal } from "./PropertyTypeModal";
import { useRouter } from "next/navigation";

interface StartPageHeroProps {
  cityName: string;
  backgroundImageUrl?: string | null;
  blurPlaceholder?: string | null;
  propertyCount?: number;
}

// Helper to construct responsive image URLs from base path
function getResponsiveImageUrls(baseUrl: string | null | undefined) {
  if (!baseUrl) {
    return {
      src: null,
      srcSet: undefined,
    };
  }

  // Check if it's a base path (no extension) or full URL
  const isBasePath = !baseUrl.match(/\.(jpg|jpeg|png|webp)$/i);
  
  if (isBasePath) {
    // Construct srcset from base path
    return {
      src: `${baseUrl}-lg.jpg`,
      srcSet: `${baseUrl}-sm.jpg 640w, ${baseUrl}-md.jpg 1024w, ${baseUrl}-lg.jpg 1920w`,
    };
  }

  // Single image URL - use as-is
  return {
    src: baseUrl,
    srcSet: undefined,
  };
}

export function StartPageHero({
  cityName,
  backgroundImageUrl,
  blurPlaceholder,
  propertyCount,
}: StartPageHeroProps) {
  const { src, srcSet } = getResponsiveImageUrls(backgroundImageUrl);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const navigate = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Autofocus on desktop only
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate.push(`/lokaler?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate.push("/lokaler");
    }
  };

  return (
    <section className="relative w-full overflow-hidden h-[360px] sm:h-[400px] md:h-[440px] bg-foreground">
      {/* Blur placeholder - shown while main image loads */}
      {blurPlaceholder && !imageLoaded && (
        <img 
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg"
        />
      )}
      
      {/* Background image with subtle blur for reduced dominance */}
      {src && (
        <img 
          src={src}
          srcSet={srcSet}
          sizes="100vw"
          alt={`Vy över ${cityName}`}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            "blur-[1px]", // Subtle blur to reduce visual dominance
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
        />
      )}
      
      {/* Darker overlay - 60-70% opacity for search focus */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      
      {/* Photo credit */}
      <span className="absolute bottom-3 right-4 text-[10px] text-white/40 z-20 font-medium tracking-wide">
        Foto: Joakim Leihed
      </span>
      
      {/* Content - centered with search as hero */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
        {/* Main headline - H1 for SEO */}
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-3">
          Lediga lokaler i {cityName}
        </h1>
        
        {/* Action-oriented subheadline */}
        <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-md mb-6 md:mb-8 font-medium">
          Hitta rätt lokal – snabbt och lokalt
        </p>
        
        {/* Search Zone - larger and more prominent */}
        <form onSubmit={handleSearch} className="w-full max-w-lg">
          {/* Main search row - always inline */}
          <div className="relative flex items-center bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Sök adress..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-1 h-12 sm:h-14 md:h-16 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 flex-1 min-w-0"
            />
            
            {/* Property type selector - always visible */}
            <button
              type="button"
              onClick={() => setTypeModalOpen(true)}
              className="flex items-center gap-1 px-2 sm:px-3 h-8 sm:h-10 md:h-12 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap border-l border-border/30"
            >
              <span className="text-xs sm:text-sm font-medium">Typ</span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            
            {/* Main CTA button */}
            <button
              type="submit"
              className="flex items-center justify-center px-3 sm:px-5 h-10 sm:h-12 md:h-14 mr-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg sm:rounded-xl transition-colors whitespace-nowrap"
            >
              <span className="text-sm sm:text-base">Sök</span>
            </button>
          </div>
        </form>
        
        {/* Optional: Property count as subtle badge */}
        {propertyCount !== undefined && propertyCount > 0 && (
          <p className="mt-4 text-xs sm:text-sm text-white/70">
            <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {propertyCount} lediga lokaler
            </span>
          </p>
        )}
      </div>
      
      {/* Property Type Selection Modal */}
      <PropertyTypeModal open={typeModalOpen} onOpenChange={setTypeModalOpen} />
    </section>
  );
}
