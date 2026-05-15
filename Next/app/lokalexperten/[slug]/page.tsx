'use client'
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleSchema } from "@/components/seo/ArticleSchema";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { BlurImage } from "@/components/ui/blur-image";
import { PropertyGrid } from "@/components/public/PropertyGrid";
import { LocalExpertCard } from "@/components/public/LocalExpertCard";
import { GuideImageFallback } from "@/components/public/GuideImageFallback";
import { Button } from "@/components/ui/button";
import {
  fetchGuideBySlug,
  fetchGuides,
  CATEGORY_TO_TYPES,
  GUIDE_CATEGORY_LABELS,
  getGuideCategories,
  type GuideCategory,
} from "@/lib/localexpert";
import { fetchProperties } from "@/lib/properties";
import { useCityContext } from "@/contexts/CityContext";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LocalExpertDetailPage() {
  const {slug} = useParams();
  
  const { currentCity } = useCityContext();
  const cityId = currentCity?.id || "halmstad";

  const { data: guide, isLoading } = useQuery({
    queryKey: ["localexpert", "detail", slug],
    queryFn: () => (slug ? fetchGuideBySlug(slug) : Promise.resolve(null)),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  const guideCategories = guide ? getGuideCategories(guide) : [];
  const propertyTypes = (() => {
    const set = new Set<string>();
    for (const c of guideCategories) {
      const types = CATEGORY_TO_TYPES[c as GuideCategory];
      if (types) types.forEach((t) => set.add(t));
    }
    return set.size > 0 ? (Array.from(set) as any) : undefined;
  })();

  const { data: relatedProperties = [] } = useQuery({
    queryKey: ["localexpert", "related-properties", guide?.id, cityId],
    queryFn: () =>
      fetchProperties({
        cityId,
        types: propertyTypes,
      }),
    enabled: !!guide && !!propertyTypes,
    staleTime: 1000 * 60 * 5,
  });

  const { data: relatedGuides = [] } = useQuery({
    queryKey: ["localexpert", "related-guides", guide?.id],
    queryFn: async () => {
      if (!guide) return [];
      const seen = new Set<string>();
      const results = [];
      // by area first
      if (guide.area) {
        const byArea = await fetchGuides({
          publishedOnly: true,
          city: guide.city,
          area: guide.area,
          excludeSlug: guide.slug,
          limit: 3,
        });
        for (const g of byArea) {
          if (!seen.has(g.id)) {
            seen.add(g.id);
            results.push(g);
          }
        }
      }
      if (results.length < 3 && guideCategories.length > 0) {
        const byCat = await fetchGuides({
          publishedOnly: true,
          city: guide.city,
          category: guideCategories[0],
          excludeSlug: guide.slug,
          limit: 6,
        });
        for (const g of byCat) {
          if (results.length >= 3) break;
          if (!seen.has(g.id)) {
            seen.add(g.id);
            results.push(g);
          }
        }
      }
      return results.slice(0, 3);
    },
    enabled: !!guide,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4 max-w-3xl">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded w-3/4" />
            <div className="aspect-[16/9] bg-muted rounded-xl" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading text-3xl font-bold mb-3">
            Guiden hittades inte
          </h1>
          <p className="text-muted-foreground mb-6">
            Den guide du letar efter finns inte längre.
          </p>
          <Link href="/lokalexperten">
            <Button>Tillbaka till Lokalexperten</Button>
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const categoryLabels = guideCategories.map(
    (c) => (GUIDE_CATEGORY_LABELS as Record<string, string>)[c] || c
  );
  const primaryCategoryLabel = categoryLabels[0];

  const limitedRelatedProperties = relatedProperties.slice(0, 6);

  return (
    <>
      <SEOHead
        title={guide.seo_title || `${guide.title} | Lokalexperten`}
        description={guide.seo_description || guide.excerpt || undefined}
        canonical={`/lokalexperten/${guide.slug}`}
        type="article"
        image={guide.image || undefined}
      />
      <ArticleSchema
        headline={guide.title}
        description={guide.seo_description || guide.excerpt || guide.title}
        datePublished={guide.created_at}
        dateModified={guide.updated_at}
        image={guide.image || undefined}
        url={`/lokalexperten/${guide.slug}`}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />

        <main className="flex-1">
          <article className="py-6 md:py-10">
            <div className="container mx-auto px-4 max-w-3xl">
              <Breadcrumbs
                items={[
                  { label: "Lokalexperten", href: "/lokalexperten" },
                  { label: guide.title },
                ]}
                className="mb-6"
              />

              <div className="flex items-center flex-wrap gap-2 mb-4">
                {guide.area && <Badge variant="outline">{guide.area}</Badge>}
                {categoryLabels.map((label) => (
                  <Badge key={label} variant="secondary">{label}</Badge>
                ))}
                {guide.reading_time && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {guide.reading_time} min läsning
                  </span>
                )}
              </div>

              <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground leading-tight">
                {guide.title}
              </h1>

              {guide.excerpt && (
                <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
                  {guide.excerpt}
                </p>
              )}

              <div className="mt-8 aspect-[16/9] rounded-xl overflow-hidden bg-muted">
                {guide.image ? (
                  <BlurImage src={guide.image} alt={guide.title} loading="eager" />
                ) : (
                  <GuideImageFallback
                    area={guide.area}
                    categoryLabel={primaryCategoryLabel}
                    title={guide.title}
                    subline="Lokalexperten"
                    textSize="hero"
                  />
                )}
              </div>

              {guide.content && (
                <div className="markdown-body mt-8 text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {guide.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </article>

          {limitedRelatedProperties.length > 0 && (
            <section className="py-10 md:py-14 bg-muted/30 border-t border-border/60">
              <div className="container mx-auto px-4">
                <div className="mb-6 md:mb-8 max-w-3xl">
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                    Lediga lokaler{primaryCategoryLabel ? ` – ${primaryCategoryLabel}` : ""}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">
                    Aktuella lokaler som matchar denna guide.
                  </p>
                </div>
                <PropertyGrid properties={limitedRelatedProperties} />
              </div>
            </section>
          )}

          {relatedGuides.length > 0 && (
            <section className="py-10 md:py-14">
              <div className="container mx-auto px-4">
                <div className="mb-6 md:mb-8 max-w-3xl">
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                    Fler guider
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {relatedGuides.map((g) => (
                    <LocalExpertCard key={g.id} guide={g} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
