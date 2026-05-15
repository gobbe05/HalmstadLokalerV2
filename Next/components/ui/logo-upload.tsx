'use client'
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  className?: string;
}

export function LogoUpload({
  value,
  onChange,
  onUpload,
  isUploading = false,
  className,
}: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("flex items-start gap-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        // State: Logo uploaded
        <div className="flex items-start gap-4">
          <div className="relative group">
            <img
              src={value}
              alt="Företagslogotyp"
              className="h-20 w-20 object-contain rounded-lg border bg-white cursor-pointer transition-opacity group-hover:opacity-80"
              onClick={triggerFileInput}
              title="Byt logotyp"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={triggerFileInput}
              title="Byt logotyp"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
              title="Ta bort logotyp"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Företagslogotyp</p>
            <button
              type="button"
              onClick={triggerFileInput}
              className="text-primary hover:underline text-sm mt-0.5"
            >
              Byt logotyp
            </button>
          </div>
        </div>
      ) : (
        // State: No logo
        <div className="flex items-start gap-4">
          <div
            onClick={triggerFileInput}
            className={cn(
              "h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25",
              "flex flex-col items-center justify-center cursor-pointer",
              "hover:border-primary/50 hover:bg-muted/50 transition-colors",
              isUploading && "pointer-events-none"
            )}
          >
            {isUploading ? (
              <div className="animate-pulse text-xs text-muted-foreground">
                Laddar...
              </div>
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">
                  Ladda upp
                </span>
              </>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Ladda upp företagslogotyp</p>
            <p className="text-xs mt-0.5">Visas tillsammans med dina annonser. PNG, JPG eller SVG. Max 2 MB.</p>
            <p className="text-xs text-muted-foreground/70">Rekommenderad storlek: 400×120 px. Optimeras automatiskt.</p>
          </div>
        </div>
      )}
    </div>
  );
}

