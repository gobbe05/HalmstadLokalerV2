'use client'
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Guide } from "@/lib/localexpert";
import { LocalExpertCard } from "./LocalExpertCard";

interface LocalExpertSectionProps {
  guides: Guide[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
}

export function LocalExpertSection({
  guides,
  loading,
  title,
  subtitle,
  showViewAll,
  viewAllHref = "/lokalexperten",
}: LocalExpertSectionProps) {
  if (!loading && guides.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {(title || subtitle) && (
          <div className="mb-6 md:mb-8 max-w-3xl">
            {title && (
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-card/50 rounded-xl overflow-hidden animate-pulse shadow-card"
              >
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {guides.map((guide) => (
              <LocalExpertCard key={guide.id} guide={guide} />
            ))}
          </div>
        )}

        {showViewAll && (
          <div className="mt-6 md:mt-8 text-center">
            <Link
              to={viewAllHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-colors"
            >
              Se alla guider
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

