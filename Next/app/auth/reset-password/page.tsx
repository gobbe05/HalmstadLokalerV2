/**
 * ============================================================================
 * ResetPasswordPage - Password Reset Callback
 * ============================================================================
 * 
 * ⚠️ SECURITY: This page uses the centralized authGuard for account status
 * checks. Do NOT add custom status checks here - use authGuard.ts instead.
 * 
 * ============================================================================
 */
'use client'
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { checkAccountStatus, ACCOUNT_DISABLED_MESSAGE } from "@/lib/authGuard";
import { useRouter } from "next/navigation";

const schema = z.object({
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Ogiltig eller utgången återställningslänk");
        router.push("/auth");
        return;
      }

      // Check if the account is blocked
      const status = await checkAccountStatus(session.user.id);
      if (!status.allowed) {
        await supabase.auth.signOut();
        toast.error(ACCOUNT_DISABLED_MESSAGE);
        router.push("/auth");
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Lösenorden matchar inte");
      return;
    }

    const validation = schema.safeParse({ password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    // Re-check account status before allowing password update
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const status = await checkAccountStatus(session.user.id);
      if (!status.allowed) {
        await supabase.auth.signOut();
        toast.error(ACCOUNT_DISABLED_MESSAGE);
        router.push("/auth");
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Lösenordet har uppdaterats");
      router.push("/auth");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Nytt lösenord</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ange ditt nya lösenord
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nytt lösenord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sparar..." : "Spara nytt lösenord"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
