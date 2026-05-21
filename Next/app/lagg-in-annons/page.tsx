'use client'
import { Button } from "@/components/ui/button";
import { UserPlus, Inbox, ClipboardList, PlusCircle, LogIn } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { SEOHead } from "@/components/seo/SEOHead";
import halmstadHero from "@/assets/halmstad-city-hero.jpg";
import Link from "next/link";

export default function AdvertiserOnboardingPage() {
  return (
    <>
      <SEOHead
        title="Skapa konto och lägg upp din lokal"
        description="Skapa ett kostnadsfritt konto för att publicera annonser för lediga lokaler. Ta emot intresseanmälningar och hantera förfrågningar."
        canonical="/lagg-in-annons"
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        
        <main className="flex-1">
          {/* Hero image */}
          <div className="w-full h-48 sm:h-64 md:h-80 overflow-hidden relative">
            <img 
              src={halmstadHero.src} 
              alt="Vy över Halmstad" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
          </div>

          <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="max-w-xl mx-auto">
              {/* H1 - Page title */}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-5">
                Skapa konto och lägg upp din lokal
              </h1>
              
              {/* Feature list with icons */}
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center mt-0.5">
                    <UserPlus className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    För att publicera en annons skapar du ett konto. När allt är klart kan du lägga upp dina lokaler och börja ta emot förfrågningar.
                  </p>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center mt-0.5">
                    <Inbox className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Alla förfrågningar samlas på ett ställe, där du kan följa status, hantera dialog och hålla ordning på kontaktuppgifter i ett CRM anpassat för uthyrning av lokaler.
                  </p>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center mt-0.5">
                    <ClipboardList className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Du ser varje intresseanmälan, följer upp status och hanterar dialog och kontaktuppgifter i ett enkelt och överskådligt CRM.
                  </p>
                </div>
              </div>

              {/* CTAs - side by side */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth?mode=signup" className="flex-1">
                  <Button className="w-full gap-2" size="lg">
                    <PlusCircle className="h-4 w-4" />
                    Skapa konto
                  </Button>
                </Link>

                <Link href="/auth" className="flex-1">
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    variant="outline"
                  >
                    <LogIn className="h-4 w-4" />
                    Logga in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
