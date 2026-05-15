'use client'
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ExternalLink, Save, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCityContext } from "@/contexts/CityContext";
import type { SiteSchemaConfig } from "@/hooks/useSiteSchemaConfig";

interface CitySchemaConfigProps {
  cityId: string;
  cityName: string;
  cityDomain?: string | null;
}

const LOCAL_BUSINESS_TYPES = [
  { value: "RealEstateAgent", label: "Fastighetsmäklare (RealEstateAgent)" },
  { value: "LocalBusiness", label: "Lokalt företag (LocalBusiness)" },
  { value: "RealEstateAgency", label: "Fastighetsbyrå (RealEstateAgency)" },
  { value: "ProfessionalService", label: "Professionell tjänst (ProfessionalService)" },
];

export function CitySchemaConfig({ cityId, cityName, cityDomain }: CitySchemaConfigProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Local state for form
  const [formData, setFormData] = useState<Partial<SiteSchemaConfig>>({
    local_business_enabled: true,
    local_business_type: "RealEstateAgent",
    phone: "",
    email: "",
    opening_hours: "",
    price_range: "",
    geo_radius_km: null,
    same_as: [],
    article_publisher: "",
  });

  // Fetch existing config
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["site-schema-config", cityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_schema_config")
        .select("*")
        .eq("city_id", cityId)
        .maybeSingle();

      if (error) throw error;
      return data as SiteSchemaConfig | null;
    },
    enabled: !!cityId,
  });

  // Sync form data when existing config loads
  useEffect(() => {
    if (existingConfig) {
      setFormData({
        local_business_enabled: existingConfig.local_business_enabled,
        local_business_type: existingConfig.local_business_type || "RealEstateAgent",
        phone: existingConfig.phone || "",
        email: existingConfig.email || "",
        opening_hours: existingConfig.opening_hours || "",
        price_range: existingConfig.price_range || "",
        geo_radius_km: existingConfig.geo_radius_km,
        same_as: existingConfig.same_as || [],
        article_publisher: existingConfig.article_publisher || "",
      });
    }
  }, [existingConfig]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<SiteSchemaConfig>) => {
      const payload = {
        city_id: cityId,
        local_business_enabled: data.local_business_enabled,
        local_business_type: data.local_business_type || "RealEstateAgent",
        phone: data.phone || null,
        email: data.email || null,
        opening_hours: data.opening_hours || null,
        price_range: data.price_range || null,
        geo_radius_km: data.geo_radius_km || null,
        same_as: data.same_as || [],
        article_publisher: data.article_publisher || null,
      };

      if (existingConfig) {
        const { error } = await supabase
          .from("site_schema_config")
          .update(payload)
          .eq("id", existingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_schema_config")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-schema-config", cityId] });
      toast({ title: "Schema-konfiguration sparad" });
    },
    onError: (error) => {
      toast({ 
        title: "Kunde inte spara", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSameAsChange = (value: string) => {
    // Split by newlines and filter empty
    const links = value.split("\n").filter(Boolean);
    setFormData(prev => ({ ...prev, same_as: links }));
  };

  // Generate preview JSON-LD
  const generatePreview = () => {
    const siteUrl = cityDomain 
      ? `https://${cityDomain}` 
      : `https://${cityId}lokaler.se`;
    
    const siteName = `${cityName}Lokaler`;

    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": formData.local_business_type || "RealEstateAgent",
      name: siteName,
      url: siteUrl,
      areaServed: {
        "@type": "City",
        name: cityName,
      },
    };

    if (formData.phone) schema.telephone = formData.phone;
    if (formData.email) schema.email = formData.email;
    if (formData.price_range) schema.priceRange = formData.price_range;
    if (formData.same_as && formData.same_as.length > 0) schema.sameAs = formData.same_as;

    return JSON.stringify(schema, null, 2);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-t pt-4">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Code className="w-4 h-4" />
            Schema Markup (SEO)
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 pt-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laddar...</p>
        ) : (
          <>
            {/* LocalBusiness toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm">LocalBusiness Schema</Label>
                <p className="text-xs text-muted-foreground">
                  Aktivera strukturerad data för lokalt företag
                </p>
              </div>
              <Switch
                checked={formData.local_business_enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, local_business_enabled: checked }))
                }
              />
            </div>

            {formData.local_business_enabled && (
              <>
                {/* Business Type */}
                <div>
                  <Label className="text-sm">Företagstyp</Label>
                  <Select 
                    value={formData.local_business_type || "RealEstateAgent"}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, local_business_type: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCAL_BUSINESS_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Telefon</Label>
                    <Input
                      value={formData.phone || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+46-35-123456"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">E-post</Label>
                    <Input
                      value={formData.email || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@example.se"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Öppettider</Label>
                  <Input
                    value={formData.opening_hours || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, opening_hours: e.target.value }))}
                    placeholder="Mo-Fr 08:00-17:00"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: Mo-Fr 08:00-17:00
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Prisintervall</Label>
                    <Input
                      value={formData.price_range || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_range: e.target.value }))}
                      placeholder="$$"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Geo-radie (km)</Label>
                    <Input
                      type="number"
                      value={formData.geo_radius_km || ""}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        geo_radius_km: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                      placeholder="50"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Sociala media-länkar</Label>
                  <Textarea
                    value={(formData.same_as || []).join("\n")}
                    onChange={(e) => handleSameAsChange(e.target.value)}
                    placeholder="https://facebook.com/example&#10;https://linkedin.com/company/example"
                    rows={3}
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    En länk per rad
                  </p>
                </div>

                <div>
                  <Label className="text-sm">Artikelutgivare</Label>
                  <Input
                    value={formData.article_publisher || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, article_publisher: e.target.value }))}
                    placeholder={`${cityName}Lokaler`}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Används för Article-schema på blogg/guide-sidor
                  </p>
                </div>
              </>
            )}

            {/* Preview toggle */}
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <Code className="w-3 h-3" />
                {showPreview ? "Dölj" : "Visa"} JSON-LD
              </Button>
              
              {showPreview && (
                <div className="mt-2">
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-48">
                    {generatePreview()}
                  </pre>
                  <a 
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                  >
                    Testa i Google Rich Results Test
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Save button */}
            <Button 
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
              className="w-full gap-2"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Sparar..." : "Spara schema-konfiguration"}
            </Button>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

