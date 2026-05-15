'use client'
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlurImage } from "@/components/ui/blur-image";
import type { Guide } from "@/lib/localexpert";
import { GUIDE_CATEGORY_LABELS, getGuideCategories } from "@/lib/localexpert";
import { GuideImageFallback } from "@/components/public/GuideImageFallback";

interface LocalExpertCardProps {
  guide: Guide;
}

export function LocalExpertCard({ guide }: LocalExpertCardProps) {
  const categoryLabels = getGuideCategories(guide).map((c) =>
    (GUIDE_CATEGORY_LABELS as Record<string, string>)[c] || c
  );

  return (
    <Link
      href={`/lokalexperten/${guide.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card className="overflow-hidden border-0 bg-card transition-all duration-300 shadow-card sm:border sm:border-border/50 sm:hover:border-accent/30 hover-lift h-full flex flex-col">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {guide.image ? (
            <BlurImage src={guide.image} alt={guide.title} />
          ) : (
            <GuideImageFallback
              area={guide.area}
              categoryLabel={categoryLabels[0]}
              title={guide.title}
            />
          )}
        </div>

        <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
          {(guide.area || categoryLabels.length > 0) && (
            <div className="flex items-center flex-wrap gap-2 mb-3">
              {guide.area && (
                <Badge variant="outline" className="text-xs">
                  {guide.area}
                </Badge>
              )}
              {categoryLabels.map((label) => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}

          <h3 className="font-heading font-bold text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {guide.title}
          </h3>

          {guide.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {guide.excerpt}
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
            {guide.reading_time ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {guide.reading_time} min läsning
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 font-medium text-foreground group-hover:text-accent transition-colors">
              Läs mer
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

