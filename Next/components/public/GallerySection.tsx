'use client'
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageLightbox } from "./ImageLightbox";
import { getSrcSet, getSizes, isOptimizedImage, getImageUrl } from "@/lib/imageUtils";

interface GalleryImageProps {
  src: string;
  alt: string;
  onClick: () => void;
}

function GalleryImage({ src, alt, onClick }: GalleryImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use responsive images if available
  const srcSet = isOptimizedImage(src) ? getSrcSet(src) : undefined;
  const sizes = isOptimizedImage(src) ? "(max-width: 768px) 100vw, 800px" : undefined;

  return (
    <div className="relative w-full min-h-[160px] aspect-[4/3] md:max-w-[700px] lg:max-w-[800px] overflow-hidden rounded-xl">
      {!isLoaded && (
        <Skeleton className="absolute inset-0 rounded-xl" />
      )}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full min-h-[160px] object-cover cursor-pointer hover:opacity-90 transition-opacity ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClick}
      />
    </div>
  );
}

interface HeroImageProps {
  src: string;
  alt: string;
  onClick: () => void;
  /** Set to true for LCP image (above the fold) */
  priority?: boolean;
}

function HeroImage({ src, alt, onClick, priority = false }: HeroImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use responsive images if available
  const srcSet = isOptimizedImage(src) ? getSrcSet(src) : undefined;
  const sizes = isOptimizedImage(src) ? getSizes('slider') : undefined;
  
  // For priority images, use a small blur placeholder while loading
  const placeholderSrc = isOptimizedImage(src) ? getImageUrl(src, 'small') : null;

  return (
    <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
      {/* Blur placeholder for priority images */}
      {priority && placeholderSrc && !isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
        />
      )}
      {/* Skeleton fallback for non-priority or non-optimized images */}
      {!isLoaded && (!priority || !placeholderSrc) && (
        <Skeleton className="absolute inset-0" />
      )}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        // LCP optimization: priority images load eagerly with high fetch priority
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClick}
      />
    </div>
  );
}

interface GallerySectionProps {
  images: string[];
  title: string;
  /** Custom heading for the gallery section */
  heading?: string;
  /** Show the hero image as part of the section */
  showHero?: boolean;
  /** Custom class for the hero image container */
  heroClassName?: string;
  /** Custom class for the gallery container */
  galleryClassName?: string;
}

export function GallerySection({
  images,
  title,
  heading = "Fler bilder",
  showHero = false,
  heroClassName = "mb-sp-1 md:mb-sp-2",
  galleryClassName = "",
}: GallerySectionProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const galleryImages = showHero ? images.slice(1) : images;
  const startIndex = showHero ? 1 : 0;

  return (
    <>
      {/* Lightbox */}
      <ImageLightbox
        images={images}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />

      {/* Hero image */}
      {showHero && images[0] && (
        <div className={heroClassName}>
          <HeroImage
            src={images[0]}
            alt={title}
            onClick={() => openLightbox(0)}
          />
        </div>
      )}

      {/* Gallery - remaining images (vertical stack on all devices) */}
      {galleryImages.length > 0 && (
        <div className={galleryClassName}>
          <h2 className="text-lg font-semibold mb-1">{heading}</h2>
          <div className="flex flex-col gap-3">
            {galleryImages.map((image, index) => (
              <div key={index}>
                <GalleryImage
                  src={image}
                  alt={`${title} - bild ${startIndex + index + 1}`}
                  onClick={() => openLightbox(startIndex + index)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Export individual components for cases where more control is needed
export { GalleryImage, HeroImage };

