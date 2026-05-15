'use client'
import { useState, useEffect, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoUpload } from "@/components/ui/logo-upload";
import { ProfilePreviewCard } from "@/components/onboarding/ProfilePreviewCard";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useLogoUpload } from "@/hooks/useLogoUpload";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Save,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Cloud,
  CloudOff,
  Loader2
} from "lucide-react";
import { useListings } from "@/hooks/useListings";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  company_logo: string | null;
  org_number: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
}

export default function AppProfilePage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Logo uploading state removed - now handled by useLogoUpload hook
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    contact_title: "",
    phone: "",
    company_name: "",
    company_logo: "",
    address: "",
    city: "",
    postal_code: "",
  });

  const [originalData, setOriginalData] = useState(formData);

  // Hook must be called before any conditional returns (Rules of Hooks)
  const { data: listings } = useListings();

  // Required fields validation
  const requiredFields = useMemo(() => ({
    display_name: !formData.display_name.trim(),
    email: !formData.email.trim(),
    phone: !formData.phone.trim(),
    company_name: !formData.company_name.trim(),
    address: !formData.address.trim(),
    postal_code: !formData.postal_code.trim(),
    city: !formData.city.trim(),
  }), [formData]);

  const isFormValid = useMemo(() => {
    return !Object.values(requiredFields).some(Boolean);
  }, [requiredFields]);

  const getFieldError = (fieldName: keyof typeof requiredFields) => {
    return touched[fieldName] && requiredFields[fieldName] ? "Detta fält är obligatoriskt" : null;
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfile(data);
        const loadedData = {
          display_name: data.display_name || "",
          email: data.email || "",
          contact_title: data.contact_title || "",
          phone: data.phone || "",
          company_name: data.company_name || "",
          company_logo: data.company_logo || "",
          address: data.address || "",
          city: data.city || "",
          postal_code: data.postal_code || "",
        };
        setFormData(loadedData);
        setOriginalData(loadedData);
        // Mark initial load complete after a tick to let auto-save initialize
        setTimeout(() => setIsInitialLoad(false), 100);
      }
      setIsLoading(false);
    }

    fetchProfile();
  }, [user]);

  // Auto-save function
  const performAutoSave = useCallback(async (dataToSave: typeof formData) => {
    if (!profile?.id) return;
    
    const { error } = await supabase
      .from("profiles")
      .update(dataToSave)
      .eq("id", profile.id);

    if (error) {
      console.error("Auto-save error:", error);
    } else {
      // Silently invalidate queries
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
      queryClient.invalidateQueries({ queryKey: ["current-profile"] });
      setOriginalData(dataToSave);
      setHasChanges(false);
    }
  }, [profile?.id, queryClient]);

  // Use auto-save hook
  const { isSaving: isAutoSaving, lastSaved } = useAutoSave({
    data: formData,
    onSave: performAutoSave,
    debounceMs: 1500,
    enabled: !isInitialLoad && !!profile?.id,
  });

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Use logo upload hook with optimization
  const { uploadLogo, isUploading: isUploadingLogo } = useLogoUpload({
    profileId: profile?.id,
    onComplete: (url) => {
      setFormData(prev => ({ ...prev, company_logo: url }));
    },
  });

  const [isManualSaving, setIsManualSaving] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    // Mark all fields as touched to show validation errors
    const allTouched = Object.keys(requiredFields).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    // Check if form is valid
    if (!isFormValid) {
      toast.error("Fyll i alla obligatoriska kontakt-, företags- och adressuppgifter för att spara profilen.");
      return;
    }

    setIsManualSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", profile.id);

    if (error) {
      toast.error("Kunde inte spara profilen");
    } else {
      // Invalidate profile completion query to update status everywhere
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
      queryClient.invalidateQueries({ queryKey: ["current-profile"] });
      
      // Update original data to match saved data
      setOriginalData(formData);
      setHasChanges(false);
      
      toast.success("Profil sparad");
    }
    setIsManualSaving(false);
  };

  const isSaving = isAutoSaving || isManualSaving;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-8">
          <div className="text-muted-foreground">Laddar profil...</div>
        </div>
      </AppLayout>
    );
  }

  const isNewUser = !listings || listings.length === 0;

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Welcome message for new users */}
        {isNewUser && !isFormValid && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Välkommen till Halmstadlokaler!
                </h2>
                <p className="text-muted-foreground">
                  Fyll i dina kontaktuppgifter nedan för att kunna publicera lokaler och ta emot förfrågningar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Status Indicator - show for existing users or when complete */}
        {(!isNewUser || isFormValid) && (
          isFormValid ? (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Profil komplett</span>
              <span className="text-green-600 dark:text-green-400">– du kan publicera lokaler</span>
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Profil ej komplett</span>
              <span className="text-destructive/80">– fyll i obligatoriska uppgifter för att kunna publicera lokaler</span>
            </div>
          )
        )}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Min profil</h1>
            <p className="text-muted-foreground">Hantera dina kontakt- och företagsuppgifter</p>
          </div>
          
          {/* Auto-save indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isAutoSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sparar...</span>
              </>
            ) : lastSaved ? (
              <>
                <Cloud className="h-4 w-4 text-green-500" />
                <span>Sparad</span>
              </>
            ) : hasChanges ? (
              <>
                <CloudOff className="h-4 w-4" />
                <span>Osparade ändringar</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main form - 2 columns */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal" className="gap-2">
                    <User className="h-4 w-4" />
                    Personuppgifter
                  </TabsTrigger>
                  <TabsTrigger value="company" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Företagsprofil
                  </TabsTrigger>
                </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Kontaktuppgifter
                  </CardTitle>
                  <CardDescription>
                    Fält markerade med * måste fyllas i för att kunna publicera lokaler och ta emot förfrågningar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="display_name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Kontaktperson<span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="display_name"
                        placeholder="Ditt namn"
                        value={formData.display_name}
                        onChange={(e) =>
                          setFormData({ ...formData, display_name: e.target.value })
                        }
                        onBlur={() => setTouched(prev => ({ ...prev, display_name: true }))}
                        className={getFieldError("display_name") ? "border-destructive" : ""}
                      />
                      {getFieldError("display_name") && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {getFieldError("display_name")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Telefon<span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="070-123 45 67"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                        className={getFieldError("phone") ? "border-destructive" : ""}
                      />
                      {getFieldError("phone") && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {getFieldError("phone")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      E-post<span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="din@email.se"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      className={getFieldError("email") ? "border-destructive" : ""}
                    />
                    {getFieldError("email") && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError("email")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_title" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Befattning
                    </Label>
                    <Input
                      id="contact_title"
                      placeholder="T.ex. Uthyrningsansvarig"
                      value={formData.contact_title}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_title: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Profile Tab */}
            <TabsContent value="company">
              <div className="space-y-6">
                {/* Logo & Company Name */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Företagsinformation
                    </CardTitle>
                    <CardDescription>
                      Fält markerade med * måste fyllas i för att kunna publicera lokaler och ta emot förfrågningar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <Label>Företagslogotyp</Label>
                      <p className="text-xs text-muted-foreground">
                        Visas tillsammans med dina annonser. PNG, JPG eller SVG. Max 2 MB. Rekommenderad storlek: 400×120 px.
                      </p>
                      <LogoUpload
                        value={formData.company_logo}
                        onChange={(url) => setFormData(prev => ({ ...prev, company_logo: url }))}
                        onUpload={uploadLogo}
                        isUploading={isUploadingLogo}
                      />
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company_name" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Företagsnamn<span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="company_name"
                          placeholder="AB Fastigheter"
                          value={formData.company_name}
                          onChange={(e) =>
                            setFormData({ ...formData, company_name: e.target.value })
                          }
                          onBlur={() => setTouched(prev => ({ ...prev, company_name: true }))}
                          className={getFieldError("company_name") ? "border-destructive" : ""}
                        />
                        {getFieldError("company_name") && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError("company_name")}
                          </p>
                        )}
                      </div>

                    </div>


                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Adress
                    </CardTitle>
                    <CardDescription>
                      Fält markerade med * måste fyllas i för att kunna publicera lokaler och ta emot förfrågningar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Gatuadress<span className="text-destructive">*</span></Label>
                      <Input
                        id="address"
                        placeholder="Storgatan 1"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                        className={getFieldError("address") ? "border-destructive" : ""}
                      />
                      {getFieldError("address") && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {getFieldError("address")}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postnummer<span className="text-destructive">*</span></Label>
                        <Input
                          id="postal_code"
                          placeholder="302 50"
                          value={formData.postal_code}
                          onChange={(e) =>
                            setFormData({ ...formData, postal_code: e.target.value })
                          }
                          onBlur={() => setTouched(prev => ({ ...prev, postal_code: true }))}
                          className={getFieldError("postal_code") ? "border-destructive" : ""}
                        />
                        {getFieldError("postal_code") && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError("postal_code")}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Ort<span className="text-destructive">*</span></Label>
                        <Input
                          id="city"
                          placeholder="Halmstad"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          onBlur={() => setTouched(prev => ({ ...prev, city: true }))}
                          className={getFieldError("city") ? "border-destructive" : ""}
                        />
                        {getFieldError("city") && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError("city")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
              </Tabs>

              {/* Save Button - only visible when there are changes */}
              {hasChanges && (
                <div className="mt-6 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSaving} 
                    size="default" 
                    className={`gap-2 ${isFormValid ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}`}
                  >
                    <Save className="h-4 w-4" strokeWidth={1} />
                    {isSaving ? "Sparar..." : "Spara ändringar"}
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Preview column */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="lg:sticky lg:top-8">
              <ProfilePreviewCard 
                data={{
                  contactName: formData.display_name,
                  contactTitle: formData.contact_title,
                  email: formData.email,
                  phone: formData.phone,
                  companyName: formData.company_name,
                  companyLogo: formData.company_logo,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
