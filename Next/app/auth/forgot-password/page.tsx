'use client';
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";

const schema = z.object({
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = schema.safeParse({ email });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await supabase.functions.invoke("send-password-reset", {
        body: {
          email: validation.data.email,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        },
      });

      if (response.error) {
        toast.error(response.error.message || "Kunde inte skicka återställningsmail");
      } else if (response.data?.error) {
        toast.error(response.data.error);
      } else {
        setSent(true);
        toast.success("Återställningslänk skickad till din e-post");
      }
    } catch (error: any) {
      toast.error("Ett fel uppstod. Försök igen senare.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          {!sent && (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-foreground">Glömt lösenord</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Ange din e-postadress för att återställa ditt lösenord
              </p>
            </div>
          )}

          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Vi har skickat en återställningslänk till din e-post. Kontrollera din inkorg.
              </p>
              <Link
                href="/auth"
                className="text-sm text-primary hover:underline"
              >
                Tillbaka till inloggning
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.se"
                  autoComplete="email"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Skickar..." : "Skicka återställningslänk"}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tillbaka till inloggning
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
