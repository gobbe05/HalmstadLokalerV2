'use client'
import { SEOHead } from "@/components/seo/SEOHead";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MatchingWidget } from "@/components/public/MatchingWidget";
import { PropertyType } from "@/types/property";
import { useParams, useSearchParams } from "next/navigation";

const URL_TYPE_MAP: Record<string, PropertyType> = {
  kontor: "OFFICE",
  lager: "WAREHOUSE_LOGISTICS",
  butik: "SHOP",
  verkstad: "INDUSTRY_WORKSHOP",
  industri: "INDUSTRY_WORKSHOP",
  restaurang: "RESTAURANT_CAFE",
  coworking: "OFFICE_HOTEL_COWORKING",
};

export default function FindPropertyPage() {
  
  const {typParam} = useParams()
  const preselectedType = typParam ? URL_TYPE_MAP[typParam] : undefined;

  return (
    <>
      <SEOHead
        title="Hitta rätt lokal i Halmstad – på 60 sekunder"
        description="Beskriv ditt behov så matchar vi dig med rätt lokal i Halmstad. Kontor, lager, butik eller verkstad – snabbt och kostnadsfritt."
        canonical="/hitta-lokal"
      />

      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />

        <main className="flex-1 flex items-center justify-center py-12 md:py-20 px-4">
          <div className="w-full max-w-2xl">
            <MatchingWidget preselectedType={preselectedType} />
          </div>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
