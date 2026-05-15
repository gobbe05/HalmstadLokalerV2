'use client'
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Home, Search } from "lucide-react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { Button } from "@/components/ui/button";

interface PropertyNotFoundProps {
  /** Custom back link (e.g., to advertiser page) */
  backLink?: string;
  /** Custom back label */
  backLabel?: string;
  /** Whether to show the public header/footer (false for whitelabel) */
  showPublicLayout?: boolean;
  /** Custom header element for whitelabel pages */
  customHeader?: React.ReactNode;
  /** Countdown duration in seconds before auto-redirect */
  countdownSeconds?: number;
  /** Where to redirect after countdown (default: /lokaler) */
  redirectTo?: string;
}

/**
 * Reusable component for displaying "property not found" state
 * with automatic redirect countdown and SEO-friendly meta tags.
 * 
 * Used by:
 * - PropertyDetailPage
 * - WhitelabelPropertyDetailPage
 * - Any future property pages
 */
export function PropertyNotFound({
  backLink = "/lokaler",
  backLabel = "Se lediga lokaler",
  showPublicLayout = true,
  customHeader,
  countdownSeconds = 8,
  redirectTo = "/lokaler",
}: PropertyNotFoundProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(countdownSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(redirectTo, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, redirectTo]);

  return (
    <>
      <Helmet>
        {/* Signal to search engines: don't index this page, don't follow links */}
        <meta name="robots" content="noindex, nofollow" />
        {/* Custom meta for crawlers indicating content is gone */}
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Lokal inte tillgänglig</title>
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        {showPublicLayout ? <PublicHeader /> : customHeader}
        
        <main className="flex-1 container mx-auto px-4 py-16 md:py-24 flex items-center justify-center">
          <div className="text-center max-w-md">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-heading font-semibold mb-4">
              Den här lokalen är inte längre tillgänglig
            </h1>
            
            {/* Description */}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Annonsen har tagits bort eller är inte längre aktiv.
              <br />
              Det kan bero på att lokalen har hyrts ut, pausats eller uppdaterats av fastighetsägaren.
            </p>
            
            {/* Countdown */}
            <p className="text-sm text-muted-foreground mb-8">
              Du skickas automatiskt till lediga lokaler om{" "}
              <span className="font-semibold text-foreground">{countdown}</span> sekunder...
            </p>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild>
                <Link to={backLink}>
                  {backLabel}
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/" className="gap-2">
                  <Home className="h-4 w-4" />
                  Gå till startsidan
                </Link>
              </Button>
            </div>
          </div>
        </main>
        
        {showPublicLayout && <PublicFooter />}
      </div>
    </>
  );
}

