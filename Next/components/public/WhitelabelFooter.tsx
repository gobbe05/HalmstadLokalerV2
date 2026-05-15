'use client'
import { useCityContext } from "@/contexts/CityContext";

export function WhitelabelFooter() {
  const { currentCity } = useCityContext();

  const siteDomain = currentCity?.domain || "halmstadlokaler.se";
  const siteName = currentCity?.name ? `${currentCity.name}Lokaler.se` : "HalmstadLokaler.se";

  return (
    <footer className="mt-auto bg-background">
      <div className="container mx-auto px-4">
        <hr className="border-t border-border/15 mb-6" />
      </div>
      <div className="pb-8 text-center">
        <p className="text-sm text-muted-foreground/70">
          Publicerad med{" "}
          <a
            href={`https://${siteDomain}`}
            rel="follow"
            className="hover:text-foreground transition-colors underline"
          >
            {siteName}
          </a>
        </p>
      </div>
    </footer>
  );
}

