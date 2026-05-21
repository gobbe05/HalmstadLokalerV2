'use server'
import { Home, Search } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const NotFound = () => {

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        
        <main className="flex-1 container mx-auto px-4 py-16 md:py-24 flex items-center justify-center">
          <div className="text-center max-w-md">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <span className="text-3xl font-bold text-muted-foreground">404</span>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-heading font-semibold mb-4">
              Sidan hittades inte
            </h1>
            
            {/* Description */}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Sidan du letar efter finns inte eller har flyttats.
              <br />
              Kontrollera adressen eller gå tillbaka till startsidan.
            </p>
            
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild>
                <Link href="/lokaler">
                  <Search className="h-4 w-4 mr-2" />
                  Se lediga lokaler
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/" className="gap-2">
                  <Home className="h-4 w-4" />
                  Gå till startsidan
                </Link>
              </Button>
            </div>
          </div>
        </main>
        
        <PublicFooter />
      </div>
    </>
  );
};

export default NotFound;
