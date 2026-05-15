'use client'
import { useEffect, useCallback, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handlePrevious = useCallback(() => {
    onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, images.length, onNavigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchEndX.current = e.touches[0].clientX;
    const diff = touchEndX.current - touchStartX.current;
    setSwipeOffset(diff * 0.3); // Subtle visual feedback
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) {
      setSwipeOffset(0);
      return;
    }

    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrevious();
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setSwipeOffset(0);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, handlePrevious, handleNext]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Stäng"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 text-white/80 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navigation - Previous (hidden on mobile) */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden sm:block"
          aria-label="Föregående bild"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Main image with swipe support */}
      <img
        src={images[currentIndex]}
        alt={`Bild ${currentIndex + 1}`}
        className="max-h-[85vh] max-w-[90vw] object-contain select-none transition-transform duration-100"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={false}
      />

      {/* Navigation - Next (hidden on mobile) */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden sm:block"
          aria-label="Nästa bild"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto p-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(index);
              }}
              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all ${
                index === currentIndex
                  ? "ring-2 ring-white opacity-100"
                  : "opacity-50 hover:opacity-75"
              }`}
            >
              <img
                src={image}
                alt={`Miniatyr ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

