'use client'
import { LogOut } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface HeaderProps {
  newLeadsCount?: number;
}

export function Header({ newLeadsCount = 0 }: HeaderProps) {
  const { user, signOut } = useAuthContext();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Kunde inte logga ut");
    } else {
      toast.success("Utloggad");
      router.push("/auth");
    }
  };

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "AU";

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-card border-b border-border">
      <div>
        <p className="text-sm text-muted-foreground">
          Hantera objekt och leads från dina lokalannonser.
        </p>
      </div>
      <div className="flex items-center gap-4">
        {newLeadsCount > 0 && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-new-bg text-status-new-text text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-status-new"></span>
            {newLeadsCount} nya leads
          </span>
        )}
        <div className="flex items-center gap-2">
          <div className="text-right text-sm">
            <div className="font-medium text-foreground truncate max-w-32">
              {user?.email || "Användare"}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
            {initials}
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Logga ut">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

