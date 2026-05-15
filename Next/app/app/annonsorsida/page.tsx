'use client'
import { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useCityContext } from "@/contexts/CityContext";
import { useCurrentAdvertiserSlug } from "@/hooks/useAdvertiserSlug";
import { getProductionUrl, isPreviewEnvironment } from "@/lib/siteUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { 
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Code,
  Eye,
  EyeOff
} from "lucide-react";

export default function AppAdvertiserPagePage() {
  const { data: currentProfile, isLoading: profileLoading } = useCurrentProfile();
  const { data: profileData } = useProfileCompletion();
  const { currentCity } = useCityContext();
  const { data: slugData } = useCurrentAdvertiserSlug(currentProfile?.id);
  
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Build site info for URL generation
  const site = currentCity
    ? {
        id: currentCity.id,
        name: currentCity.name,
        domain: currentCity.domain,
        is_published: currentCity.is_published,
        seo_title: currentCity.seo_title,
        seo_description: currentCity.seo_description,
        intro_text: currentCity.intro_text,
        hero_image_url: currentCity.hero_image_url,
      }
    : null;

  // Only use production domain in the portal when the city is actually published
  const productionUrl = site?.is_published ? getProductionUrl(site) : null;

  // Build advertiser page URL using slug
  const slug = slugData?.slug;
  const advertiserPageUrl = slug
    ? productionUrl
      ? `${productionUrl}/annonsor/${slug}`
      : `${window.location.origin}/annonsor/${slug}`
    : null;

  // Generate embed code
  const embedCode = advertiserPageUrl
    ? `<iframe src="${advertiserPageUrl}?embed=true" width="100%" height="800" frameborder="0" style="border: none;"></iframe>`
    : "";

  const copyLink = async () => {
    if (!advertiserPageUrl) return;
    try {
      await navigator.clipboard.writeText(advertiserPageUrl);
      setCopied(true);
      toast.success("Länk kopierad!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera");
    }
  };

  const copyEmbed = async () => {
    if (!embedCode) return;
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      toast.success("Inbäddningskod kopierad!");
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera");
    }
  };

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const isProfileIncomplete = profileData && !profileData.isComplete;

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-8">
          <div className="text-muted-foreground">Laddar...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background px-4 md:px-8 pt-6 pb-4 border-b border-border/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-foreground">Min annonsörssida</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Förhandsgranska och dela din publika sida
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6">
          {/* Warning if profile incomplete */}
          {isProfileIncomplete && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Profilen är inte komplett</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Fyll i din profil för att aktivera din annonsörssida och kunna publicera lokaler.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.href = "/app/profil"}
                >
                  Gå till profil
                </Button>
              </div>
            </div>
          )}

          {/* Direct link card */}
          <Card className="border-l-2 border-l-teal-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <ExternalLink className="h-4 w-4 text-teal-700" />
                Direktlänk
              </CardTitle>
              <CardDescription>
                Dela länken till din annonsörssida via e-post eller sociala medier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs break-all">
                {advertiserPageUrl || "Ingen länk tillgänglig"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  disabled={!advertiserPageUrl}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Kopierad
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Kopiera länk
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.open(advertiserPageUrl || "", "_blank")}
                  disabled={!advertiserPageUrl}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Öppna sida
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Embed code card */}
          <Card className="border-l-2 border-l-teal-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Code className="h-4 w-4 text-teal-500" />
                Bädda in på din hemsida
              </CardTitle>
              <CardDescription>
                Visa dina lediga lokaler direkt på din egen webbplats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs break-all">
                {embedCode || "Ingen inbäddningskod tillgänglig"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyEmbed}
                disabled={!embedCode}
              >
                {embedCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Kopierad
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Kopiera inbäddningskod
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview iframe - Collapsible */}
          <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
            <Card className={!previewOpen 
              ? "border-l-2 border-l-teal-300 border-dashed border-t border-r border-b bg-muted/20 hover:bg-muted/30 hover:border-teal-400 transition-all" 
              : "border-l-2 border-l-teal-300"}>
              <CollapsibleTrigger asChild>
                <div className="p-4 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors rounded-t-lg touch-manipulation">
                  <div className="flex items-center gap-3">
                    {previewOpen 
                      ? <EyeOff className="w-5 h-5 text-teal-400 flex-shrink-0" /> 
                      : <Eye className="w-5 h-5 text-teal-300 flex-shrink-0" />
                    }
                    <div>
                      <span className="font-medium text-base">
                        {previewOpen ? "Dölj förhandsgranskning" : "Visa förhandsgranskning"}
                      </span>
                      {!previewOpen && (
                        <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">
                          Klicka för att se hur din sida ser ut
                        </p>
                      )}
                    </div>
                  </div>
                  {previewOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshPreview();
                      }}
                      className="flex-shrink-0"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {advertiserPageUrl ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <iframe
                        key={previewKey}
                        src={advertiserPageUrl}
                        className="w-full h-[400px] sm:h-[600px]"
                        title="Förhandsgranskning av annonsörssida"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground rounded-lg border border-border">
                      Ingen annonsörssida tillgänglig
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </AppLayout>
  );
}
