'use client'
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { submitLead } from "@/lib/properties";

type ContactFormCardProps = {
  propertyId: string;
  propertyTitle: string;
  advertiserName?: string;
  advertiserCompany?: string;
  advertiserEmail?: string;
  advertiserPhone?: string;
  advertiserAvatarUrl?: string;
};

type FormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  message: "",
};

export function ContactFormCard({
  propertyId,
  propertyTitle,
  advertiserName,
  advertiserCompany,
  advertiserEmail,
  advertiserPhone,
  advertiserAvatarUrl,
}: ContactFormCardProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleChange(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<FormState> = {};

    if (!form.name.trim()) newErrors.name = "Ange ditt namn";
    if (!form.company.trim()) newErrors.company = "Ange företagsnamn";
    if (!form.email.trim()) newErrors.email = "Ange en giltig e-postadress";
    if (!form.phone.trim()) newErrors.phone = "Ange telefonnummer";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const result = await submitLead({
        propertyId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        message: form.message.trim(),
      });

      if (!result.success) {
        throw new Error(result.error || "Något gick fel. Försök igen om en stund.");
      }

      setHasSubmitted(true);
      setForm(initialState);
    } catch (err: any) {
      setSubmitError(
        err?.message || "Kunde inte skicka din förfrågan just nu."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border border-border shadow-sm sticky top-4">
      <CardHeader>
        <CardTitle className="text-xl">
          Intresseanmälan – {propertyTitle}
        </CardTitle>
        <CardDescription>
          Fyll i dina uppgifter så återkommer fastighetsägaren med mer information
          om lokalen.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {hasSubmitted && (
          <div className="mb-4 flex items-start gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <p>
              <strong>Tack!</strong> Din intresseanmälan är skickad. 
              Fastighetsägaren kontaktar dig normalt inom 1–2 arbetsdagar.
            </p>
          </div>
        )}

        {submitError && (
          <div className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <p>{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Namn <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.name}
              onChange={e => handleChange("name", e.target.value)}
              placeholder="Ditt namn"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Företag <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.company}
              onChange={e => handleChange("company", e.target.value)}
              placeholder="Företagets namn"
              className={errors.company ? "border-destructive" : ""}
            />
            {errors.company && (
              <p className="mt-1 text-xs text-destructive">{errors.company}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              E-post <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={e => handleChange("email", e.target.value)}
              placeholder="din@epost.se"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Telefon <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.phone}
              onChange={e => handleChange("phone", e.target.value)}
              placeholder="Telefonnummer"
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Meddelande
            </label>
            <Textarea
              value={form.message}
              onChange={e => handleChange("message", e.target.value)}
              placeholder="Vad vill du veta om den här lokalen?"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Skickar..." : "Skicka intresse"}
          </Button>

          <p className="pt-1 text-xs text-muted-foreground">
            När du skickar en förfrågan sparas dina uppgifter i vårt CRM så att
            fastighetsägaren kan kontakta dig. Läs mer i vår{" "}
            <a
              href="/integritetspolicy"
              className="underline hover:text-foreground"
            >
              integritetspolicy
            </a>
            .
          </p>
        </form>
      </CardContent>

      {(advertiserName || advertiserEmail || advertiserPhone) && (
        <CardFooter className="border-t border-border mt-4 pt-4 flex items-center gap-3">
          {advertiserAvatarUrl ? (
            <img
              src={advertiserAvatarUrl}
              alt={advertiserName || "Kontaktperson"}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {(advertiserName || "Kontakt")[0]?.toUpperCase()}
            </div>
          )}

          <div className="text-sm">
            {advertiserName && (
              <p className="font-medium">{advertiserName}</p>
            )}
            {advertiserCompany && (
              <p className="text-muted-foreground">{advertiserCompany}</p>
            )}
            <div className="mt-1 space-y-0.5 text-muted-foreground">
              {advertiserPhone && (
                <a href={`tel:${advertiserPhone}`} className="block hover:underline hover:text-foreground">
                  {advertiserPhone}
                </a>
              )}
              {advertiserEmail && (
                <a href={`mailto:${advertiserEmail}`} className="block hover:underline hover:text-foreground">
                  {advertiserEmail}
                </a>
              )}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

