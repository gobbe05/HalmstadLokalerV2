import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo/SEOHead";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { LocalExpertCard } from "@/components/public/LocalExpertCard";
import { Button } from "@/components/ui/button";
import {
  fetchGuides,
  GUIDE_CATEGORIES,
  GUIDE_CATEGORY_LABELS,
  getGuideCategories,
  type GuideCategory,
} from "@/lib/localexpert";
import { useCityContext } from "@/contexts/CityContext";

export default function LocalExpertPage() {
  const { currentCity } = useCityContext();
  const cityId = currentCity?.id || "halmstad";
  const [activeCategory, setActiveCategory] = useState<GuideCategory | "all">("all");

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["localexpert", "list", cityId],
    queryFn: () => fetchGuides({ publishedOnly: true, city: cityId }),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    if (activeCategory === "all") return guides;
    return guides.filter((g) => getGuideCategories(g).includes(activeCategory));
  }, [guides, activeCategory]);

  const cityName = currentCity?.name || "Halmstad";

  return (
    <>
      <SEOHead
        title={`Lokalexperten i ${cityName} – Kontor, Lager & Etablering`}
        description={`Guider och lokal kunskap för företag som söker kontor, lager, butik, verkstad eller restauranglokal i ${cityName}.`}
        canonical="/lokalexperten"
      />

      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />

        <main className="flex-1">
          <section className="py-8 md:py-12 border-b border-border/60">
            <div className="container mx-auto px-4 max-w-4xl">
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground">
                Lokalexperten i {cityName}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mt-3 md:mt-4 max-w-2xl">
                Guider och lokal kunskap för företag som etablerar sig i {cityName}.
              </p>
            </div>
          </section>

          <section className="py-6 md:py-8">
            <div className="container mx-auto px-4">
              <div className="flex items-center flex-wrap gap-2 mb-6 md:mb-8">
                <Button
                  variant={activeCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory("all")}
                  className="rounded-full"
                >
                  Alla
                </Button>
                {GUIDE_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                    className="rounded-full"
                  >
                    {GUIDE_CATEGORY_LABELS[cat]}
                  </Button>
                ))}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-card/50 rounded-xl overflow-hidden animate-pulse shadow-card"
                    >
                      <div className="aspect-video bg-muted" />
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  Inga guider hittades.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filtered.map((guide) => (
                    <LocalExpertCard key={guide.id} guide={guide} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
