'use client'
import { useEffect, useState, useLayoutEffect, useMemo } from "react";
import { WhitelabelFooter } from "@/components/public/WhitelabelFooter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, Link as LinkIcon, Mail, Facebook, Linkedin, ChevronRight, Home, FileText, Download } from "lucide-react";
import DOMPurify from "dompurify";
import { toHtmlPreserveLineBreaks } from "@/lib/richText";
import { supabase } from "@/integrations/supabase/client";
import { ContactCard } from "@/components/public/ContactCard";
import { ContactPanel } from "@/components/public/ContactPanel";
import { MobileContactCTA } from "@/components/public/MobileContactCTA";
import { AnnonsorHeader } from "@/components/public/AnnonsorHeader";
import { ImageLightbox } from "@/components/public/ImageLightbox";
import { GalleryImage, HeroImage } from "@/components/public/GallerySection";
import { extractIdFromSlug } from "@/types/property";
import { PropertyTypeBadges } from "@/components/public/PropertyTypeBadges";
import { SinglePropertyMap } from "@/components/public/SinglePropertyMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { transformListing } from "@/lib/properties";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

  if (canUseWebShare) {
    return (
      <Button variant="outline" className="shrink-0 gap-2" onClick={handleNativeShare}>
        <Share2 className="h-4 w-4" />
        DELA
      </Button>
    );
  }

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

export default function WhitelabelPropertyDetailPage() {
  const searchParams = useSearchParams();
  const advertiserId = searchParams.get("advertiserId") ?? undefined;
  const slug = searchParams.get("slug") ?? undefined;
  const propertyId = searchParams.get("propertyId") ?? undefined;  const pathname  = usePathname();
  
  const router = useRouter();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [countdown, setCountdown] = useState(8);
  // Scroll to top when navigating to this page
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Fetch property with profile - supports both UUID and slug formats
  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["whitelabel-property", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      
      // Check if propertyId is a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId);
      
      if (isUUID) {
        // Direct UUID lookup
        const { data, error } = await supabase
          .from("listings")
          .select(`
            *,
            profiles!listings_owner_id_fkey (
              id,
              display_name,
              contact_title,
              email,
              phone,
              company_name,
              company_logo,
              website,
              org_number,
              address,
              city,
              postal_code,
              user_id
            )
          `)
          .eq("id", propertyId)
          .eq("status", "published")
          .maybeSingle();

        if (error || !data) return null;
        return transformListing(data);
      }
      
      // It's a slug - extract ID suffix and search with pagination
      const idSuffix = extractIdFromSlug(propertyId);
      
      if (idSuffix) {
        const PAGE_SIZE = 1000;
        const MAX_PAGES = 10;
        
        for (let page = 0; page < MAX_PAGES; page++) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;
          
          const { data, error } = await supabase
            .from("listings")
            .select(`
              *,
              profiles!listings_owner_id_fkey (
                id,
                display_name,
                contact_title,
                email,
                phone,
                company_name,
                company_logo,
                website,
                org_number,
                address,
                city,
                postal_code,
                user_id
              )
            `)
            .eq("status", "published")
            .range(from, to);

          if (error) return null;
          if (!data || data.length === 0) break;
          
          // Find the listing whose ID ends with the suffix
          const match = data.find((listing: any) => listing.id.endsWith(idSuffix));
          if (match) return transformListing(match);
          
          if (data.length < PAGE_SIZE) break;
        }
      }
      
      return null;
    },
    enabled: !!propertyId,
  });

  // Fetch advertiser profile (only needed for UUID-based route, not slug-based)
  // When slug is used, we get advertiser info from the property itself
  const { data: advertiser } = useQuery({
    queryKey: ["advertiser-profile", advertiserId],
    queryFn: async () => {
      if (!advertiserId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", advertiserId)
        .single();
      return data;
    },
    enabled: !!advertiserId && !slug,
  });

  // Fetch advertiser slug for back navigation (only needed if we have advertiserId, not slug)
  const { data: advertiserSlugData } = useQuery({
    queryKey: ["advertiser-slug-for-back", advertiserId, advertiser?.primary_city_id],
    queryFn: async () => {
      if (!advertiserId || !advertiser?.primary_city_id) return null;
      const { data } = await supabase
        .from("advertiser_slugs")
        .select("slug")
        .eq("profile_id", advertiserId)
        .eq("city_id", advertiser.primary_city_id)
        .eq("is_active", true)
        .maybeSingle();
      return data?.slug || null;
    },
    enabled: !!advertiserId && !slug && !!advertiser?.primary_city_id,
  });

  // Use slug from URL param if available, otherwise use fetched slug
  const advertiserSlug = slug || advertiserSlugData;
  
  // Determine the back link for not found state
  const backLink = advertiserSlug ? `/annonsor/${advertiserSlug}` : (advertiserId ? `/annonsorer/${advertiserId}` : "/lokaler");

  // Track view event
  useEffect(() => {
    if (propertyId) {
      supabase.from("listing_events").insert({
        listing_id: propertyId,
        event_type: "view",
        session_id: sessionStorage.getItem("session_id") || crypto.randomUUID(),
        source: "whitelabel",
      });
    }
  }, [propertyId]);

  // Auto-redirect for missing properties (hook must be before any conditional returns)
  const isNotFound = !isLoading && (error || !property);

  useEffect(() => {
    if (!isNotFound) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace(backLink);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isNotFound, router, backLink]);

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
              Du skickas automatiskt om{" "}
              <span className="font-semibold text-foreground">{countdown}</span> sekunder...
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={backLink}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Se andra lokaler
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Gå till startsidan
              </Link>
            </div>
          </main>
        </div>
      </>
    );
  }

  const monthlyRent =
    property.rentPerSqmYear && property.area
      ? Math.round((property.rentPerSqmYear * property.area) / 12)
      : null;

  const pageTitle = `${property.title} | ${property.advertiser?.companyName || advertiser?.company_name || "Lokaler"}`;
  const pageDescription = property.descriptionShort || `${property.typeLabel} på ${property.area} m² i ${property.city || "Halmstad"}`;

  const advertiserName = property.advertiser?.companyName || advertiser?.company_name || "Annonsör";
  const advertiserEmail = property.advertiser?.email || advertiser?.email;
  const advertiserPhone = property.advertiser?.phone || advertiser?.phone;
  const advertiserLogo = property.advertiser?.companyLogo || advertiser?.company_logo;

  return (
    <>

      <div className="min-h-screen flex flex-col bg-background">
        {/* White-label Header - sticky on all devices with compact mode */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/40">
          <AnnonsorHeader
            logoUrl={advertiserLogo}
            companyName={advertiserName}
            contactName={property.advertiser?.name || advertiser?.display_name}
            phone={advertiserPhone}
            email={advertiserEmail}
            backLink={advertiserSlug ? `/annonsor/${advertiserSlug}` : `/annonsorer/${advertiserId}`}
            compact
          />
        </div>

        <main className="flex-1">
          <div className="container mx-auto px-4 py-sp-3 md:py-sp-4">
            {/* Breadcrumbs */}
            <nav aria-label="Brödsmulor" className="flex items-center gap-1.5 text-sm mb-6">
              <Link
                href={advertiserSlug ? `/annonsor/${advertiserSlug}` : `/annonsorer/${advertiserId}`}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">{advertiserName}</span>
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-foreground font-medium truncate max-w-[250px]">
                {property.title}
              </span>
            </nav>

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
                  <ShareButton title={property.title} url={window.location.href} />
                </div>

                {/* Key facts */}
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

                {/* Description */}
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

                {/* Documents section */}
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

                {/* Image gallery - remaining images (vertical stack on all devices) */}
                {property.images && property.images.length > 1 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Fler bilder</h2>
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
                    contactName={property.advertiser?.name}
                    contactTitle={property.advertiser?.title}
                    contactEmail={advertiserEmail}
                    contactPhonePrimary={advertiserPhone}
                    companyLogo={advertiserLogo}
                    companyName={advertiserName}
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
                    advertiserName={property.advertiser?.companyName}
                  />
                </div>
              </div>

              {/* Contact info for mobile */}
              <div className="lg:hidden pt-sp-4 border-t border-border">
                <h2 className="text-lg font-semibold mb-sp-2">Kontakt</h2>
                <ContactCard
                  contactName={property.advertiser?.name}
                  contactTitle={property.advertiser?.title}
                  contactEmail={advertiserEmail}
                  contactPhonePrimary={advertiserPhone}
                  companyLogo={advertiserLogo}
                  companyName={advertiserName}
                  propertyId={property.id}
                  isPrelisting={property.isPrelisting}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Add bottom padding on mobile to account for sticky CTA */}
        <div className="h-20 lg:hidden" />

        {/* White label footer */}
        <WhitelabelFooter />

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
