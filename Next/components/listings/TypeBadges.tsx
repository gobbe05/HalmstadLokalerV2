'use client'
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TypeBadgesProps {
  types: string;
  maxVisible?: number;
}

export function TypeBadges({ types, maxVisible = 1 }: TypeBadgesProps) {
  const [open, setOpen] = useState(false);
  
  // Support both "|" and ", " as separators
  const separator = types.includes("|") ? "|" : ", ";
  const typeList = types
    .split(separator)
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  if (typeList.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const visibleTypes = typeList.slice(0, maxVisible);
  const hiddenTypes = typeList.slice(maxVisible);
  const hasMore = hiddenTypes.length > 0;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibleTypes.map((typ) => (
        <span
          key={typ}
          className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full whitespace-nowrap"
        >
          {typ}
        </span>
      ))}
      
      {hasMore && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
            >
              +{hiddenTypes.length} mer
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-3 z-50" 
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Alla typer ({typeList.length})
            </p>
            <div className="flex flex-wrap gap-1.5 max-w-[250px]">
              {typeList.map((typ) => (
                <span
                  key={typ}
                  className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full"
                >
                  {typ}
                </span>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

