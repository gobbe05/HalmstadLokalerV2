'use client'
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlurImage } from "@/components/ui/blur-image";
import { getImageUrl, getSrcSet, getSizes, isOptimizedImage } from "@/lib/imageUtils";

interface ImageSliderProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageSlider({ images, alt, className }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeImages = images.length > 0 ? images : ["/placeholder.svg"];

  // Preload first large image
  useEffect(() => {
    if (safeImages[0] && isOptimizedImage(safeImages[0])) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getImageUrl(safeImages[0], 'large');
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [safeImages]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = safeImages[currentIndex];
  const largeImage = getImageUrl(currentImage, 'large');
  const srcSet = getSrcSet(currentImage);

  return (
    <div className={cn("relative group", className)}>
      {/* Main image - 16:9 aspect ratio with zoom crop */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-secondary">
        <div className="h-full w-full scale-[1.06]">
          <BlurImage
          src={largeImage}
          srcSet={srcSet || undefined}
          sizes={isOptimizedImage(currentImage) ? getSizes('slider') : undefined}
            alt={`${alt} - Bild ${currentIndex + 1}`}
            loading="eager"
          />
        </div>

        {/* Navigation arrows - minimal */}
        {safeImages.length > 1 && (
          <>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-sm"
              onClick={goToPrevious}
              aria-label="Föregående bild"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-sm"
              onClick={goToNext}
              aria-label="Nästa bild"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Image counter - subtle */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-sm font-medium">
            {currentIndex + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails - clean */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {safeImages.map((image, index) => {
            const thumbImage = getImageUrl(image, 'small');
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all",
                  index === currentIndex
                    ? "ring-2 ring-foreground"
                    : "opacity-50 hover:opacity-100"
                )}
                aria-label={`Visa bild ${index + 1}`}
              >
                <img
                  src={thumbImage}
                  alt={`${alt} - Miniatyr ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

