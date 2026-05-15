'use client'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ALL_PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  PropertyType,
} from "@/types/property";
import { supabase } from "@/integrations/supabase/client";

const SIZE_RANGES = [
  { label: "0–100 kvm", value: "0-100", min: 0, max: 100 },
  { label: "100–300 kvm", value: "100-300", min: 100, max: 300 },
  { label: "300–1 000 kvm", value: "300-1000", min: 300, max: 1000 },
  { label: "1 000+ kvm", value: "1000+", min: 1000, max: null },
] as const;

const leadSchema = z.object({
  contact_name: z.string().trim().min(1, "Ange ditt namn").max(100),
  company_name: z.string().trim().min(1, "Ange företagsnamn").max(100),
  email: z.string().trim().email("Ange en giltig e-postadress").max(255),
  phone: z.string().trim().min(1, "Ange telefonnummer").max(30),
  message: z.string().trim().max(1000).optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface MatchingWidgetProps {
  preselectedType?: PropertyType;
  className?: string;
  variant?: "default" | "compact";
}

export function MatchingWidget({ preselectedType, className, variant = "default" }: MatchingWidgetProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>(
    preselectedType ? [preselectedType] : []
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  const toggleType = (type: PropertyType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const canProceed = selectedTypes.length > 0;

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const sizeRange = SIZE_RANGES.find((s) => s.value === selectedSize);

      const { data: result, error } = await supabase.functions.invoke("public-leads", {
        body: {
          contact_name: data.contact_name,
          company_name: data.company_name,
          email: data.email,
          phone: data.phone,
          message: data.message || null,
          lead_type: "matching_widget",
          min_area_sqm: sizeRange?.min ?? null,
          max_area_sqm: sizeRange?.max ?? null,
          preferred_property_types: selectedTypes.join(","),
          preferred_area_range: selectedSize,
        },
      });

      if (error) throw error;

      setStep(3);
      toast({
        title: "Tack för din förfrågan!",
        description: "Vi återkommer med matchande lokaler.",
      });
    } catch (err) {
      console.error("Error submitting matching lead:", err);
      toast({
        title: "Något gick fel",
        description: "Försök igen om en stund.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Success
  if (step === 3) {
    return (
      <div className={cn("bg-card rounded-2xl border border-border p-6 md:p-10 text-center", className)}>
        <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Tack för din förfrågan!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Vi går igenom dina önskemål och återkommer med matchande lokaler inom kort.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-2xl border border-border shadow-soft overflow-hidden", className)}>
      {/* Progress indicator */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-2">
        <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 1 ? "bg-accent" : "bg-muted")} />
        <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 2 ? "bg-accent" : "bg-muted")} />
      </div>

      <div className="p-6 md:p-8">
        {step === 1 && (
          <div>
            <h3 className="text-xl md:text-2xl font-bold mb-1">
              Hittar du inte rätt lokal? Vi hjälper dig med matchning
            </h3>
            <p className="text-muted-foreground mb-6">
              Välj typ och storlek — vi matchar dig med rätt lokaler.
            </p>

            {/* Property type selection */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Vad söker du?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_PROPERTY_TYPES.map((type) => {
                  const Icon = PROPERTY_TYPE_ICONS[type];
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                        isSelected
                          ? "border-accent bg-accent/5 text-accent"
                          : "border-border hover:border-accent/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium leading-tight">
                        {PROPERTY_TYPE_LABELS[type].split(" & ")[0].split(",")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size selection */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Ungefärlig storlek</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SIZE_RANGES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setSelectedSize(selectedSize === size.value ? null : size.value)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                      selectedSize === size.value
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border hover:border-accent/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceed}
              variant="cta"
              size="lg"
              className="w-full gap-2 text-base"
            >
              Visa matchningar
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Kostnadsfritt och diskret
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Tillbaka
            </button>

            <h3 className="text-xl md:text-2xl font-bold mb-1">
              Vi har lokaler som kan passa
            </h3>
            <p className="text-muted-foreground mb-6">
              Fyll i dina uppgifter så matchar vi dig med rätt alternativ.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    placeholder="Kontaktperson *"
                    {...register("contact_name")}
                    className={errors.contact_name ? "border-destructive" : ""}
                  />
                  {errors.contact_name && (
                    <p className="text-xs text-destructive mt-1">{errors.contact_name.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Företag *"
                    {...register("company_name")}
                    className={errors.company_name ? "border-destructive" : ""}
                  />
                  {errors.company_name && (
                    <p className="text-xs text-destructive mt-1">{errors.company_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    type="email"
                    placeholder="E-post *"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="tel"
                    placeholder="Telefon *"
                    {...register("phone")}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Textarea
                  placeholder="Beskriv dina behov (valfritt)"
                  rows={3}
                  {...register("message")}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                variant="cta"
                size="lg"
                className="w-full gap-2 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Skickar...
                  </>
                ) : (
                  <>
                    Få mina matchningar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Kostnadsfritt — vi kontaktar dig inom 24 timmar.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

