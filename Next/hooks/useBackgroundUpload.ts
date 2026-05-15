import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Target dimensions for 16:9 aspect ratio - optimized for PageSpeed (reduced sizes)
const SIZES = {
  large: { width: 1600, height: 900, maxKB: 250 },
  medium: { width: 1200, height: 675, maxKB: 150 },
  small: { width: 800, height: 450, maxKB: 80 },
};

export interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'uploading' | 'complete' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface UseBackgroundUploadOptions {
  listingId?: string;
  onComplete?: (urls: string[]) => void;
  onError?: (error: string) => void;
}

// Process and resize image in browser with 16:9 center crop
async function processImage(
  file: File, 
  targetWidth: number, 
  targetHeight: number, 
  maxBytes: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width: srcWidth, height: srcHeight } = img;

      // Calculate crop dimensions for 16:9 center crop
      const targetRatio = 16 / 9;
      const srcRatio = srcWidth / srcHeight;

      let cropX = 0;
      let cropY = 0;
      let cropWidth = srcWidth;
      let cropHeight = srcHeight;

      if (srcRatio > targetRatio) {
        cropWidth = srcHeight * targetRatio;
        cropX = (srcWidth - cropWidth) / 2;
      } else {
        cropHeight = srcWidth / targetRatio;
        cropY = (srcHeight - cropHeight) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, targetWidth, targetHeight
      );

      const tryCompress = (quality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }
            
            if (blob.size > maxBytes && quality > 0.5) {
              tryCompress(quality - 0.05);
            } else {
              resolve(blob);
            }
          },
          "image/webp",
          quality
        );
      };

      // Start with lower quality for better compression (PageSpeed optimization)
      tryCompress(0.75);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function useBackgroundUpload({ listingId, onComplete, onError }: UseBackgroundUploadOptions = {}) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const processingRef = useRef(false);
  const queueRef = useRef<UploadItem[]>([]);
  const completedUrlsRef = useRef<string[]>([]);

  const updateUpload = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploads(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsUploading(true);

    while (queueRef.current.length > 0) {
      const item = queueRef.current[0];
      
      try {
        updateUpload(item.id, { status: 'processing', progress: 10 });

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const baseName = `${listingId || "temp"}_${timestamp}_${randomStr}`;

        // Process all three sizes
        const sizeEntries = Object.entries(SIZES);
        let completedSizes = 0;

        for (const [sizeName, sizeConfig] of sizeEntries) {
          updateUpload(item.id, { 
            status: 'processing', 
            progress: 10 + (completedSizes / sizeEntries.length) * 40 
          });

          const processedBlob = await processImage(
            item.file,
            sizeConfig.width,
            sizeConfig.height,
            sizeConfig.maxKB * 1024
          );

          updateUpload(item.id, { 
            status: 'uploading', 
            progress: 50 + (completedSizes / sizeEntries.length) * 40 
          });

          const fileName = `${baseName}_${sizeName}.webp`;

          const { error: uploadError } = await supabase.storage
            .from("listing-images")
            .upload(fileName, processedBlob, {
              contentType: "image/webp",
            });

          if (uploadError) {
            throw uploadError;
          }

          completedSizes++;
        }

        // Get the large URL as the main reference
        const { data: { publicUrl } } = supabase.storage
          .from("listing-images")
          .getPublicUrl(`${baseName}_large.webp`);

        updateUpload(item.id, { status: 'complete', progress: 100, url: publicUrl });
        completedUrlsRef.current.push(publicUrl);

      } catch (error) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        updateUpload(item.id, { status: 'error', error: errorMessage });
        onError?.(errorMessage);
      }

      queueRef.current.shift();
    }

    processingRef.current = false;
    setIsUploading(false);

    // Call onComplete with all completed URLs
    if (completedUrlsRef.current.length > 0) {
      onComplete?.(completedUrlsRef.current);
      completedUrlsRef.current = [];
    }
  }, [listingId, onComplete, onError, updateUpload]);

  const addFiles = useCallback((files: File[]) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    
    const newItems: UploadItem[] = files
      .filter(file => {
        if (!validTypes.includes(file.type)) {
          console.warn(`Invalid file type: ${file.type}`);
          return false;
        }
        if (file.size > 20 * 1024 * 1024) {
          console.warn(`File too large: ${file.size}`);
          return false;
        }
        return true;
      })
      .map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        status: 'pending' as const,
        progress: 0,
      }));

    if (newItems.length === 0) return;

    setUploads(prev => [...prev, ...newItems]);
    queueRef.current.push(...newItems);
    
    // Start processing if not already
    processQueue();
  }, [processQueue]);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(item => item.status !== 'complete' && item.status !== 'error'));
  }, []);

  const cancelAll = useCallback(() => {
    queueRef.current = [];
    setUploads([]);
    processingRef.current = false;
    setIsUploading(false);
  }, []);

  // Calculate overall progress
  const overallProgress = uploads.length > 0
    ? Math.round(uploads.reduce((sum, item) => sum + item.progress, 0) / uploads.length)
    : 0;

  const pendingCount = uploads.filter(u => u.status === 'pending' || u.status === 'processing' || u.status === 'uploading').length;
  const completedCount = uploads.filter(u => u.status === 'complete').length;
  const errorCount = uploads.filter(u => u.status === 'error').length;

  return {
    uploads,
    isUploading,
    addFiles,
    clearCompleted,
    cancelAll,
    overallProgress,
    pendingCount,
    completedCount,
    errorCount,
  };
}
