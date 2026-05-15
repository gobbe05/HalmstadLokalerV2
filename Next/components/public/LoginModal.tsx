'use client'
/**
 * ============================================================================
 * LoginModal - Public Website Login Modal
 * ============================================================================
 * 
 * ⚠️ SECURITY: This component uses the centralized authGuard for account status
 * checks. Do NOT add custom status checks here - use authGuard.ts instead.
 * 
 * Neutral registration - no role selection. Roles are determined by user actions.
 * 
 * ============================================================================
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePublicAuth } from "@/contexts/PublicAuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ACCOUNT_DISABLED_MESSAGE } from "@/lib/authGuard";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
  name: z.string().optional(),
});

type ModalView = "login" | "signup" | "forgot";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LoginModal({ open, onOpenChange, onSuccess }: LoginModalProps) {
  const [view, setView] = useState<ModalView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const { signIn, signUp, resetPassword } = usePublicAuth();
  const router = useRouter();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setForgotSent(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
      setView("login");
    }
    onOpenChange(open);
  };

  const fetchUserRole = async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (error || !data) return null;
    return data.role;
  };

  const redirectBasedOnRole = (role: string | null) => {
    // If user has advertiser or admin role, go to app
    if (role === "advertiser" || role === "admin") {
      router.push("/app");
    } else {
      // For seekers or users without role, stay on current page or go to favorites
      router.push("/mina-favoriter");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message === ACCOUNT_DISABLED_MESSAGE) {
        toast.error(ACCOUNT_DISABLED_MESSAGE);
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Fel e-post eller lösenord");
      } else {
        toast.error(error.message);
      }
      setIsSubmitting(false);
      return;
    }

    // Fetch user and redirect based on existing role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const role = await fetchUserRole(user.id);
      toast.success("Inloggad!");
      handleClose(false);
      onSuccess?.();
      redirectBasedOnRole(role);
    } else {
      toast.success("Inloggad!");
      handleClose(false);
      onSuccess?.();
    }
    
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = signupSchema.safeParse({ email, password, name });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    // Register without role - neutral account
    const { error } = await signUp(email, password, name || undefined);
    
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("E-postadressen är redan registrerad");
      } else {
        toast.error(error.message);
      }
      setIsSubmitting(false);
      return;
    }

    toast.success("Konto skapat! Du är nu inloggad.");
    handleClose(false);
    onSuccess?.();
    // Don't redirect - let the user continue what they were doing
    
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = z.string().email().safeParse(email);
    if (!validation.success) {
      toast.error("Ange en giltig e-postadress");
      return;
    }

    setIsSubmitting(true);
    const { error } = await resetPassword(email);
    
    if (error) {
      toast.error(error.message);
    } else {
      setForgotSent(true);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {view === "login" && "Logga in"}
            {view === "signup" && "Skapa konto"}
            {view === "forgot" && "Återställ lösenord"}
          </DialogTitle>
          <DialogDescription>
            {view === "login" && "Logga in för att få tillgång till ditt konto."}
            {view === "signup" && "Skapa ett konto för att komma igång."}
            {view === "forgot" && "Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord."}
          </DialogDescription>
        </DialogHeader>

        {view === "login" && (
          <div className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Loggar in..." : "Logga in"}
              </Button>
            </form>

            <div className="flex flex-col items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => { resetForm(); setView("signup"); }}
                className="text-primary hover:underline"
              >
                Skapa nytt konto
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setView("forgot"); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Glömt lösenord?
              </button>
            </div>
          </div>
        )}

        {view === "signup" && (
          <div className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Namn (valfritt)</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ditt namn"
                  autoComplete="name"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-post</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.se"
                  autoComplete="email"
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Lösenord</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minst 6 tecken"
                  autoComplete="new-password"
                  maxLength={128}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Skapar konto..." : "Skapa konto"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => { resetForm(); setView("login"); }}
              className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till inloggning
            </button>
          </div>
        )}

        {view === "forgot" && (
          <div className="space-y-4">
            {forgotSent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  Om ett konto med denna e-postadress finns har vi skickat en återställningslänk.
                </p>
                <button
                  type="button"
                  onClick={() => { resetForm(); setView("login"); }}
                  className="text-sm text-primary hover:underline"
                >
                  Tillbaka till inloggning
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">E-post</Label>
                    <Input
                      id="forgot-email"
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
                </form>

                <button
                  type="button"
                  onClick={() => { resetForm(); setView("login"); }}
                  className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Tillbaka till inloggning
                </button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

