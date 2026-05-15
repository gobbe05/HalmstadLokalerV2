'use client'
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Trash2, Eye, EyeOff, Clock, ExternalLink, Upload, MoreVertical, Inbox, ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateSlug } from "@/types/property";
import { useListing, useCreateListing, useUpdateListing, useDeleteListing, type Listing, type ListingStatus } from "@/hooks/useListings";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { Switch } from "@/components/ui/switch";
import { useListingEvents } from "@/hooks/useListingEvents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImageUpload } from "./ImageUpload";
import { DocumentUpload } from "./DocumentUpload";
import { ListingPreview } from "./ListingPreview";
import { ListingLeadsInbox } from "./ListingLeadsInbox";
import { CitySelect } from "./CitySelect";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { AddressMapPreview } from "./AddressMapPreview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLeads } from "@/hooks/useLeads";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import router from "next/dist/shared/lib/router/router";

const statusOptions: { value: ListingStatus; label: string }[] = [
  { value: "draft", label: "Utkast" },
  { value: "published", label: "Publicerad" },
];

const lokaltypOptions = [
  "Butiker",
  "Industrier & verkstäder",
  "Kontor",
  "Kontorshotell & coworking",
  "Lager & logistik",
  "Restauranger & caféer",
  "Skola, vård & omsorg",
  "Övrigt",
];

export function ListingForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const pathname = usePathname();
  const isNew = id === "new" || id === "ny";
  
  const basePath = pathname.startsWith("/admin") ? "/admin/lokaler" : "/app/lokaler";
  const isAdminRoute = pathname.startsWith("/admin");

  const { data: listing, isLoading } = useListing(isNew ? undefined : id);
  const { data: events } = useListingEvents(isNew ? undefined : id);
  const { data: profileData } = useProfileCompletion();
  const { data: leads } = useLeads(isNew ? undefined : id);
  const leadsBasePath = location.pathname.startsWith("/admin") ? "/admin/leads" : "/app/leads";
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  
  // Profile status checks (only for advertiser routes)
  const isProfileIncomplete = !isAdminRoute && profileData && !profileData.isComplete;
  const isPendingApproval = !isAdminRoute && profileData && profileData.isComplete && !profileData.isApproved;

  const [showDelete, setShowDelete] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [isAddressValidated, setIsAddressValidated] = useState(false);
  const [showAddressWarning, setShowAddressWarning] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Listing>>({
    titel: "",
    adress: "",
    stad: "",
    postnummer: "",
    kommun: "",
    typ: "",
    area_sqm: null,
    hyra_per_m2_ar: null,
    beskrivning_kort: "",
    beskrivning_lang: "",
    koordinater_lat: null,
    koordinater_lng: null,
    bilder: [],
    dokument: [],
    status: "draft",
    market: "",
    city_id: null,
    is_prelisting: false,
    is_address_validated: false,
  });

  useEffect(() => {
    if (listing) {
      setFormData(listing);
      // Use the stored validation status from database
      setIsAddressValidated(listing.is_address_validated || false);
    }
  }, [listing]);

  const handleChange = (field: keyof Listing, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  // Check if listing has required fields for publishing
  const hasRequiredFields = Boolean(
    formData.adress?.trim() &&
    formData.beskrivning_kort?.trim() &&
    formData.beskrivning_lang?.trim() &&
    formData.bilder && formData.bilder.length > 0 &&
    formData.area_sqm && formData.area_sqm > 0
  );
  
  // Check if listing can be published
  const canPublish = !isProfileIncomplete && isAddressValidated && hasRequiredFields;
  const isPublished = formData.status === "published";
  const isDraft = formData.status === "draft";
  const isPendingApprovalStatus = formData.status === "pending_approval";

  // Helper to check and mark missing required fields for publishing
  const validateRequiredFields = () => {
    const errors: Record<string, boolean> = {};
    
    if (!isAddressValidated || !formData.adress?.trim()) errors.adress = true;
    if (!formData.beskrivning_kort?.trim()) errors.beskrivning_kort = true;
    if (!formData.beskrivning_lang?.trim()) errors.beskrivning_lang = true;
    if (!formData.bilder || formData.bilder.length === 0) errors.bilder = true;
    if (!formData.area_sqm || formData.area_sqm <= 0) errors.area_sqm = true;
    if (!formData.typ?.trim()) errors.typ = true;
    
    return errors;
  };

  // Helper to parse types - supports both " | " and ", " separators for backwards compatibility
  const parseTypes = (typString: string | null): string[] => {
    if (!typString) return [];
    // Use pipe separator if present, otherwise fall back to comma
    const separator = typString.includes(" | ") ? " | " : ", ";
    return typString.split(separator).filter(t => t.trim());
  };

  const handleSave = () => {
    const selectedTypes = parseTypes(formData.typ);
    if (selectedTypes.length === 0) {
      setFieldErrors(prev => ({ ...prev, typ: true }));
      toast.error("Du måste välja minst en lokaltyp");
      return;
    }

    if (!formData.city_id) {
      toast.error("Du måste välja en stad");
      return;
    }

    // Check for missing required fields and show them visually
    const errors = validateRequiredFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
    }

    if (isNew) {
      createListing.mutate(formData, {
        onSuccess: () => {
          // Show warning about missing fields for publishing
          const missingCount = Object.keys(errors).length;
          if (missingCount > 0) {
            toast.success("Sparat som utkast", {
              description: `${missingCount} obligatoriska fält saknas för publicering. Se markerade fält.`,
            });
          } else {
            toast.success("Sparat");
          }
          router.push(basePath);
        },
      });
    } else if (id) {
      // Save without changing status
      updateListing.mutate({ id, ...formData }, {
        onSuccess: () => {
          if (isPublished) {
            toast.success("Ändringar uppdaterade på hemsidan");
          } else if (isDraft && canPublish) {
            // Show toast with action to publish
            toast.success("Sparat", {
              action: {
                label: "Publicera nu?",
                onClick: () => handlePublish(),
              },
            });
          } else {
            // Show warning about missing fields
            const missingCount = Object.keys(errors).length;
            if (missingCount > 0) {
              toast.success("Sparat som utkast", {
                description: `${missingCount} obligatoriska fält saknas för publicering. Se markerade fält.`,
              });
            } else {
              toast.success("Sparat");
            }
          }
        },
      });
    }
  };

  const handlePublish = () => {
    if (isProfileIncomplete) {
      toast.error("Slutför din annonsörsprofil för att kunna publicera");
      return;
    }
    
    // Use shared validation
    const errors = validateRequiredFields();
    
    if (!isAddressValidated) {
      setShowAddressWarning(true);
      errors.adress = true;
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Objektet är inte redo att publiceras", {
        description: "Minst ett obligatoriskt fält saknas. Scrolla igenom formuläret och fyll i de markerade fälten.",
      });
      return;
    }

    if (!isNew && id) {
      updateListing.mutate({ id, status: "published" }, {
        onSuccess: (data) => {
          if (data && data.status === "pending_approval") {
            toast.info("Din lokal väntar på godkännande");
            setFormData(prev => ({ ...prev, status: "pending_approval" }));
          } else if (data && data.status === "published") {
            toast.success("Lokalen är nu publicerad");
            setFormData(prev => ({ ...prev, status: "published" }));
          }
        }
      });
    }
  };

  const handleUnpublish = () => {
    if (!isNew && id) {
      updateListing.mutate({ id, status: "draft" }, {
        onSuccess: () => {
          toast.success("Lokalen är nu avpublicerad");
          setFormData(prev => ({ ...prev, status: "draft" }));
        }
      });
    }
  };

  const handleDelete = () => {
    if (id) {
      deleteListing.mutate(id, {
        onSuccess: () => {
          router.push(basePath);
        },
      });
    }
    setShowDelete(false);
  };

  if (isLoading && !isNew) {
    return (
      <section className="flex-1 px-4 md:px-8 py-6">
        <div className="text-muted-foreground">Laddar...</div>
      </section>
    );
  }

  return (
    <section className="flex-1 px-4 md:px-8 py-6 overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(basePath)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-medium text-foreground truncate">
            {isNew ? "Nytt objekt" : formData.titel || "Redigera objekt"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Secondary actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <ListingPreview 
                listing={formData}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                    <Eye className="w-4 h-4 mr-2" />
                    Förhandsgranska
                  </DropdownMenuItem>
                }
              />
              {!isNew && formData.status === "published" && (
                <DropdownMenuItem 
                  onClick={() => {
                    if (id) {
                      const slug = generateSlug(
                        formData.adress || '',
                        formData.typ || '',
                        formData.area_sqm || 0,
                        id
                      );
                      window.open(`/lokal/${slug}`, '_blank');
                    }
                  }}
                  className="cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visa på hemsidan
                </DropdownMenuItem>
              )}
              {!isNew && isPublished && !isAdminRoute && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowUnpublishConfirm(true)}
                    className="cursor-pointer text-amber-600 focus:text-amber-600"
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Avpublicera
                  </DropdownMenuItem>
                </>
              )}
              {!isNew && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDelete(true)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Ta bort lokal
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Publish button for drafts */}
          {!isNew && (isDraft || isPendingApprovalStatus) && !isAdminRoute && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePublish}
                      disabled={!canPublish || updateListing.isPending || isPendingApprovalStatus}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">
                        {isPendingApprovalStatus ? "Väntar på godkännande" : "Publicera"}
                      </span>
                      <span className="sm:hidden">
                        {isPendingApprovalStatus ? "Väntar" : "Pub"}
                      </span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isPendingApprovalStatus 
                      ? "Lokalen publiceras automatiskt när ditt konto godkänns"
                      : isProfileIncomplete 
                        ? "Komplettera annonsörsprofil för att kunna publicera" 
                        : "Välj en giltig adress för att kunna publicera"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Primary save button */}
          <Button onClick={handleSave} size="sm" disabled={createListing.isPending || updateListing.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isNew ? "Spara lokal" : "Spara ändringar"}
          </Button>
        </div>
      </div>


      {/* Status Bar for published listings */}
      {!isNew && isPublished && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex-1">
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Publicerad</span>
            <span className="text-sm text-emerald-600 dark:text-emerald-400"> – Synlig för besökare</span>
          </div>
        </div>
      )}

      {formData.status === "pending_approval" && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 mb-6">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">Väntar på godkännande</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Denna lokal är skapad men visas inte publikt ännu. Publicering aktiveras när ditt konto har godkänts.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h2 className="text-base font-medium mb-4">Grunduppgifter</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titel">Titel <span className="text-destructive">*</span></Label>
                <Input
                  id="titel"
                  value={formData.titel || ""}
                  onChange={(e) => handleChange("titel", e.target.value)}
                  placeholder="T.ex. Kontor vid hamnen"
                />
              </div>

              {/* Lokaltyp moved to Advanced Settings for existing listings, show here for new */}
              {isNew && (
                <div>
                  <Label className={fieldErrors.typ ? "text-destructive" : ""}>Lokaltyp <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal">(välj en eller flera)</span></Label>
                  <div className={`mt-2 flex flex-wrap gap-2 p-2 rounded-md ${fieldErrors.typ ? "ring-2 ring-destructive bg-destructive/5" : ""}`}>
                    {lokaltypOptions.map((typ) => {
                      const selectedTypes = parseTypes(formData.typ);
                      const isSelected = selectedTypes.includes(typ);
                      return (
                        <button
                          key={typ}
                          type="button"
                          onClick={() => {
                            let newTypes: string[];
                            if (isSelected) {
                              newTypes = selectedTypes.filter((t) => t !== typ);
                            } else {
                              newTypes = [...selectedTypes, typ];
                            }
                            handleChange("typ", newTypes.join(" | "));
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {typ}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.typ && <p className="text-sm text-destructive mt-1">Välj minst en lokaltyp</p>}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <CitySelect
                  value={formData.city_id}
                  onChange={(value) => handleChange("city_id", value)}
                  label={<>Stad <span className="text-destructive">*</span></>}
                />
                <div>
                  <Label htmlFor="area_sqm" className={fieldErrors.area_sqm ? "text-destructive" : ""}>Yta (m²) <span className="text-destructive">*</span></Label>
                  <Input
                    id="area_sqm"
                    type="number"
                    value={formData.area_sqm || ""}
                    onChange={(e) => handleChange("area_sqm", e.target.value ? Number(e.target.value) : null)}
                    className={fieldErrors.area_sqm ? "border-destructive ring-1 ring-destructive" : ""}
                  />
                  {fieldErrors.area_sqm && <p className="text-sm text-destructive mt-1">Ange yta</p>}
                </div>
                <div>
                  <Label htmlFor="hyra_per_m2_ar">Hyra (kr/m²/år)</Label>
                  <Input
                    id="hyra_per_m2_ar"
                    type="number"
                    value={formData.hyra_per_m2_ar || ""}
                    onChange={(e) => handleChange("hyra_per_m2_ar", e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h2 className="text-base font-medium mb-4">Adress</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="adress" className={fieldErrors.adress ? "text-destructive" : ""}>Gatuadress <span className="text-destructive">*</span></Label>
                <AddressAutocomplete
                  value={formData.adress || ""}
                  onChange={(result) => {
                    setFormData((prev) => ({
                      ...prev,
                      adress: result.address,
                      postnummer: result.postalCode,
                      stad: result.city || prev.stad,
                      koordinater_lat: result.latitude,
                      koordinater_lng: result.longitude,
                      is_address_validated: result.isValidated,
                    }));
                    setIsAddressValidated(result.isValidated);
                    if (result.isValidated) {
                      setShowAddressWarning(false);
                      setFieldErrors((prev) => ({ ...prev, adress: false }));
                    }
                  }}
                  placeholder="Börja skriva adress..."
                  isValidated={isAddressValidated}
                  showWarning={showAddressWarning || fieldErrors.adress}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postnummer">Postnummer</Label>
                  <Input
                    id="postnummer"
                    value={formData.postnummer || ""}
                    onChange={(e) => handleChange("postnummer", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="stad">Stad</Label>
                  <Input
                    id="stad"
                    value={formData.stad || ""}
                    onChange={(e) => handleChange("stad", e.target.value)}
                  />
                </div>
              </div>
              
              {/* Map preview when address is selected */}
              {formData.adress && (
                <div className="mt-4 pt-4 border-t border-border">
                  <AddressMapPreview
                    address={formData.adress}
                    postalCode={formData.postnummer || undefined}
                    city={formData.stad || undefined}
                    latitude={formData.koordinater_lat}
                    longitude={formData.koordinater_lng}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h2 className="text-base font-medium mb-4">Beskrivning</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="beskrivning_kort" className={fieldErrors.beskrivning_kort ? "text-destructive" : ""}>Kort beskrivning <span className="text-destructive">*</span></Label>
                <Textarea
                  id="beskrivning_kort"
                  value={formData.beskrivning_kort || ""}
                  onChange={(e) => handleChange("beskrivning_kort", e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text/plain');
                    const target = e.target as HTMLTextAreaElement;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const currentValue = formData.beskrivning_kort || "";
                    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
                    handleChange("beskrivning_kort", newValue);
                    // Set cursor position after paste
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = start + text.length;
                    }, 0);
                  }}
                  placeholder="T.ex. Ljust hörnkontor med öppen planlösning i centralt läge nära tågstationen."
                  rows={2}
                  className={fieldErrors.beskrivning_kort ? "border-destructive ring-1 ring-destructive" : ""}
                />
                {fieldErrors.beskrivning_kort && <p className="text-sm text-destructive mt-1">Ange en kort beskrivning</p>}
                
                {/* Live preview of how it looks on the property card */}
              </div>
              <div>
                <Label className={fieldErrors.beskrivning_lang ? "text-destructive" : ""}>Utförlig beskrivning <span className="text-destructive">*</span></Label>
                <div className={fieldErrors.beskrivning_lang ? "ring-1 ring-destructive rounded-md" : ""}>
                  <RichTextEditor
                    value={formData.beskrivning_lang || ""}
                    onChange={(value) => handleChange("beskrivning_lang", value)}
                    placeholder="Beskriv lokalen i detalj: planlösning, utrustning, parkeringsmöjligheter, närhet till kommunikationer, våningsplan, tillgänglighet m.m."
                  />
                </div>
                {fieldErrors.beskrivning_lang && <p className="text-sm text-destructive mt-1">Ange en lång beskrivning</p>}
              </div>
            </div>
          </div>

          <div className={`bg-card border rounded-lg p-4 md:p-6 ${fieldErrors.bilder ? "border-destructive ring-1 ring-destructive" : "border-border"}`}>
            <h2 className={`text-base font-medium mb-4 ${fieldErrors.bilder ? "text-destructive" : ""}`}>Bilder <span className="text-destructive">*</span></h2>
            <ImageUpload
              images={formData.bilder || []}
              onChange={(images) => handleChange("bilder", images)}
              listingId={isNew ? undefined : id}
            />
            {fieldErrors.bilder && <p className="text-sm text-destructive mt-2">Lägg till minst en bild</p>}
          </div>

          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <div className="mb-4">
              <h2 className="text-base font-medium">Ritningar och dokument (valfritt)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ritningar och dokument kan ge intressenter en tydligare bild av lokalen och underlätta dialogen inför en förfrågan.
              </p>
            </div>
            <DocumentUpload
              documents={formData.dokument || []}
              onChange={(docs) => handleChange("dokument", docs)}
              listingId={isNew ? undefined : id}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Compact Leads info row for existing listings */}
          {!isNew && id && (
            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Leads kopplade till lokalen:</span>
                <Badge variant="secondary" className="text-xs">
                  {leads?.length || 0}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push(`${leadsBasePath}?listingId=${id}`)}
                className="text-xs"
              >
                Visa alla
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Advanced settings - collapsible */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Avancerade inställningar</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    Ändringar här kan påverka synlighet
                  </p>
                  
                  {/* Lokaltyp */}
                  <div>
                    <Label className={fieldErrors.typ ? "text-destructive" : ""}>
                      Lokaltyp <span className="text-destructive">*</span>
                      <span className="text-muted-foreground font-normal ml-1">(välj en eller flera)</span>
                    </Label>
                    <div className={`mt-2 flex flex-wrap gap-2 p-2 rounded-md ${fieldErrors.typ ? "ring-2 ring-destructive bg-destructive/5" : ""}`}>
                      {lokaltypOptions.map((typ) => {
                        const selectedTypes = parseTypes(formData.typ);
                        const isSelected = selectedTypes.includes(typ);
                        return (
                          <button
                            key={typ}
                            type="button"
                            onClick={() => {
                              let newTypes: string[];
                              if (isSelected) {
                                newTypes = selectedTypes.filter((t) => t !== typ);
                              } else {
                                newTypes = [...selectedTypes, typ];
                              }
                              handleChange("typ", newTypes.join(" | "));
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {typ}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.typ && <p className="text-sm text-destructive mt-1">Välj minst en lokaltyp</p>}
                  </div>

                  {/* Prelisting toggle */}
                  <div className="border border-dashed border-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <EyeOff className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-sm font-medium">Diskret annonsering</h3>
                          <p className="text-xs text-muted-foreground">
                            Dölj företagsnamn och kontaktuppgifter.
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="is_prelisting" className="text-xs font-medium">
                            Aktivera
                          </Label>
                          <Switch
                            id="is_prelisting"
                            checked={formData.is_prelisting || false}
                            onCheckedChange={(checked) => handleChange("is_prelisting", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort objekt?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta går inte att ångra. Objektet och all relaterad data kommer att tas bort.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto">Ta bort</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish confirmation dialog */}
      <AlertDialog open={showUnpublishConfirm} onOpenChange={setShowUnpublishConfirm}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Avpublicera lokal?</AlertDialogTitle>
            <AlertDialogDescription>
              Lokalen kommer inte längre vara synlig för besökare. Du kan publicera den igen när som helst.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                handleUnpublish();
                setShowUnpublishConfirm(false);
              }} 
              className="w-full sm:w-auto"
            >
              Avpublicera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
