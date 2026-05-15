'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Building2, 
  MapPin, 
  FileText, 
  Image as ImageIcon,
  Eye,
  ExternalLink,
  Inbox,
  Save,
  Clock,
  AlertCircle,
  User,
  CloudOff,
  Cloud,
  Loader2,
  AlertTriangle,
  HelpCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreateListing, useUpdateListing, useListings, type Listing, type ListingStatus } from "@/hooks/useListings";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageUpload } from "./ImageUpload";
import { DocumentUpload } from "./DocumentUpload";
import { ListingPreview } from "./ListingPreview";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { AddressMapPreview } from "./AddressMapPreview";
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
import { useRouter, useSearchParams } from "next/navigation";

const STORAGE_KEY = "listing-wizard-draft";

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

interface WizardStep {
  id: string;
  title: string;
  mobileTitle: string;
  description: string;
  mobileDescription: string;
  icon: React.ElementType;
}

const steps: WizardStep[] = [
  { 
    id: "type", 
    title: "Typ", 
    mobileTitle: "Typ av lokal",
    description: "Välj lokaltyp", 
    mobileDescription: "Välj kategori så rätt företag hittar dig",
    icon: Building2 
  },
  { 
    id: "location", 
    title: "Adress", 
    mobileTitle: "Adress",
    description: "Var ligger lokalen?", 
    mobileDescription: "Visas på karta och i lokala sökningar",
    icon: MapPin 
  },
  { 
    id: "details", 
    title: "Detaljer", 
    mobileTitle: "Om lokalen",
    description: "Yta och beskrivning", 
    mobileDescription: "Kort och tydlig info ger bättre förfrågningar",
    icon: FileText 
  },
  { 
    id: "images", 
    title: "Bilder", 
    mobileTitle: "Bilder",
    description: "Ladda upp bilder", 
    mobileDescription: "Bilder ökar intresset – lägg till nu eller senare",
    icon: ImageIcon 
  },
];

export function ListingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const { data: existingListings } = useListings();
  const { data: profileData } = useProfileCompletion();
  const isMobile = useIsMobile();
  
  const basePath = location.pathname.startsWith("/admin") ? "/admin/lokaler" : "/app/lokaler";
  const isProfileIncomplete = profileData && !profileData.isComplete;
  const isPendingApproval = profileData && profileData.isComplete && !profileData.isApproved;
  
  // Check if this is the user's first listing (no existing listings before this one)
  const isFirstListing = !existingListings || existingListings.length === 0;

  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPendingSuccess, setIsPendingSuccess] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [isAddressValidated, setIsAddressValidated] = useState(false);
  const [showAddressWarning, setShowAddressWarning] = useState(false);
  
  // Auto-save state
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const [formData, setFormData] = useState<Partial<Listing>>(() => {
    // Auto-restore from localStorage disabled - uncomment to re-enable
    // try {
    //   const saved = localStorage.getItem(STORAGE_KEY);
    //   if (saved) {
    //     const parsed = JSON.parse(saved);
    //     if (parsed.formData && parsed.timestamp) {
    //       // Only restore if less than 24 hours old
    //       const age = Date.now() - parsed.timestamp;
    //       if (age < 24 * 60 * 60 * 1000) {
    //         return parsed.formData;
    //       }
    //     }
    //   }
    // } catch (e) {
    //   console.error("Failed to restore draft from localStorage:", e);
    // }
    
    return {
      titel: "",
      adress: "",
      stad: "Halmstad",
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
      status: "draft" as ListingStatus,
      market: "",
      city_id: "halmstad",
      is_address_validated: false,
    };
  });

  // Auto-save to localStorage disabled - uncomment to re-enable
  // useEffect(() => {
  //   if (saveTimeoutRef.current) {
  //     clearTimeout(saveTimeoutRef.current);
  //   }
  //   
  //   saveTimeoutRef.current = setTimeout(() => {
  //     try {
  //       localStorage.setItem(STORAGE_KEY, JSON.stringify({
  //         formData,
  //         timestamp: Date.now()
  //       }));
  //     } catch (e) {
  //       console.error("Failed to save draft to localStorage:", e);
  //     }
  //   }, 500);
  //
  //   return () => {
  //     if (saveTimeoutRef.current) {
  //       clearTimeout(saveTimeoutRef.current);
  //     }
  //   };
  // }, [formData]);

  // Clear localStorage on successful publish
  const clearLocalDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear draft from localStorage:", e);
    }
  }, []);

  // Check if form has unsaved changes (dirty state)
  const isDirty = useMemo(() => {
    // Form is dirty if any significant field has been filled in
    return Boolean(
      formData.typ ||
      formData.titel?.trim() ||
      formData.adress?.trim() ||
      formData.beskrivning_kort?.trim() ||
      formData.beskrivning_lang?.trim() ||
      formData.area_sqm ||
      formData.hyra_per_m2_ar ||
      (formData.bilder && formData.bilder.length > 0) ||
      (formData.dokument && formData.dokument.length > 0)
    );
  }, [formData]);

  // Navigation-blocking (useBlocker) removed because the app uses BrowserRouter.
  // We still warn on tab close/refresh via beforeunload and confirm on explicit cancel/back actions.


  // Warn before closing/refreshing the browser
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !showSuccess) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, showSuccess]);

  // Handle cancel navigation with confirmation
  const handleCancelClick = () => {
    if (isDirty) {
      setShowLeaveDialog(true);
      setPendingNavigation(() => () => router.push(basePath));
    } else {
      router.push(basePath);
    }
  };

  // Confirm leaving (proceed with navigation)
  const confirmLeave = () => {
    clearLocalDraft();
    setShowLeaveDialog(false);
    pendingNavigation?.();
  };

  // Cancel leaving (stay on page)
  const cancelLeave = () => {
    setShowLeaveDialog(false);
    setPendingNavigation(null);
  };

  const handleChange = (field: keyof Listing, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleType = (typ: string) => {
    // Use pipe separator to avoid issues with commas in category names like "Skola, vård & omsorg"
    const separator = " | ";
    const selectedTypes = formData.typ ? formData.typ.split(separator).filter(t => t) : [];
    let newTypes: string[];
    if (selectedTypes.includes(typ)) {
      newTypes = selectedTypes.filter((t) => t !== typ);
    } else {
      newTypes = [...selectedTypes, typ];
    }
    handleChange("typ", newTypes.join(separator));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Type
        const selectedTypes = formData.typ ? formData.typ.split(" | ").filter(t => t) : [];
        if (selectedTypes.length === 0) {
          toast.error("Välj minst en kategori");
          return false;
        }
        return true;
      case 1: // Location
        if (!formData.city_id) {
          toast.error("Välj vilken stad lokalen finns i");
          return false;
        }
        if (!isAddressValidated) {
          setShowAddressWarning(true);
          toast.error("Välj en giltig adress från förslagen");
          return false;
        }
        setShowAddressWarning(false);
        return true;
      case 2: // Details
        if (!formData.titel?.trim()) {
          toast.error("Ange en titel för lokalen");
          return false;
        }
        return true;
      case 3: // Images
        return true;
      default:
        return true;
    }
  };

  // Auto-save to database as draft
  const autoSave = useCallback(async () => {
    // Don't auto-save if we don't have minimum required data
    if (!formData.typ) return;
    
    setSaveStatus('saving');
    setIsSaving(true);
    
    try {
      if (savedDraftId) {
        // Update existing draft
        await updateListing.mutateAsync({ 
          id: savedDraftId, 
          ...formData, 
          status: "draft" 
        });
      } else {
        // Create new draft
        const result = await createListing.mutateAsync({ 
          ...formData, 
          status: "draft" 
        });
        setSavedDraftId(result.id);
      }
      
      setLastSavedAt(new Date());
      setSaveStatus('saved');
      
      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus('error');
      // Reset to idle after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [formData, savedDraftId, createListing, updateListing]);

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        // Auto-save disabled - uncomment to re-enable
        // autoSave();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = () => {
    // Check profile completion first - block if incomplete
    if (isProfileIncomplete) {
      toast.error("Slutför din annonsörsprofil för att kunna publicera");
      return;
    }

    // Check address validation - require Google-validated address for publishing
    if (!isAddressValidated) {
      toast.error("Välj en giltig adress från förslagen för att kunna publicera");
      return;
    }
    
    // If advertiser is pending approval, use pending_approval status
    // The database trigger will also enforce this, but we set it here for immediate UI feedback
    const publishStatus: ListingStatus = isPendingApproval ? "pending_approval" : "published";
    
    // If we have a saved draft, update it; otherwise create new
    if (savedDraftId) {
      updateListing.mutate({ id: savedDraftId, ...formData, status: publishStatus }, {
        onSuccess: () => {
          clearLocalDraft();
          setCreatedListingId(savedDraftId);
          setIsPendingSuccess(!!isPendingApproval);
          setShowSuccess(true);
        },
      });
    } else {
      createListing.mutate({ ...formData, status: publishStatus }, {
        onSuccess: (data) => {
          clearLocalDraft();
          setCreatedListingId(data.id);
          setIsPendingSuccess(!!isPendingApproval);
          setShowSuccess(true);
        },
      });
    }
  };

  const handleSaveAsDraft = () => {
    if (savedDraftId) {
      updateListing.mutate({ id: savedDraftId, ...formData, status: "draft" }, {
        onSuccess: () => {
          clearLocalDraft();
          toast.success("Lokalen sparad");
          router.push(basePath); // Redirect to listings list
        },
      });
    } else {
      createListing.mutate({ ...formData, status: "draft" }, {
        onSuccess: () => {
          clearLocalDraft();
          toast.success("Lokalen sparad");
          router.push(basePath); // Redirect to listings list
        },
      });
    }
  };

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 10) return "just nu";
    if (diffSecs < 60) return `${diffSecs} sek sedan`;
    if (diffMins < 60) return `${diffMins} min sedan`;
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  };

  const selectedTypes = formData.typ ? formData.typ.split(" | ").filter(t => t) : [];

  // Success screen after publishing
  if (showSuccess && createdListingId) {
    // For first listing, redirect to profile page
    if (isFirstListing) {
      return (
        <section className="flex-1 px-4 md:px-8 py-6 overflow-auto">
          <div className="max-w-lg mx-auto text-center py-10 md:py-16">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6">
              <Check className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            
            <h1 className="text-xl md:text-2xl font-medium text-foreground mb-2 md:mb-3">
              {isPendingSuccess ? "Din lokal väntar på godkännande" : "Din lokal är skapad!"}
            </h1>
            
            <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
              {isPendingSuccess 
                ? "Nästa steg: Slutför din profil så att företag kan kontakta dig."
                : "Nästa steg: Slutför din profil så att företag kan kontakta dig."
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
              <Button 
                onClick={() => router.push("/app/profil")}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                Slutför profil
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push(`${basePath}/${createdListingId}`)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Visa annons
              </Button>
            </div>
          </div>
        </section>
      );
    }
    
    // Different messaging for pending vs approved advertisers (not first listing)
    if (isPendingSuccess) {
      return (
        <section className="flex-1 px-4 md:px-8 py-6 overflow-auto">
          <div className="max-w-lg mx-auto text-center py-10 md:py-16">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6">
              <Clock className="w-8 h-8 md:w-10 md:h-10 text-amber-600 dark:text-amber-400" />
            </div>
            
            <h1 className="text-xl md:text-2xl font-medium text-foreground mb-2 md:mb-3">
              Din lokal väntar på godkännande
            </h1>
            
            <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
              Din lokal är skapad men visas inte publikt ännu. En administratör behöver först godkänna ditt konto. Du får besked när lokalen är live.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
              <Button 
                onClick={() => router.push(`${basePath}/${createdListingId}`)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Visa annons
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/app")}
                className="gap-2"
              >
                Till dashboard
              </Button>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="flex-1 px-4 md:px-8 py-6 overflow-auto">
        <div className="max-w-lg mx-auto text-center py-10 md:py-16">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6">
            <Check className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </div>
          
          <h1 className="text-xl md:text-2xl font-medium text-foreground mb-2 md:mb-3">
            Din lokal är nu publicerad
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
            Lokalen visas nu för företag som söker lokal i området.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
            <Button 
              onClick={() => router.push(`${basePath}/${createdListingId}`)}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Visa annons
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/app")}
              className="gap-2"
            >
              <Inbox className="w-4 h-4" />
              Till mina leads
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 py-8 md:py-16 overflow-auto">
      {/* Centered container - Apple-style narrow focus */}
      <div className="w-full max-w-[600px] mx-auto px-4 md:px-6">
        
        {/* Minimal step indicator - centered */}
        <div className="mb-10 md:mb-14">
          {/* Desktop: Simple text-based steps */}
          <div className="hidden md:flex items-center justify-center gap-6">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center gap-6">
                  <button
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isCompleted && "text-primary cursor-pointer",
                      isActive && "text-foreground",
                      !isActive && !isCompleted && "text-muted-foreground/50"
                    )}
                  >
                    {step.title}
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-6 h-px",
                      index < currentStep ? "bg-primary" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Mobile: Minimal progress dots */}
          <div className="md:hidden flex flex-col items-center">
            <div className="flex gap-2 mb-3">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentStep ? "bg-primary" : 
                    index < currentStep ? "bg-primary/40" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentStep + 1} / {steps.length}
            </p>
          </div>
        </div>

        {/* Auto-save indicator - subtle, top right */}
        {(saveStatus !== 'idle' || lastSavedAt) && (
          <div className="flex justify-end mb-4">
            <div className={cn(
              "flex items-center gap-1.5 text-xs transition-opacity duration-300",
              saveStatus === 'saving' && "text-muted-foreground",
              saveStatus === 'saved' && "text-emerald-600 dark:text-emerald-400",
              saveStatus === 'error' && "text-red-600 dark:text-red-400",
              saveStatus === 'idle' && lastSavedAt && "text-muted-foreground/50"
            )}>
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Sparar</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Cloud className="w-3 h-3" />
                  <span>Sparat</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <CloudOff className="w-3 h-3" />
                  <span>Misslyckades</span>
                </>
              )}
              {saveStatus === 'idle' && lastSavedAt && (
                <>
                  <Cloud className="w-3 h-3" />
                  <span>{formatLastSaved(lastSavedAt)}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step content - generous whitespace with smooth transitions */}
        <div className="min-h-[400px] md:min-h-[480px]">
          {/* Step 1: Type - Single decision, minimal */}
          {currentStep === 0 && (
            <div key="step-1" className="space-y-8 md:space-y-10 animate-fade-in">
              {/* Heading with helper text */}
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Vad vill du annonsera?
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Välj den eller de kategorier som bäst beskriver lokalen.
                </p>
              </div>
              
              {/* Clean selection list in a card - touch optimized */}
              <div className="bg-muted/30 rounded-xl p-4 md:p-6 border border-border/50">
                <h3 className="text-sm font-semibold text-foreground mb-4">Lokaltyper</h3>
                <div className="space-y-2">
                  {lokaltypOptions.map((typ) => {
                    const isSelected = selectedTypes.includes(typ);
                    return (
                      <button
                        key={typ}
                        type="button"
                        onClick={() => toggleType(typ)}
                        className={cn(
                          "w-full min-h-[52px] py-3 px-4 rounded-lg text-left transition-all active:scale-[0.98]",
                          isSelected
                            ? "bg-primary/10 ring-2 ring-primary"
                            : "bg-background hover:bg-muted/50 active:bg-muted/70"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-base font-medium",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {typ}
                          </span>
                          {isSelected && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location - Apple/Objektvision minimal style */}
          {currentStep === 1 && (
            <div key="step-2" className="space-y-8 md:space-y-10 animate-fade-in">
              {/* Heading with helper text */}
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Var ligger lokalen?
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Ange adressen eller området där lokalen är belägen.
                </p>
              </div>

              {/* Address section in a card */}
              <div className="bg-muted/30 rounded-xl p-5 md:p-6 border border-border/50">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Adress</h3>
                
                {/* Address state: either search input OR confirmed address display */}
                {!isAddressValidated ? (
                  /* Search state - single input, no label */
                  <div className="space-y-3">
                    <AddressAutocomplete
                      value={formData.adress || ""}
                      onChange={(result) => {
                        handleChange("adress", result.address);
                        handleChange("postnummer", result.postalCode);
                        handleChange("stad", result.city || "Halmstad");
                        handleChange("koordinater_lat", result.latitude);
                        handleChange("koordinater_lng", result.longitude);
                        handleChange("is_address_validated", result.isValidated);
                        setIsAddressValidated(result.isValidated);
                        if (result.isValidated) {
                          setShowAddressWarning(false);
                        }
                      }}
                      placeholder="Sök adress…"
                      isValidated={isAddressValidated}
                      showWarning={showAddressWarning}
                    />
                    {showAddressWarning && (
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        Välj en adress från förslagen
                      </p>
                    )}
                  </div>
                ) : (
                  /* Confirmed state - clean text display with animation */
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-start gap-3 bg-background rounded-lg p-4 border border-border/50">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-base font-medium text-foreground">
                          {formData.adress}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formData.postnummer} {formData.stad || "Halmstad"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Change address link - touch optimized */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddressValidated(false);
                        handleChange("is_address_validated", false);
                      }}
                      className="min-h-[44px] py-2 px-1 text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors underline underline-offset-2"
                    >
                      Ändra adress
                    </button>

                    {/* Small, muted map - confirmation only */}
                    {formData.koordinater_lat && formData.koordinater_lng && (
                      <div className="pt-2">
                        <AddressMapPreview
                          address={formData.adress || ""}
                          postalCode={formData.postnummer || undefined}
                          city={formData.stad || "Halmstad"}
                          latitude={formData.koordinater_lat}
                          longitude={formData.koordinater_lng}
                          minimal
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Details - Clean, focused fields with visual grouping */}
          {currentStep === 2 && (
            <div key="step-3" className="space-y-8 md:space-y-10 animate-fade-in">
              {/* Single heading */}
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                Berätta om lokalen
              </h2>

              {/* Group 1: Titel - primary field */}
              <div className="bg-muted/30 rounded-xl p-5 md:p-6 border border-border/50 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Rubrik för annonsen</h3>
                <Input
                  id="titel"
                  value={formData.titel || ""}
                  onChange={(e) => handleChange("titel", e.target.value)}
                  placeholder="Ange rubrik"
                  className={cn(
                    "text-lg h-12 bg-background",
                    (formData.titel?.length || 0) > 80 && "border-amber-500 focus-visible:ring-amber-500"
                  )}
                />
                {(formData.titel?.length || 0) > 80 && (
                  <p className="text-xs text-amber-600">Kortare titel rekommenderas</p>
                )}
              </div>

              {/* Group 2: Specifikationer - Yta och Hyra */}
              <div className="bg-muted/30 rounded-xl p-5 md:p-6 border border-border/50 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Specifikationer</h3>
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {/* Yta */}
                  <div className="space-y-2">
                    <Label>Yta</Label>
                    <div className="relative">
                      <Input
                        id="area_sqm"
                        type="number"
                        inputMode="numeric"
                        value={formData.area_sqm || ""}
                        onChange={(e) => handleChange("area_sqm", e.target.value ? Number(e.target.value) : null)}
                        placeholder="150"
                        className="text-base pr-12 h-12 bg-background"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        m²
                      </span>
                    </div>
                  </div>

                  {/* Hyra */}
                  <div className="space-y-2">
                    <div>
                      <Label>Hyra</Label>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">Ange hyra eller välj "På förfrågan".</p>
                    </div>
                    {formData.hyra_per_m2_ar === null ? (
                      <button
                        type="button"
                        onClick={() => handleChange("hyra_per_m2_ar", 0)}
                        className="w-full h-12 rounded-md border border-border bg-background text-sm text-muted-foreground hover:bg-muted/50 active:bg-muted/70 active:scale-[0.98] transition-all"
                      >
                        På förfrågan
                      </button>
                    ) : (
                      <div className="relative">
                        <Input
                          id="hyra_per_m2_ar"
                          type="number"
                          inputMode="numeric"
                          value={formData.hyra_per_m2_ar || ""}
                          onChange={(e) => handleChange("hyra_per_m2_ar", e.target.value ? Number(e.target.value) : null)}
                          placeholder="1 450"
                          className="text-base pr-20 h-12 bg-background"
                          autoFocus
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          kr/m²/år
                        </span>
                      </div>
                    )}
                    {formData.hyra_per_m2_ar !== null && (
                      <button
                        type="button"
                        onClick={() => handleChange("hyra_per_m2_ar", null)}
                        className="min-h-[36px] py-1.5 text-xs text-muted-foreground hover:text-foreground active:text-foreground underline underline-offset-2"
                      >
                        Dölj hyra
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Group 3: Beskrivningar */}
              <div className="bg-muted/30 rounded-xl p-5 md:p-6 border border-border/50 space-y-6">
                <h3 className="text-sm font-semibold text-foreground">Beskrivning</h3>
                
                {/* Kort beskrivning */}
                <div className="space-y-2">
                  <div>
                    <Label>Kort beskrivning</Label>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">1–2 meningar som sammanfattar lokalen. Visas i sökresultatet.</p>
                  </div>
                  <Textarea
                    id="beskrivning_kort"
                    value={formData.beskrivning_kort || ""}
                    onChange={(e) => handleChange("beskrivning_kort", e.target.value)}
                    placeholder="Sammanfatta lokalen"
                    rows={2}
                    className={cn(
                      "text-base resize-none bg-background",
                      (formData.beskrivning_kort?.length || 0) > 200 && "border-amber-500"
                    )}
                  />
                </div>

                {/* Detaljerad beskrivning */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <div>
                    <Label>Utförlig beskrivning</Label>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Beskriv lokalen kort och sakligt. Ange till exempel planlösning, användning idag, tillgänglighet och eventuella anpassningsmöjligheter.</p>
                  </div>
                  <RichTextEditor
                    value={formData.beskrivning_lang || ""}
                    onChange={(value) => handleChange("beskrivning_lang", value)}
                    placeholder="Beskriv lokalen"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Images - Final step, clean and conclusive */}
          {currentStep === 3 && (
            <div key="step-4" className="space-y-8 md:space-y-10 animate-fade-in">
              {/* Single heading */}
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Lägg till bilder
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Bilder gör din annons mer attraktiv och ger fler förfrågningar.
                </p>
              </div>

              {/* Images section in a card */}
              <div className="bg-muted/30 rounded-xl p-5 md:p-6 border border-border/50">
                <h3 className="text-sm font-semibold text-foreground mb-4">Bilder</h3>
                <ImageUpload
                  images={formData.bilder || []}
                  onChange={(images) => handleChange("bilder", images)}
                />

                {/* Image count indicator */}
                {(formData.bilder?.length || 0) > 0 && (
                  <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/30">
                    {formData.bilder?.length} {formData.bilder?.length === 1 ? 'bild' : 'bilder'} uppladdade
                  </p>
                )}
              </div>

              {/* Documents section - optional */}
              <div className="bg-muted/30 rounded-xl p-5 md:p-6 border border-border/50">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-foreground">Lägg till ritningar och dokument (valfritt)</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ritningar och dokument kan ge intressenter en tydligare bild av lokalen och underlätta dialogen inför en förfrågan.
                  </p>
                </div>
                <DocumentUpload
                  documents={formData.dokument || []}
                  onChange={(docs) => handleChange("dokument", docs)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation - touch optimized with larger targets */}
        <div className="flex items-center justify-between mt-12 md:mt-16 pt-6 border-t border-border/50">
          {/* Back/Cancel - touch optimized */}
          <button
            type="button"
            onClick={currentStep === 0 ? handleCancelClick : prevStep}
            className="min-h-[44px] py-3 px-2 -mx-2 text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{currentStep === 0 ? "Avbryt" : "Tillbaka"}</span>
          </button>

          {/* Primary actions */}
          <div className="flex items-center gap-2">
            {/* Förhandsgranska - always visible on last step */}
            {currentStep === steps.length - 1 && (
              <ListingPreview 
                listing={formData}
                trigger={
                  <Button variant="outline" size="lg" className="gap-2 min-h-[48px]">
                    <Eye className="w-5 h-5" />
                    <span className="hidden sm:inline">Förhandsgranska</span>
                    <span className="sm:hidden">Visa</span>
                  </Button>
                }
              />
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} size="lg" className="gap-2 px-6 min-h-[48px] active:scale-[0.98]">
                Nästa
                <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <>
                {/* Primary action: Spara lokal */}
                <Button 
                  onClick={handleSaveAsDraft}
                  size="lg"
                  disabled={createListing.isPending || updateListing.isPending}
                  className="gap-2 px-6 min-h-[48px] active:scale-[0.98]"
                >
                  <Save className="w-5 h-5" />
                  {(createListing.isPending || updateListing.isPending) ? "Sparar..." : "Spara lokal"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation dialog when leaving with unsaved changes */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <AlertDialogTitle>Lämna utan att spara?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Du har osparade ändringar som kommer att försvinna om du lämnar sidan. 
              Vill du spara som utkast innan du lämnar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={cancelLeave}>
              Stanna kvar
            </AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={() => {
                handleSaveAsDraft();
                setShowLeaveDialog(false);
              }}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Spara som utkast
            </Button>
            <AlertDialogAction 
              onClick={confirmLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Lämna utan att spara
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

