'use client'
import { useState, useCallback, useRef } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DocumentUploadProps {
  documents: string[];
  onChange: (documents: string[]) => void;
  listingId?: string;
}

const MAX_DOCUMENTS = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const VALID_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

export function DocumentUpload({ documents, onChange, listingId }: DocumentUploadProps) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileDropCounter = useRef(0);
  const documentsRef = useRef(documents);
  documentsRef.current = documents;

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `${listingId || 'draft'}_${timestamp}_${randomStr}.${ext}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('listing-documents')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to upload document:', error);
      return null;
    }
  };

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const remainingSlots = MAX_DOCUMENTS - documents.length - uploadingFiles.filter(f => f.status === 'uploading').length;
    if (remainingSlots <= 0) {
      toast.error(`Max ${MAX_DOCUMENTS} dokument tillåtna`);
      return;
    }

    const validFiles = files.slice(0, remainingSlots).filter((file) => {
      if (!VALID_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Ogiltigt format. Använd PDF, JPG eller PNG.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} är för stor (max 20MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (files.length > remainingSlots) {
      toast.info(`Endast ${remainingSlots} dokument kan läggas till`);
    }

    // Create upload entries
    const newUploads: UploadingFile[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    // Upload files
    const uploadedUrls: string[] = [];
    for (const upload of newUploads) {
      const url = await uploadFile(upload.file);
      
      if (url) {
        uploadedUrls.push(url);
        setUploadingFiles(prev => 
          prev.map(u => u.id === upload.id ? { ...u, status: 'complete' as const, progress: 100 } : u)
        );
      } else {
        setUploadingFiles(prev => 
          prev.map(u => u.id === upload.id ? { ...u, status: 'error' as const } : u)
        );
        toast.error(`Kunde inte ladda upp ${upload.file.name}`);
      }
    }

    // Update documents list
    if (uploadedUrls.length > 0) {
      onChange([...documentsRef.current, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} dokument uppladdade`);
    }

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(u => u.status === 'uploading'));
    }, 1000);
  }, [documents.length, uploadingFiles, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = "";
  };

  // File drop handlers
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

  const removeDocument = (indexToRemove: number) => {
    onChange(documents.filter((_, index) => index !== indexToRemove));
  };

  // Extract filename from URL
  const getFileName = (url: string): string => {
    const parts = url.split('/');
    const fullName = parts[parts.length - 1];
    // Remove timestamp and random string prefix if present
    const nameParts = fullName.split('_');
    if (nameParts.length >= 3) {
      return nameParts.slice(2).join('_');
    }
    return fullName;
  };

  const remainingSlots = MAX_DOCUMENTS - documents.length - uploadingFiles.filter(f => f.status === 'uploading').length;
  const isUploading = uploadingFiles.some(f => f.status === 'uploading');

  return (
    <div className="space-y-4">
      {/* Document list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((url, index) => (
            <div
              key={url}
              className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border group"
            >
              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">
                {getFileName(url)}
              </span>
              <button
                type="button"
                onClick={() => removeDocument(index)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Ta bort dokument"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Uploading files */}
      {uploadingFiles.filter(f => f.status === 'uploading').map((upload) => (
        <div
          key={upload.id}
          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
        >
          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          <span className="text-sm text-muted-foreground truncate flex-1">
            {upload.file.name}
          </span>
          <span className="text-xs text-muted-foreground">Laddar upp...</span>
        </div>
      ))}

      {/* Upload area */}
      {remainingSlots > 0 && (
        <label
          onDragEnter={handleFileDragEnter}
          onDragLeave={handleFileDragLeave}
          onDragOver={handleFileDragOver}
          onDrop={handleFileDrop}
          className={cn(
            "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            isDraggingFile 
              ? "border-primary bg-primary/10" 
              : "border-border hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <div className="flex flex-col items-center justify-center py-4">
            {isDraggingFile ? (
              <>
                <Upload className="w-7 h-7 text-primary mb-2" />
                <p className="text-sm text-primary font-medium">
                  Släpp dokumenten här
                </p>
              </>
            ) : (
              <>
                <Upload className="w-7 h-7 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Klicka eller dra ritningar eller dokument hit
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG eller PNG • Valfritt
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Exempel: planritning, sektionsritning, översiktsritning eller prospekt.
      </p>
    </div>
  );
}

