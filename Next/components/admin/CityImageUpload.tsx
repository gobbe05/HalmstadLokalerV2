'use client'
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, Loader2, X, CheckCircle2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CityImageUploadProps {
  cityId: string;
  imageType: "hero" | "og";
  currentUrl: string | null;
  blurPlaceholder?: string | null;
  onUploadComplete: (url: string, blurPlaceholder?: string) => void;
  className?: string;
}

const IMAGE_SPECS = {
  hero: {
    label: "Hero-bild",
    description: "Startsidans huvudbild (1920×1080, 16:9)",
    aspectRatio: "16/9",
    previewHeight: "h-32",
  },
  og: {
    label: "OG-bild",
    description: "Social delning (1200×630, ~1.9:1)",
    aspectRatio: "1200/630",
    previewHeight: "h-24",
  },
} as const;

export function CityImageUpload({
  cityId,
  imageType,
  currentUrl,
  blurPlaceholder,
  onUploadComplete,
  className,
}: CityImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const specs = IMAGE_SPECS[imageType];

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Endast bildfiler stöds");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Bilden får inte vara större än 10 MB");
        return;
      }

      // Show local preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setIsUploading(true);

      try {
        // First upload to temp storage to get a URL
        const tempPath = `temp/${cityId}-${imageType}-${Date.now()}.${file.name.split(".").pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("city-assets")
          .upload(tempPath, file, { upsert: true });

        if (uploadError) {
          throw new Error(`Uppladdningsfel: ${uploadError.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("city-assets")
          .getPublicUrl(tempPath);

        const tempUrl = publicUrlData.publicUrl;

        // Call edge function to process and store optimized images
        const { data, error } = await supabase.functions.invoke("upload-city-hero", {
          body: { imageUrl: tempUrl, cityId, imageType },
        });

        if (error) {
          throw new Error(`Bearbetningsfel: ${error.message}`);
        }

        if (!data?.success) {
          throw new Error(data?.error || "Okänt fel vid bildbearbetning");
        }

        // Clean up temp file
        await supabase.storage.from("city-assets").remove([tempPath]);

        // Notify parent with new URL
        const newUrl = imageType === "hero" ? data.heroImageBase : data.ogImageUrl;
        onUploadComplete(newUrl, data.blurPlaceholder);
        toast.success(`${specs.label} uppladdad`);
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(err instanceof Error ? err.message : "Kunde inte ladda upp bild");
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(localPreview);
      }
    },
    [cityId, imageType, onUploadComplete, specs.label]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displayUrl = previewUrl || (currentUrl ? (imageType === "hero" ? `${currentUrl}-md.jpg` : currentUrl) : null);
  const hasImage = !!currentUrl;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{specs.label}</Label>
          <p className="text-xs text-muted-foreground">{specs.description}</p>
        </div>
        {hasImage && !isUploading && (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors overflow-hidden",
          specs.previewHeight,
          isDragging && "border-primary bg-primary/5",
          !isDragging && !displayUrl && "border-muted-foreground/25 hover:border-muted-foreground/50",
          !isDragging && displayUrl && "border-transparent"
        )}
        style={{ aspectRatio: specs.aspectRatio }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt={specs.label}
              className="w-full h-full object-cover"
              style={{
                backgroundImage: blurPlaceholder ? `url(${blurPlaceholder})` : undefined,
                backgroundSize: "cover",
              }}
            />
            {/* Overlay with replace button */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Laddar upp...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    Byt bild
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">Laddar upp...</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs">Klicka eller dra hit</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

