/**
 * ============================================================================
 * AuthPage - Main Authentication Page
 * ============================================================================
 * 
 * ⚠️ SECURITY: This page uses the centralized authGuard for account status
 * checks. Do NOT add custom status checks here - use authGuard.ts instead.
 * 
 * ============================================================================
 */
'use client'
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkAccountStatus, ACCOUNT_DISABLED_MESSAGE } from "@/lib/authGuard";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, { message: "Namnet måste vara minst 2 tecken" }),
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
});

export default function AuthPage() {
  const router = useRouter();
  const pathnName = usePathname();
  const searchParams = useSearchParams();

  // fromPath removed - advertisers always go to /app after login

  // Check if ?mode=signup is in URL
  const initialMode = searchParams.get("mode") === "signup";

  const [isLogin, setIsLogin] = useState(!initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkProfileAndRedirect = async (userId: string): Promise<boolean> => {
    // Use centralized auth guard
    const status = await checkAccountStatus(userId);

    if (!status.allowed) {
      await supabase.auth.signOut();
      toast.error(ACCOUNT_DISABLED_MESSAGE);
      return false;
    }

    // Get role and redirect
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    // Always redirect to portal home, ignore fromPath
    // Advertisers → /app, Admins → /admin
    const destination = roleData?.role === "admin" ? "/admin" : "/app";
    console.info("[AuthPage] post-login redirect", { userId, role: roleData?.role, destination });
    router.replace(destination);
    return true;
  };

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await checkProfileAndRedirect(session.user.id);
      }
    };
    checkAuthAndRedirect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    } else {
      const validation = signupSchema.safeParse({ name, email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Felaktiga inloggningsuppgifter");
          } else {
            toast.error(error.message);
          }
        } else if (data.session) {
          // Check account status before allowing login
          const status = await checkAccountStatus(data.session.user.id);
          if (!status.allowed) {
            await supabase.auth.signOut();
            toast.error(ACCOUNT_DISABLED_MESSAGE);
          } else {
            toast.success("Inloggad!");
            await checkProfileAndRedirect(data.session.user.id);
          }
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: name,
            },
          },
        });
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("E-postadressen är redan registrerad");
          } else {
            toast.error(error.message);
          }
        } else if (data.user) {
          toast.success("Konto skapat! Du är nu inloggad.");
          router.replace("/app");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      {/* Header */}
      <header className="p-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-2xl font-semibold tracking-tight">
                <span className="text-foreground">Halmstad</span>
                <span className="text-muted-foreground font-normal">Lokaler</span>
              </h1>
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              {isLogin ? "Logga in för att hantera ditt konto" : "Skapa ett konto för att komma igång"}
            </p>
          </div>

          {/* Form card */}
          <div className="bg-background rounded-2xl border border-border/50 shadow-sm p-6 sm:p-8">
            {/* Toggle tabs */}
            <div className="flex gap-1 p-1 bg-secondary rounded-full mb-6">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-full transition-all",
                  isLogin 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Logga in
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-full transition-all",
                  !isLogin 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Registrera
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">
                    Namn
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ditt namn"
                    autoComplete="name"
                    required
                    className="h-11 rounded-xl bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-foreground/20"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  E-post
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.se"
                  autoComplete="email"
                  required
                  className="h-11 rounded-xl bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-foreground/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Lösenord
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  className="h-11 rounded-xl bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-foreground/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-full bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Laddar..." : isLogin ? "Logga in" : "Skapa konto"}
              </button>
            </form>

            {isLogin && (
              <div className="mt-4 text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Glömt lösenord?
                </Link>
              </div>
            )}
          </div>

          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Genom att fortsätta godkänner du våra villkor
          </p>
        </div>
      </main>
    </div>
  );
}
