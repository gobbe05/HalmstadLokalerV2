'use client'
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PropertyOwnerCardHorizontal } from "@/components/public/PropertyOwnerCardHorizontal";
import { usePropertyOwners } from "@/hooks/usePropertyOwners";
import { useCityContext } from "@/contexts/CityContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyOwnersPage() {
  const { currentCity } = useCityContext();
  const { data: owners, isLoading } = usePropertyOwners();
  const cityName = currentCity?.name || "Halmstad";

  const pageTitle = `Fastighetsägare i ${cityName} – Lokala aktörer med kommersiella lokaler`;
  const pageDescription = `Upptäck lokala fastighetsägare och aktörer med kommersiella lokaler i ${cityName}. Hitta rätt samarbetspartner för ditt lokalbehov.`;

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />

        <main className="flex-1">
          {/* Hero section */}
          <section className="py-sp-3 md:py-sp-4 border-b border-border/50">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Fastighetsägare i {cityName}
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Lokala fastighetsägare och aktörer med kommersiella lokaler i {cityName}.
              </p>
            </div>
          </section>

          {/* Owners grid */}
          <section className="py-sp-4 md:py-sp-5">
            <div className="container mx-auto px-4">
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[180px] sm:h-[160px] rounded-lg" />
                  ))}
                </div>
              ) : owners && owners.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {owners.map((owner) => (
                    <PropertyOwnerCardHorizontal key={owner.id} owner={owner} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">
                    Inga fastighetsägare hittades.
                  </p>
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
