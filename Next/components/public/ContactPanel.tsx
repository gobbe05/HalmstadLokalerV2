'use client'
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { ContactDetailsModal, ContactFormData } from "./ContactDetailsModal";
import { submitLead } from "@/lib/properties";
import { useToast } from "@/hooks/use-toast";

type ContactPanelProps = {
  propertyId: string;
  propertyTitle: string;
  propertyAddress?: string;
  advertiserName?: string;
};

export function ContactPanel({
  propertyId,
  propertyTitle,
  propertyAddress,
  advertiserName,
}: ContactPanelProps) {
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  // Auto-reset after 5 seconds
  useEffect(() => {
    if (hasSubmitted) {
      const timer = setTimeout(() => {
        setHasSubmitted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasSubmitted]);

  function handleOpenModal() {
    if (!message.trim()) {
      setMessageError("Skriv ett meddelande innan du fortsätter");
      return;
    }
    setMessageError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(formData: ContactFormData) {
    setSubmitError(null);

    try {
      setIsSubmitting(true);

      const result = await submitLead({
        propertyId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        message: message.trim(),
      });

      if (!result.success) {
        throw new Error(result.error || "Något gick fel. Försök igen om en stund.");
      }

      // Success!
      setIsModalOpen(false);
      setMessage("");
      setHasSubmitted(true);

      toast({
        title: "Tack!",
        description: "Din intresseanmälan är skickad till annonsören.",
      });
    } catch (err: any) {
      setSubmitError(
        err?.message || "Något gick fel. Försök igen eller kontakta oss direkt."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="bg-gradient-to-br from-accent/5 via-accent/3 to-transparent border border-accent/20 rounded-2xl p-6 shadow-card">
        {hasSubmitted ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 ring-4 ring-green-500/10">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <p className="font-semibold text-lg">
              Tack! Din förfrågan är skickad.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <h3 className="font-bold text-xl">
              Kontakta {advertiserName || "annonsören"}
            </h3>

            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (messageError) setMessageError(null);
              }}
              placeholder="Vad vill du veta om den här lokalen?"
              rows={4}
              maxLength={2000}
              className={`bg-background/80 border border-border/50 resize-none rounded-xl focus:border-accent/50 focus:ring-accent/20 transition-colors ${messageError ? "ring-2 ring-destructive border-destructive" : ""}`}
            />
            {messageError && (
              <p className="text-xs text-destructive font-medium">{messageError}</p>
            )}

            <Button 
              onClick={handleOpenModal} 
              variant="cta"
              className="w-full rounded-xl gap-2 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              size="lg"
            >
              Skicka meddelande
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Kontaktuppgifter fylls i nästa steg
            </p>
          </div>
        )}
      </div>

      <ContactDetailsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        propertyTitle={propertyTitle}
        propertyAddress={propertyAddress}
        message={message}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </>
  );
}

