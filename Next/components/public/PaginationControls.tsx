'use client'
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 24,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  // Calculate visible page numbers with smart ellipsis
  const getVisiblePages = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsisThreshold = 7;

    if (totalPages <= showEllipsisThreshold) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Calculate range text
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems
    ? Math.min(currentPage * pageSize, totalItems)
    : currentPage * pageSize;

  return (
    <div className={cn("flex flex-col items-center gap-4 py-6", className)}>
      {/* Range indicator */}
      {totalItems && (
        <p className="text-sm text-muted-foreground">
          Visar {startItem}–{endItem} av {totalItems} lokaler
        </p>
      )}

      {/* Pagination controls */}
      <nav
        role="navigation"
        aria-label="Pagination"
        className="flex items-center gap-1"
      >
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Föregående</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {visiblePages.map((page, index) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={cn(
                  "min-w-[36px]",
                  currentPage === page && "pointer-events-none"
                )}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-1"
        >
          <span className="hidden sm:inline">Nästa</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}

