import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Constraints for logo optimization (2x display size for Retina)
const LOGO_CONSTRAINTS = {
  maxWidth: 400,
  maxHeight: 160,
  maxBytes: 100 * 1024, // 100KB
  quality: 0.85,
};

/**
 * Process and optimize a logo image while preserving aspect ratio.
 * SVG files are passed through unchanged.
 */
async function processLogo(file: File): Promise<Blob> {
  // SVG files don't need processing - return as-is
  if (file.type === "image/svg+xml") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const { width: srcWidth, height: srcHeight } = img;

      // Calculate new dimensions preserving aspect ratio
      let targetWidth = srcWidth;
      let targetHeight = srcHeight;

      // Scale down if exceeding max dimensions
      if (srcWidth > LOGO_CONSTRAINTS.maxWidth) {
        targetWidth = LOGO_CONSTRAINTS.maxWidth;
        targetHeight = (srcHeight / srcWidth) * targetWidth;
      }

      if (targetHeight > LOGO_CONSTRAINTS.maxHeight) {
        targetHeight = LOGO_CONSTRAINTS.maxHeight;
        targetWidth = (srcWidth / srcHeight) * targetHeight;
      }

      // Round to integers
      targetWidth = Math.round(targetWidth);
      targetHeight = Math.round(targetHeight);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw the resized image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Compress with iterative quality reduction if needed
      const tryCompress = (quality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            // If still too large and quality can be reduced, try again
            if (blob.size > LOGO_CONSTRAINTS.maxBytes && quality > 0.5) {
              tryCompress(quality - 0.05);
            } else {
              resolve(blob);
            }
          },
          "image/webp",
          quality
        );
      };

      tryCompress(LOGO_CONSTRAINTS.quality);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

interface UseLogoUploadOptions {
  profileId?: string;
  onComplete?: (url: string) => void;
  onError?: (error: string) => void;
}

export function useLogoUpload({ profileId, onComplete, onError }: UseLogoUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadLogo = useCallback(async (file: File) => {
    if (!profileId) {
      const msg = "Profil-ID saknas";
      setError(msg);
      onError?.(msg);
      return;
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      const msg = "Endast PNG, JPG, WebP eller SVG är tillåtna";
      setError(msg);
      toast.error(msg);
      onError?.(msg);
      return;
    }

    // Validate file size (max 2MB before processing)
    if (file.size > 2 * 1024 * 1024) {
      const msg = "Filen får max vara 2MB";
      setError(msg);
      toast.error(msg);
      onError?.(msg);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Process and optimize the image
      const processedBlob = await processLogo(file);

      // Determine file extension based on output type
      const isSvg = file.type === "image/svg+xml";
      const fileExt = isSvg ? "svg" : "webp";
      const contentType = isSvg ? "image/svg+xml" : "image/webp";
      
      const timestamp = Date.now();
      const fileName = `${profileId}-logo-${timestamp}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, processedBlob, { 
          contentType,
          upsert: false // Use unique filename instead
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl;
      
      toast.success("Logotyp uppladdad och optimerad");
      onComplete?.(logoUrl);
    } catch (err) {
      console.error("Error uploading logo:", err);
      const msg = "Kunde inte ladda upp logotypen";
      setError(msg);
      toast.error(msg);
      onError?.(msg);
    } finally {
      setIsUploading(false);
    }
  }, [profileId, onComplete, onError]);

  return {
    uploadLogo,
    isUploading,
    error,
  };
}
