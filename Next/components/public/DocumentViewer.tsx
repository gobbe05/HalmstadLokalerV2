'use client'
import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ExternalLink, 
  Download,
  FileText,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  documents: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  propertyTitle?: string;
  propertyCity?: string;
}

// Helper to get file extension
function getFileExtension(url: string): string {
  const parts = url.split('.');
  return parts[parts.length - 1]?.toLowerCase().split('?')[0] || '';
}

// Helper to check if URL is a PDF
function isPdf(url: string): boolean {
  return getFileExtension(url) === 'pdf';
}

// Helper to get filename from URL
function getFileName(url: string): string {
  const parts = url.split('/');
  const fullName = parts[parts.length - 1];
  // Remove timestamp and random string prefix if present
  const decoded = decodeURIComponent(fullName.split('?')[0]);
  const nameParts = decoded.split('_');
  if (nameParts.length >= 3) {
    return nameParts.slice(2).join('_');
  }
  return decoded;
}

export function DocumentViewer({
  documents,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  propertyTitle = "Lokal",
  propertyCity = "Halmstad",
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const touchStartX = useRef<number | null>(null);

  const currentDoc = documents[currentIndex];
  const isCurrentPdf = currentDoc ? isPdf(currentDoc) : false;
  const fileName = currentDoc ? getFileName(currentDoc) : '';

  // Reset zoom and position when changing documents
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsLoading(true);
    setPdfPage(1);
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isFullscreen, currentIndex]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handlePrevious = useCallback(() => {
    if (isCurrentPdf && pdfPage > 1) {
      setPdfPage(p => p - 1);
    } else {
      onNavigate(currentIndex === 0 ? documents.length - 1 : currentIndex - 1);
    }
  }, [currentIndex, documents.length, onNavigate, isCurrentPdf, pdfPage]);

  const handleNext = useCallback(() => {
    if (isCurrentPdf && pdfPage < pdfTotalPages) {
      setPdfPage(p => p + 1);
    } else {
      onNavigate(currentIndex === documents.length - 1 ? 0 : currentIndex + 1);
    }
  }, [currentIndex, documents.length, onNavigate, isCurrentPdf, pdfPage, pdfTotalPages]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    if (isFullscreen) {
      await document.exitFullscreen?.();
    } else {
      await containerRef.current.requestFullscreen?.();
    }
  };

  const handleOpenNewTab = () => {
    if (currentDoc) window.open(currentDoc, '_blank');
  };

  const handleDownload = async () => {
    if (!currentDoc) return;
    try {
      const response = await fetch(currentDoc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'dokument';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(currentDoc, '_blank');
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = position;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) {
      // Pan mode
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      positionStartRef.current = position;
      setIsDragging(true);
    } else {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoom > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPosition({
        x: positionStartRef.current.x + dx,
        y: positionStartRef.current.y + dy,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 50;

    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrevious();
    }

    touchStartX.current = null;
  };

  if (!isOpen) return null;

  const altText = `Ritning ${propertyTitle} i ${propertyCity}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Header toolbar */}
      <div className="flex items-center justify-between p-3 md:p-4 bg-black/50">
        {/* Left: Document info */}
        <div className="flex items-center gap-3 text-white/80 text-sm min-w-0">
          <FileText className="h-5 w-5 shrink-0" />
          <span className="truncate">{fileName}</span>
          {documents.length > 1 && (
            <span className="text-white/60 shrink-0">
              ({currentIndex + 1}/{documents.length})
            </span>
          )}
          {isCurrentPdf && pdfTotalPages > 1 && (
            <span className="text-white/60 shrink-0">
              Sida {pdfPage}/{pdfTotalPages}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Zoom controls - desktop only */}
          <div className="hidden md:flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-white/10"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-white/80 text-sm w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="text-white hover:bg-white/10"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreen}
            className="text-white hover:bg-white/10"
            title="Fullskärm"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenNewTab}
            className="text-white hover:bg-white/10"
            title="Öppna i ny flik"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="text-white hover:bg-white/10"
            title="Ladda ner"
          >
            <Download className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        {isCurrentPdf ? (
          // PDF viewer - use native browser rendering
          <object
            data={currentDoc}
            type="application/pdf"
            className="w-full h-full max-w-[90vw] max-h-[80vh] bg-white rounded-lg"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            onLoad={() => setIsLoading(false)}
          >
            {/* Fallback for browsers that don't support inline PDF */}
            <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg p-8">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-foreground font-medium mb-2">PDF-förhandsgranskning inte tillgänglig</p>
              <p className="text-muted-foreground text-sm mb-4">Din webbläsare stödjer inte inbäddade PDF:er</p>
              <Button onClick={handleOpenNewTab} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Öppna PDF i ny flik
              </Button>
            </div>
          </object>
        ) : (
          // Image viewer
          <img
            src={currentDoc}
            alt={altText}
            className={cn(
              "max-h-[85vh] max-w-[90vw] object-contain select-none",
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            onLoad={() => setIsLoading(false)}
            draggable={false}
          />
        )}

        {/* Navigation arrows - desktop only */}
        {documents.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex === 0 ? documents.length - 1 : currentIndex - 1);
              }}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:block"
              aria-label="Föregående dokument"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex === documents.length - 1 ? 0 : currentIndex + 1);
              }}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:block"
              aria-label="Nästa dokument"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Mobile zoom controls */}
      <div className="md:hidden flex items-center justify-center gap-4 p-3 bg-black/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="text-white hover:bg-white/10"
        >
          <ZoomOut className="h-5 w-5 mr-1" />
          <span className="text-sm">−</span>
        </Button>
        <span className="text-white/80 text-sm w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          className="text-white hover:bg-white/10"
        >
          <ZoomIn className="h-5 w-5 mr-1" />
          <span className="text-sm">+</span>
        </Button>
      </div>

      {/* Thumbnail strip for multiple documents */}
      {documents.length > 1 && (
        <div className="flex gap-2 justify-center p-3 bg-black/50 overflow-x-auto max-w-full">
          {documents.map((doc, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(index);
              }}
              className={cn(
                "flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all flex items-center justify-center",
                index === currentIndex
                  ? "ring-2 ring-white opacity-100 bg-white/20"
                  : "opacity-50 hover:opacity-75 bg-white/10"
              )}
            >
              {isPdf(doc) ? (
                <FileText className="h-6 w-6 text-white" />
              ) : (
                <img
                  src={doc}
                  alt={`Dokument ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

