'use client'
import { useCityContext } from "@/contexts/CityContext";
import DOMPurify from "dompurify";
import Link from "next/link";

const FOOTER_CATEGORIES = [
  { slug: "kontor", labelTemplate: (city: string) => `Kontor i ${city}` },
  { slug: "lager", labelTemplate: (city: string) => `Lager i ${city}` },
  { slug: "butik", labelTemplate: (city: string) => `Butiker i ${city}` },
  { slug: "industri", labelTemplate: (city: string) => `Industrilokaler i ${city}` },
  { slug: "restaurang", labelTemplate: (city: string) => `Restauranglokaler i ${city}` },
  { slug: "coworking", labelTemplate: (city: string) => `Coworking i ${city}` },
];

export function PublicFooter() {
  const { currentCity } = useCityContext();

  const siteName = currentCity ? `${currentCity.name}Lokaler` : "Lokaler";
  const introText = currentCity?.intro_text || null;

  return (
    <footer className="bg-teal-100 text-foreground mt-auto border-t border-teal-200">
      <div className="container mx-auto px-4 py-16 md:py-20">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-1.5 font-heading text-xl font-bold tracking-tight">
              <span className="text-foreground">{currentCity?.name || "Halmstad"}</span>
              <span className="text-accent">Lokaler</span>
            </Link>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Här hittar du ett brett utbud av kontorslokaler, butiker, lager och industrilokaler i {currentCity?.name || "Halmstad"} kommun med omnejd.
            </p>
          </div>

          {/* Categories */}
          <div className="md:col-span-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-teal-800 mb-5">
            Lokaltyper
          </h3>
          <ul className="space-y-3">
              {FOOTER_CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/${category.slug}/`}
                    className="text-sm text-teal-900 hover:text-teal-600 hover:underline transition-colors duration-200"
                  >
                    {category.labelTemplate(currentCity?.name || "Halmstad")}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/lokaler"
                  className="text-sm text-teal-900 hover:text-teal-600 hover:underline transition-colors duration-200"
                >
                  Alla lokaler
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div className="md:col-span-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-teal-800 mb-5">
            Snabblänkar
          </h3>
          <ul className="space-y-3">
            <li>
              <Link
                href="/fastighetsagare"
                className="text-sm text-teal-900 hover:text-teal-600 hover:underline transition-colors duration-200"
              >
                Fastighetsägare i {currentCity?.name || "Halmstad"}
              </Link>
            </li>
            <li>
              <Link
                href="/om-oss"
                className="text-sm text-teal-900 hover:text-teal-600 hover:underline transition-colors duration-200"
              >
                Om oss
              </Link>
            </li>
            <li>
              <Link
                href="/auth"
                className="text-sm text-teal-900 hover:text-teal-600 hover:underline transition-colors duration-200"
              >
                Logga in
              </Link>
            </li>
            <li>
              <Link
                href="/lokalexperten"
                className="text-sm text-teal-900 hover:text-teal-600 hover:underline transition-colors duration-200"
              >
                Lokalexperten
              </Link>
            </li>
            <li>
              <Link
                href="/lagg-in-annons"
                className="text-sm text-teal-900 hover:text-teal-600 hover:underline transition-colors duration-200"
              >
                Annonsera lokaler
              </Link>
            </li>
          </ul>
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-16 pt-8 border-t border-teal-200">
          <p className="text-xs text-teal-700">
            Lediga lokaler i {currentCity?.name || "Sverige"}
          </p>
        </div>
      </div>
    </footer>
  );
}

