'use client'
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";

type ContactDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyTitle: string;
  propertyAddress?: string;
  message: string;
  onSubmit: (data: ContactFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
};

export type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  orgNumber: string;
  gdprAccepted: boolean;
};

const initialFormData: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  orgNumber: "",
  gdprAccepted: false,
};

export function ContactDetailsModal({
  open,
  onOpenChange,
  propertyTitle,
  propertyAddress,
  message,
  onSubmit,
  isSubmitting,
  submitError,
}: ContactDetailsModalProps) {
  const [form, setForm] = useState<ContactFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm(initialFormData);
      setErrors({});
      // Focus on name input when modal opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  function handleChange(field: keyof ContactFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};

    if (!form.name.trim()) newErrors.name = "Ange ditt namn";
    if (!form.email.trim()) {
      newErrors.email = "Ange din e-postadress";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Ange en giltig e-postadress";
    }
    if (!form.phone.trim()) newErrors.phone = "Ange ditt telefonnummer";
    if (!form.company.trim()) newErrors.company = "Ange företagsnamn";
    if (!form.gdprAccepted) {
      newErrors.gdprAccepted = "Du måste godkänna villkoren";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  }

  const isFormValid =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.company.trim() &&
    form.gdprAccepted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg sm:max-w-xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl sm:text-2xl text-center">
            Snart klart!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Hur kan annonsören nå dig?
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground text-center mb-4">
            Vi skickar vidare ditt meddelande tillsammans med dina uppgifter till annonsören.
          </p>

          {/* Property info box */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border mb-6">
            <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="text-sm">
              <p className="text-muted-foreground">Gäller lokal:</p>
              <p className="font-medium">{propertyTitle}</p>
              {propertyAddress && (
                <p className="text-muted-foreground">{propertyAddress}</p>
              )}
            </div>
          </div>

          {submitError && (
            <div className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contact-name" className="text-sm font-medium">
                Namn <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-name"
                ref={nameInputRef}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ditt namn"
                maxLength={100}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact-email" className="text-sm font-medium">
                E-post <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="din@epost.se"
                maxLength={255}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact-phone" className="text-sm font-medium">
                Telefonnummer <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="070-123 45 67"
                maxLength={30}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact-company" className="text-sm font-medium">
                Företag <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-company"
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="Företagsnamn"
                maxLength={200}
                className={errors.company ? "border-destructive" : ""}
              />
              {errors.company && (
                <p className="mt-1 text-xs text-destructive">{errors.company}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact-orgnumber" className="text-sm font-medium">
                Organisationsnummer <span className="text-muted-foreground">(valfritt)</span>
              </Label>
              <Input
                id="contact-orgnumber"
                value={form.orgNumber}
                onChange={(e) => handleChange("orgNumber", e.target.value)}
                placeholder="123456-7890"
                maxLength={20}
              />
            </div>

            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="gdpr-checkbox"
                checked={form.gdprAccepted}
                onCheckedChange={(checked) =>
                  handleChange("gdprAccepted", checked === true)
                }
                className={errors.gdprAccepted ? "border-destructive" : ""}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="gdpr-checkbox"
                  className="text-sm font-normal cursor-pointer"
                >
                  Jag godkänner att mina uppgifter lagras och delas med annonsören enligt{" "}
                  <a
                    href="/integritetspolicy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground text-primary"
                  >
                    personuppgiftspolicyn
                  </a>
                  . <span className="text-destructive">*</span>
                </Label>
                {errors.gdprAccepted && (
                  <p className="text-xs text-destructive">{errors.gdprAccepted}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-4"
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? "Skickar..." : "Slutför"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

