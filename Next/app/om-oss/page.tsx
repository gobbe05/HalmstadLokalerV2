'use client'
import { SEOHead } from "@/components/seo/SEOHead";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ContactForm } from "@/components/public/ContactForm";
import { useCityContext } from "@/contexts/CityContext";
import halmstadHero from "@/assets/halmstad-city-hero.jpg";

export default function AboutPage() {
  const { currentCity } = useCityContext();
  const cityName = currentCity?.name || "Halmstad";
  const siteName = `${cityName}Lokaler`;

  const breadcrumbs = [
    { label: "Hem", href: "/" },
    { label: "Om oss" },
  ];

  return (
    <>
      <SEOHead
        title={`Om oss – ${siteName}`}
        description={`${siteName} är en lokal plattform för kommersiella lokaler i ${cityName}. Hitta lediga kontor, butikslokaler, lager- och industrilokaler – samlat på ett ställe med direktkontakt till fastighetsägare.`}
        canonical="/om-oss"
      />

      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />

        <main className="flex-1">
          {/* Hero image */}
          <div className="w-full h-48 sm:h-64 md:h-80 overflow-hidden relative">
            <img 
              src={halmstadHero.src} 
              alt={`Vy över ${cityName}`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
            <Breadcrumbs items={breadcrumbs} className="mb-4 sm:mb-6" />

            <div className="max-w-3xl mx-auto">
              {/* H1 - Page title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
                Om {siteName}
              </h1>

              {/* Intro section */}
              <section className="mb-6 sm:mb-8">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-2">
                  {siteName} är en samlad plats för kontor, butikslokaler, verkstad, lager och industrilokaler i {cityName}.
                </p>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Målet är att göra det lätt att hitta rätt lokal – inte bara en ledig lokal.
                </p>
              </section>

              {/* For property owners section */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-2 text-foreground">
                  För fastighetsägare
                </h2>
                
                <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Lika villkor för alla fastighetsägare. Alla fastighetsägare ges samma möjlighet att visa sina lokaler. Små som stora. Enstaka objekt eller hela bestånd – samma struktur, samma förutsättningar. Att annonsera på {siteName} handlar inte om att köpa sig mer synlighet. Det handlar om att synas på lika villkor – innehållet avgör, inte budgeten.
                  </p>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Du hanterar dina lokaler själv. När informationen ändras uppdateras den, och inkommande förfrågningar samlas på ett ställe.
                  </p>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    CRM för uthyrning av lokaler. Dialoger, intresse, visningar och uppföljning samlas i ett CRM anpassat för uthyrning av lokaler. En samlad vy för hela processen, i stället för parallella trådar och manuell uppföljning.
                  </p>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Publicering på egen hemsida. Lokalerna kan även publiceras på din egen hemsida. Du väljer själv vilka objekt som visas externt, med samma innehåll och uppdateringar.
                  </p>

                </div>
                
                <a
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Kom igång
                </a>
              </section>

              {/* Contact section */}
              <section>
                <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                  Kontakta oss
                </h2>
                <div className="bg-secondary rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                  <ContactForm />
                </div>
              </section>
            </div>
          </div>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
