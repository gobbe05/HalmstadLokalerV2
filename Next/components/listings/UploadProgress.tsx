'use client'
import { AlertCircle, Loader2, Image, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { UploadItem } from "@/hooks/useBackgroundUpload";

interface UploadProgressProps {
  uploads: UploadItem[];
  isUploading: boolean;
  overallProgress: number;
  pendingCount: number;
  completedCount: number;
  errorCount: number;
  onClearCompleted: () => void;
  onCancelAll: () => void;
}

export function UploadProgress({
  uploads,
  isUploading,
  overallProgress,
  pendingCount,
  errorCount,
  onCancelAll,
}: UploadProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Only show panel while uploading is in progress
  if (uploads.length === 0 || !isUploading) return null;

  const totalCount = uploads.length;
  const hasErrors = errorCount > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div 
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer transition-colors",
          hasErrors ? "bg-destructive/10" : "bg-muted/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : hasErrors ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          <span className="text-sm font-medium">
            Laddar upp {pendingCount} av {totalCount}...
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Progress bar (always visible) */}
      <Progress value={overallProgress} className="h-1 rounded-none" />

      {/* Expanded content */}
      {isExpanded && (
        <div className="max-h-48 overflow-y-auto">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className={cn(
                "flex items-center gap-3 p-2 border-t border-border/50",
                upload.status === 'error' && "bg-destructive/5"
              )}
            >
              {/* Preview or icon */}
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {upload.file ? (
                  <img
                    src={URL.createObjectURL(upload.file)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{upload.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {upload.status === 'pending' && (
                    <span className="text-xs text-muted-foreground">Väntar...</span>
                  )}
                  {upload.status === 'processing' && (
                    <span className="text-xs text-primary">Optimerar...</span>
                  )}
                  {upload.status === 'uploading' && (
                    <span className="text-xs text-primary">Laddar upp...</span>
                  )}
                  {upload.status === 'error' && (
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Fel
                    </span>
                  )}
                </div>
              </div>

              {/* Progress */}
              {(upload.status === 'processing' || upload.status === 'uploading') && (
                <div className="w-12 text-right">
                  <span className="text-xs text-muted-foreground">{upload.progress}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {isExpanded && (
        <div className="p-2 border-t border-border/50 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7"
            onClick={onCancelAll}
          >
            Avbryt alla
          </Button>
        </div>
      )}
    </div>
  );
}

