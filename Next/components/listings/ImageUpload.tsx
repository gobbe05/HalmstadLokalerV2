'use client'
import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Loader2, GripVertical, Sparkles, Clipboard, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBackgroundUpload } from "@/hooks/useBackgroundUpload";
import { UploadProgress } from "./UploadProgress";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  listingId?: string;
}

const MAX_IMAGES = 9;

export function ImageUpload({ images, onChange, listingId }: ImageUploadProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPasteFocused, setIsPasteFocused] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);
  const fileDropCounter = useRef(0);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const {
    uploads,
    isUploading,
    addFiles,
    clearCompleted,
    cancelAll,
    overallProgress,
    pendingCount,
    completedCount,
    errorCount,
  } = useBackgroundUpload({
    listingId,
    onComplete: (urls) => {
      // Add completed URLs to images
      onChange([...imagesRef.current, ...urls]);
      if (urls.length > 0) {
        toast.success(`${urls.length} bild(er) uppladdade`, { duration: 2000 });
        // Clear the upload panel immediately since we show a toast
        setTimeout(() => clearCompleted(), 100);
      }
    },
    onError: (error) => {
      toast.error(`Uppladdningsfel: ${error}`, { duration: 3000 });
    },
  });

  const processFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length - pendingCount;
    if (remainingSlots <= 0) {
      toast.error(`Max ${MAX_IMAGES} bilder tillåtna`);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    
    const validFiles = files.slice(0, remainingSlots).filter((file) => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Ogiltigt format. Använd JPG, PNG eller WEBP.`);
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} är för stor (max 20MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (files.length > remainingSlots) {
      toast.info(`Endast ${remainingSlots} bild(er) kan läggas till`);
    }

    // Add to background upload queue
    addFiles(validFiles);
  }, [images.length, pendingCount, addFiles]);

  // Handle paste from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Create a new file with a proper name
          const extension = item.type.split('/')[1] || 'png';
          const newFile = new File([file], `inklistrad-bild-${Date.now()}.${extension}`, {
            type: item.type
          });
          imageFiles.push(newFile);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      processFiles(imageFiles);
      toast.info(`${imageFiles.length} bild(er) inklistrade`);
    }
  }, [processFiles]);

  // Add global paste listener when component is focused
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Only handle paste if focus is within the upload area
      if (isPasteFocused || pasteAreaRef.current?.contains(document.activeElement)) {
        handlePaste(e);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [handlePaste, isPasteFocused]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = "";
  };

  // File drop handlers for upload area
  const handleFileDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileDropCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingFile(true);
    }
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileDropCounter.current--;
    if (fileDropCounter.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    fileDropCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeImage = (indexToRemove: number) => {
    onChange(images.filter((_, index) => index !== indexToRemove));
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const remainingSlots = MAX_IMAGES - images.length - pendingCount;

  // Move image up/down helpers
  const moveImageUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onChange(newImages);
  };

  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onChange(newImages);
  };

  // Helper to get small version URL from large URL
  const getSmallUrl = (url: string): string => {
    if (url.includes('_large.webp')) {
      return url.replace('_large.webp', '_small.webp');
    }
    return url;
  };

  return (
    <>
      <div 
        ref={pasteAreaRef}
        className="space-y-4"
        tabIndex={0}
        onFocus={() => setIsPasteFocused(true)}
        onBlur={() => setIsPasteFocused(false)}
      >
        {/* Info text */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          <div className="flex flex-col gap-1">
            <span>
              Ladda upp upp till {MAX_IMAGES} bilder. Vi optimerar dem automatiskt för bästa kvalitet och snabb laddning.
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Clipboard className="w-3 h-3" />
              Tips: Klicka här och tryck Ctrl+V för att klistra in bilder
            </span>
          </div>
        </div>

        {/* Image count indicator */}
        <div className="text-sm text-muted-foreground">
          {images.length} av {MAX_IMAGES} bilder
          {pendingCount > 0 && ` (${pendingCount} laddas upp...)`}
          {images.length > 0 && !isUploading && " • Använd pilarna eller dra för att ändra ordning"}
        </div>

        {/* Image grid */}
        {(images.length > 0 || pendingCount > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Uploaded images */}
            {images.map((url, index) => (
              <div
                key={url}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  "relative group aspect-video cursor-grab active:cursor-grabbing transition-all",
                  draggedIndex === index && "opacity-50 scale-95",
                  dragOverIndex === index && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <img
                  src={getSmallUrl(url)}
                  alt={`Bild ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-border"
                  draggable={false}
                  loading="lazy"
                />
                
                {/* Reorder buttons */}
                <div className="absolute top-2 left-2 flex gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveImageUp(index); }}
                    disabled={index === 0}
                    className="p-1 bg-background/80 rounded disabled:opacity-30 hover:bg-background transition-colors"
                    title="Flytta upp"
                  >
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveImageDown(index); }}
                    disabled={index === images.length - 1}
                    className="p-1 bg-background/80 rounded disabled:opacity-30 hover:bg-background transition-colors"
                    title="Flytta ner"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div className="p-1 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Main image badge */}
                {index === 0 && (
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                    Huvudbild
                  </span>
                )}
              </div>
            ))}

            {/* Pending upload placeholders */}
            {uploads.filter(u => u.status !== 'complete' && u.status !== 'error').map((upload) => (
              <div
                key={upload.id}
                className="relative aspect-video rounded-lg border border-dashed border-border bg-muted/50 flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(upload.file)}
                    alt=""
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
                    <span className="text-xs text-muted-foreground">{upload.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        {remainingSlots > 0 && (
          <label
            onDragEnter={handleFileDragEnter}
            onDragLeave={handleFileDragLeave}
            onDragOver={handleFileDragOver}
            onDrop={handleFileDrop}
            className={cn(
              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              isDraggingFile 
                ? "border-primary bg-primary/10" 
                : "border-border hover:bg-muted/50"
            )}
          >
            <div className="flex flex-col items-center justify-center py-4">
              {isDraggingFile ? (
                <>
                  <Upload className="w-8 h-8 text-primary mb-2" />
                  <p className="text-sm text-primary font-medium">
                    Släpp bilderna här
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Klicka eller dra bilder hit
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG eller WEBP • Max {remainingSlots} till
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Floating upload progress */}
      <UploadProgress
        uploads={uploads}
        isUploading={isUploading}
        overallProgress={overallProgress}
        pendingCount={pendingCount}
        completedCount={completedCount}
        errorCount={errorCount}
        onClearCompleted={clearCompleted}
        onCancelAll={cancelAll}
      />
    </>
  );
}

