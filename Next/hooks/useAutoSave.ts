import { useRef, useCallback, useEffect, useState } from "react";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({ 
  data, 
  onSave, 
  debounceMs = 1500,
  enabled = true 
}: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialDataRef = useRef<T>(data);
  const isInitializedRef = useRef(false);

  // Track if data has actually changed from initial load
  const hasRealChanges = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(initialDataRef.current);
  }, [data]);

  const save = useCallback(async () => {
    if (!enabled || !hasRealChanges()) return;
    
    setIsSaving(true);
    try {
      await onSave(data);
      setLastSaved(new Date());
      // Update initial data ref after successful save
      initialDataRef.current = data;
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, enabled, hasRealChanges]);

  useEffect(() => {
    // Skip the initial render
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      initialDataRef.current = data;
      return;
    }

    // Don't auto-save if no real changes
    if (!hasRealChanges() || !enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, save, hasRealChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Force save immediately (for manual save button)
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  return {
    isSaving,
    lastSaved,
    saveNow,
  };
}
