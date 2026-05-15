'use client'
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getImageUrl, isOptimizedImage } from "@/lib/imageUtils";

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  srcSet?: string;
  loading?: "lazy" | "eager";
}

/**
 * Image component with blur-up loading effect.
 * Uses the small version as a blur placeholder while the full image loads.
 */
export function BlurImage({ 
  src, 
  alt, 
  className, 
  sizes, 
  srcSet,
  loading = "lazy" 
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Get the small version for blur placeholder
  const placeholderSrc = isOptimizedImage(src) 
    ? getImageUrl(src, 'small') 
    : src;

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Blur placeholder - always visible initially */}
      <img
        src={placeholderSrc}
        alt=""
        aria-hidden="true"
        className={cn(
          "absolute inset-0 h-full w-full object-cover blur-lg scale-110",
          "transition-opacity duration-500",
          isLoaded ? "opacity-0" : "opacity-100",
          className
        )}
      />
      
      {/* Main image - fades in when loaded */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        className={cn(
          "relative h-full w-full object-cover",
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
}

