'use client'
import { useEffect, useState, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Share2, Link as LinkIcon, Mail, Facebook, Linkedin, FileText, Download } from "lucide-react";
import DOMPurify from "dompurify";
import { toHtmlPreserveLineBreaks } from "@/lib/richText";
import {
  fetchPropertyById,
  fetchPropertyBySlug,
  trackPropertyView,
} from "@/lib/properties";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ContactCard } from "@/components/public/ContactCard";
import { AdvertiserSection } from "@/components/public/AdvertiserSection";
import { ContactPanel } from "@/components/public/ContactPanel";
import { AdvertiserOtherProperties } from "@/components/public/AdvertiserOtherProperties";
import { MobileContactCTA } from "@/components/public/MobileContactCTA";
import { RelatedProperties } from "@/components/public/RelatedProperties";
import { ImageLightbox } from "@/components/public/ImageLightbox";
import { GalleryImage, HeroImage } from "@/components/public/GallerySection";
import { PropertyTypeBadges } from "@/components/public/PropertyTypeBadges";
import { RealEstateListingSchema } from "@/components/seo/RealEstateListingSchema";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { SinglePropertyMap } from "@/components/public/SinglePropertyMap";
import { supabase } from "@/integrations/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

// Helper to check if a string is a valid UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// GalleryImage and HeroImage are now imported from GallerySection

// Share button component with Web Share API support
function ShareButton({ title, url }: { title: string; url: string }) {
  const { toast } = useToast();
  const canUseWebShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: title,
        text: `Kolla in denna lokal: ${title}`,
        url: url,
      });
    } catch (err) {
      // User cancelled or share failed - ignore AbortError
      if (err instanceof Error && err.name !== 'AbortError') {
        toast({
          title: "Kunde inte dela",
          description: "Försök igen eller använd en annan delningsmetod.",
          variant: "destructive",
        });
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Länk kopierad",
        description: "Länken har kopierats till urklipp.",
      });
    } catch {
      toast({
        title: "Kunde inte kopiera",
        description: "Försök igen eller kopiera länken manuellt.",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Kolla in denna lokal: ${title}`);
    const body = encodeURIComponent(`Jag hittade denna lokal som kan vara intressant:\n\n${title}\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
  };

  // On mobile with Web Share API, use native sharing
  if (canUseWebShare) {
    return (
      <Button variant="outline" className="shrink-0 gap-2" onClick={handleNativeShare}>
        <Share2 className="h-4 w-4" />
        DELA
      </Button>
    );
  }

  // On desktop, use dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="shrink-0 gap-2">
          <Share2 className="h-4 w-4" />
          DELA
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyToClipboard}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Kopiera länk
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Dela via e-post
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareOnFacebook}>
          <Facebook className="h-4 w-4 mr-2" />
          Dela på Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareOnLinkedIn}>
          <Linkedin className="h-4 w-4 mr-2" />
          Dela på LinkedIn
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function PropertyDetailPage() {

  const pathname = usePathname();
  const id = pathname.split("/").pop() || "";
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [countdown, setCountdown] = useState(8);

  // Scroll to top when navigating to this page
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Determine if param is UUID or slug
  const isIdUUID = id ? isUUID(id) : false;

  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      if (!id) return null;
      // If it looks like a UUID, try fetching by ID first
      if (isIdUUID) {
        return fetchPropertyById(id);
      }
      // Otherwise, it's a slug - fetch by slug
      return fetchPropertyBySlug(id);
    },
    enabled: !!id,
  });

  // Track view using actual property ID (not slug)
  useEffect(() => {
    if (property?.id) {
      trackPropertyView(property.id);
    }
  }, [property?.id]);

  // Fetch advertiser's listing count
  const { data: advertiserListingCount } = useQuery({
    queryKey: ["advertiser-listing-count", property?.ownerId],
    queryFn: async () => {
      if (!property?.ownerId) return 0;
      const { count, error } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", property.ownerId)
        .eq("status", "published");
      
      if (error) {
        console.error("Error fetching listing count:", error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!property?.ownerId,
  });

  // Auto-redirect for missing properties (hook must be before any conditional returns)
  const isNotFound = !isLoading && (error || !property);

  useEffect(() => {
    if (!isNotFound) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace("/lokaler");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isNotFound, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
          <Skeleton className="h-5 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="aspect-[16/10] rounded-2xl" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-24" />
            </div>
            <div>
              <Skeleton className="h-80 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !property) {
    return (
      <>
        <div className="min-h-screen flex flex-col bg-background">
          <PublicHeader />
          <main className="flex-1 container mx-auto px-4 py-16 md:py-24 text-center max-w-xl">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <ArrowLeft className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-heading font-semibold mb-4">
              Den här lokalen är inte längre tillgänglig
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Annonsen har tagits bort eller är inte längre aktiv.
              <br />
              Det kan bero på att lokalen har hyrts ut, pausats eller uppdaterats av fastighetsägaren.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Du skickas automatiskt till lediga lokaler om{" "}
              <span className="font-semibold text-foreground">{countdown}</span> sekunder...
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/lokaler"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Se lediga lokaler nu
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Gå till startsidan
              </Link>
            </div>
          </main>
          <PublicFooter />
        </div>
      </>
    );
  }

  const monthlyRent =
    property.rentPerSqmYear && property.area
      ? Math.round((property.rentPerSqmYear * property.area) / 12)
      : null;

  const seoTitle = `${property.title} – ${property.area || ""} m² ${property.typeLabel}`;
  const seoDescription =
    property.descriptionShort ||
    `${property.typeLabel} på ${property.address}. ${property.area ? `${property.area} m².` : ""}`;

  // Canonical URL for SEO - use slug for SEO-friendly URLs
  const canonicalUrl = `https://halmstadlokaler.se/lokal/${property.slug}`;

  // Generate initials from company name for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "HL";
    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const advertiserName = property.advertiser?.companyName || "Annonsör";
  const advertiserEmail = property.advertiser?.email;
  const advertiserPhone = property.advertiser?.phone;
  const advertiserLogo = property.advertiser?.companyLogo;
  const advertiserAddress = property.advertiser?.address;
  const advertiserCity = property.advertiser?.city;

  return (
    <>      
      {/* RealEstateListing JSON-LD Schema */}
      <RealEstateListingSchema property={property} />

      <div className="min-h-screen flex flex-col bg-background">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
          <PublicHeader />
        </div>

        <main className="flex-1">
          <div className="container mx-auto px-4 py-sp-3 md:py-sp-4">
            {/* Breadcrumbs */}
            <Breadcrumbs
              items={[
                { label: "Lediga lokaler", href: "/lokaler" },
                ...(property.typeLabel ? [{ label: property.typeLabel, href: `/${property.type || "lokaler"}` }] : []),
                { label: property.title },
              ]}
              className="mb-2"
            />

            {/* Lightbox */}
            {property.images && (
              <ImageLightbox
                images={property.images}
                currentIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                onNavigate={setLightboxIndex}
              />
            )}

            {/* Main grid - hero + contact aligned */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-sp-4 lg:gap-sp-5">
              {/* Main content - 2/3 width on desktop */}
              <div className="lg:col-span-2 overflow-x-hidden">
                {/* Hero image */}
                {property.images && property.images.length > 0 && (
                  <div className="mb-sp-2 md:mb-sp-3">
                    <HeroImage
                      src={property.images[0]}
                      alt={property.title}
                      priority={true}
                      onClick={() => {
                        setLightboxIndex(0);
                        setLightboxOpen(true);
                      }}
                    />
                  </div>
                )}

                {/* Title section with share button */}
                <div className="flex items-start justify-between gap-4 mb-sp-2 md:mb-sp-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                    {property.title}
                  </h1>
                  <ShareButton 
                    title={property.title} 
                    url={window.location.href} 
                  />
                </div>

                {/* Key facts - Typ, Area, Adress, Hyra */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 py-sp-2 md:py-sp-3 border-y border-border mb-sp-2 md:mb-sp-3">
                  {property.typeRaw && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Typ</p>
                      <PropertyTypeBadges 
                        typeString={property.typeRaw} 
                        maxVisible={4} 
                        variant="outline"
                        size="sm"
                        showIcon={true}
                      />
                    </div>
                  )}
                  {property.area && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Area</p>
                      <p className="font-medium">{property.area} m²</p>
                    </div>
                  )}
                  {property.address && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Adress</p>
                      <p className="font-medium">{property.address}</p>
                    </div>
                  )}
                  {monthlyRent && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hyra</p>
                      <p className="font-medium">{monthlyRent.toLocaleString("sv-SE")} kr/mån</p>
                    </div>
                  )}
                </div>

                {/* Description - Om lokalen */}
                {(property.descriptionShort || property.description) && (
                  <div className="mb-sp-2 md:mb-sp-3" data-prose>
                    <h2 className="text-lg font-semibold mb-sp-1">Om lokalen</h2>
                    
                    {/* Kort beskrivning - fetstil */}
                    {property.descriptionShort && (
                      <p className="text-sm sm:text-base font-semibold text-foreground mb-3">
                        {property.descriptionShort}
                      </p>
                    )}
                    
                    {/* Utförlig beskrivning */}
                    {property.description && (
                      <div
                        className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            toHtmlPreserveLineBreaks(property.description)
                          ),
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Map */}
                {property.latitude && property.longitude && (
                  <div className="mb-sp-1 md:mb-sp-2">
                    <h2 className="text-lg font-semibold mb-sp-1">Karta</h2>
                    <div className="aspect-[4/3] sm:aspect-[16/9] rounded-2xl overflow-hidden">
                      <SinglePropertyMap
                        latitude={property.latitude}
                        longitude={property.longitude}
                        title={property.title}
                      />
                    </div>
                  </div>
                )}

                {/* Documents section - between map and more images */}
                {property.documents && property.documents.length > 0 && (
                  <div className="mb-sp-2 md:mb-sp-3">
                    <h2 className="text-lg font-semibold mb-sp-1">Ritningar och dokument</h2>
                    <div className="space-y-2">
                      {property.documents.map((doc, index) => {
                        const fileName = doc.split('/').pop()?.split('?')[0] || 'Dokument';
                        const nameParts = decodeURIComponent(fileName).split('_');
                        const displayName = nameParts.length >= 3 ? nameParts.slice(2).join('_') : fileName;
                        
                        const handleDownload = async (e: React.MouseEvent) => {
                          e.preventDefault();
                          try {
                            const response = await fetch(doc);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = displayName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                          } catch {
                            // Fallback: open in new tab
                            window.open(doc, '_blank');
                          }
                        };
                        
                        return (
                          <button
                            key={index}
                            onClick={handleDownload}
                            className="flex items-center gap-3 w-full p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left group"
                          >
                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                            <span className="text-sm text-foreground truncate group-hover:text-primary transition-colors flex-1">
                              {displayName}
                            </span>
                            <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Image gallery - remaining images after map */}
                {property.images && property.images.length > 1 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Fler bilder</h2>
                    {/* Vertical stack gallery on all devices */}
                    <div className="flex flex-col gap-3">
                      {property.images.slice(1).map((image, index) => (
                        <div key={index}>
                          <GalleryImage
                            src={image}
                            alt={`${property.title} - bild ${index + 2}`}
                            onClick={() => {
                              setLightboxIndex(index + 1);
                              setLightboxOpen(true);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Card - shown after images on desktop */}
                <div className="hidden lg:block pt-sp-2 mt-sp-2 border-t border-border">
                  <h2 className="text-lg font-semibold mb-sp-1">Kontakt</h2>
                  <ContactCard
                    contactName={property.advertiser.name}
                    contactTitle={property.advertiser.title}
                    contactEmail={property.advertiser.email}
                    contactPhonePrimary={property.advertiser.phone}
                    companyLogo={property.advertiser.companyLogo}
                    companyName={property.advertiser.companyName}
                    propertyId={property.id}
                    isPrelisting={property.isPrelisting}
                  />
                </div>
              </div>

              {/* Sidebar - sticky, follows user when scrolling */}
              <div className="hidden lg:block">
                <div className="lg:sticky lg:top-24">
                  <ContactPanel
                    propertyId={property.id}
                    propertyTitle={property.title}
                    propertyAddress={property.address}
                    advertiserName={property.advertiser.companyName}
                  />
                </div>
              </div>

              {/* Contact card for mobile - shown below main content on mobile only */}
              <div className="lg:hidden pt-sp-4 border-t border-border">
                <h2 className="text-lg font-semibold mb-sp-2">Kontakt</h2>
                <ContactCard
                  contactName={property.advertiser.name}
                  contactTitle={property.advertiser.title}
                  contactEmail={property.advertiser.email}
                  contactPhonePrimary={property.advertiser.phone}
                  companyLogo={property.advertiser.companyLogo}
                  companyName={property.advertiser.companyName}
                  propertyId={property.id}
                  isPrelisting={property.isPrelisting}
                />
              </div>
            </div>
          </div>

          {/* "Not the right property?" CTA */}
          <section className="mt-sp-4 py-sp-4 border-t border-border">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <h2 className="text-lg font-semibold mb-2">Inte rätt lokal?</h2>
              <p className="text-muted-foreground mb-4">Beskriv vad du söker så matchar vi dig med rätt alternativ — snabbt och kostnadsfritt.</p>
              <Link
                href="/hitta-lokal"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cta text-cta-foreground rounded-lg font-medium hover:bg-cta-hover transition-colors"
              >
                Hitta rätt lokal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Related properties - with muted background for visual separation */}
          <section className="bg-muted/50 mt-sp-5 py-sp-5 rounded-2xl mx-4 md:mx-0 shadow-sm">
            <div className="container mx-auto px-4">
              <RelatedProperties
                currentId={property.id}
                currentType={property.type}
                currentArea={property.area}
                typeLabel={property.typeLabel}
              />
            </div>
          </section>
        </main>

        {/* Add bottom padding on mobile to account for sticky CTA */}
        <div className="h-20 lg:hidden" />

        <PublicFooter />

        {/* Mobile sticky CTA */}
        <MobileContactCTA
          propertyId={property.id}
          propertyTitle={property.title}
          propertyAddress={property.address}
          advertiserName={property.advertiser?.companyName}
        />
      </div>
    </>
  );
}
