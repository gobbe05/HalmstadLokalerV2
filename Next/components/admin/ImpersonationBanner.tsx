'use client'
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ImpersonationBanner() {
  const { isImpersonating, endImpersonation } = useImpersonation();
  const router = useRouter();

  if (!isImpersonating) return null;

  const handleReturnToAdmin = async () => {
    const originalSession = endImpersonation();
    
    if (originalSession) {
      // Sign out current impersonated user
      await supabase.auth.signOut();
      
      // Restore original admin session
      const { error } = await supabase.auth.setSession({
        access_token: originalSession.access_token,
        refresh_token: originalSession.refresh_token,
      });

      if (error) {
        toast.error("Kunde inte återställa admin-session. Logga in igen.");
        router.push("/auth");
      } else {
        toast.success("Tillbaka som admin");
        router.push("/admin/kunder");
      }
    } else {
      toast.error("Ingen sparad session hittades");
      router.push("/auth");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-center gap-4">
      <UserCog className="h-4 w-4" />
      <span className="text-sm font-medium">Du är inloggad som kund (impersonation)</span>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleReturnToAdmin}
        className="bg-white hover:bg-amber-50 text-amber-950 border-amber-600"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Tillbaka till admin
      </Button>
    </div>
  );
}

