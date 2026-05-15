'use client'
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCityContext } from "@/contexts/CityContext";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const { currentCity } = useCityContext();
  const siteUrl = currentCity?.domain 
    ? `https://${currentCity.domain}` 
    : "https://halmstadlokaler.se";

  // Generate BreadcrumbList JSON-LD schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Start",
        item: siteUrl,
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <nav
        aria-label="Brödsmulor"
        className={cn("flex items-center gap-1.5 text-sm", className)}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Start</span>
        </Link>

        {items.map((item, index) => (
          <span key={index} className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}

