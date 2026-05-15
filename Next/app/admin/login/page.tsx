/**
 * ============================================================================
 * AdminLoginPage - Dedicated Admin Login
 * ============================================================================
 * 
 * Separate login page for administrators only.
 * Non-admin users will be signed out and shown an error.
 * 
 * ============================================================================
 */
'use client'
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { checkAccountStatus, ACCOUNT_DISABLED_MESSAGE } from "@/lib/authGuard";
import { useRouter } from "next/navigation";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (roleData?.role === "admin") {
          router.replace("/admin");
        }
      }
    };
    checkExistingSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
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
        return;
      }

      if (!data.session) {
        toast.error("Kunde inte logga in");
        return;
      }

      // Check account status
      const status = await checkAccountStatus(data.session.user.id);
      if (!status.allowed) {
        await supabase.auth.signOut();
        toast.error(ACCOUNT_DISABLED_MESSAGE);
        return;
      }

      // Verify admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (roleData?.role !== "admin") {
        await supabase.auth.signOut();
        toast.error("Du har inte administratörsbehörighet");
        return;
      }

      toast.success("Välkommen!");
      router.replace("/admin");
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
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-foreground/10 mb-4">
              <ShieldCheck className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Admin
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Logga in för att administrera systemet
            </p>
          </div>

          {/* Form card */}
          <div className="bg-background rounded-2xl border border-border/50 shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  E-post
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.se"
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
                  autoComplete="current-password"
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
                {isSubmitting ? "Loggar in..." : "Logga in"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Glömt lösenord?
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
