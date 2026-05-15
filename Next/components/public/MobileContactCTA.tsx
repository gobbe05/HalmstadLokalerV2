'use client'
import { useState } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ContactDetailsModal, ContactFormData } from "./ContactDetailsModal";
import { submitLead } from "@/lib/properties";
import { useToast } from "@/hooks/use-toast";

interface MobileContactCTAProps {
  propertyId: string;
  propertyTitle: string;
  propertyAddress?: string;
  advertiserName?: string;
}

export function MobileContactCTA({
  propertyId,
  propertyTitle,
  propertyAddress,
  advertiserName,
}: MobileContactCTAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();

  function handleContinue() {
    if (!message.trim()) {
      setMessageError("Skriv ett meddelande innan du fortsätter");
      return;
    }
    setMessageError(null);
    setIsOpen(false);
    setIsDetailsModalOpen(true);
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

      setIsDetailsModalOpen(false);
      setMessage("");

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
      {/* Sticky CTA bar - only visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-gradient-to-t from-background via-background to-background/95 border-t border-primary/10 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <Button
            onClick={() => setIsOpen(true)}
            variant="cta"
            className="w-full rounded-xl gap-2 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            size="lg"
          >
            <MessageCircle className="h-5 w-5" />
            Skicka meddelande
          </Button>
        </div>
      </div>

      {/* Message input dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Kontakta {advertiserName || "annonsören"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground">
              Ställ en fråga om {propertyTitle}
            </p>

            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (messageError) setMessageError(null);
              }}
              placeholder="Skriv din fråga eller berätta kort om ert behov"
              rows={4}
              maxLength={2000}
              className={`resize-none rounded-xl border-border/50 focus:border-primary/50 focus:ring-primary/20 ${messageError ? "ring-2 ring-destructive border-destructive" : ""}`}
            />
            {messageError && (
              <p className="text-xs text-destructive font-medium">{messageError}</p>
            )}

            <Button
              onClick={handleContinue}
              className="w-full rounded-xl gap-2 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              size="lg"
            >
              Fortsätt
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Kontaktuppgifter fylls i nästa steg
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact details modal */}
      <ContactDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
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

