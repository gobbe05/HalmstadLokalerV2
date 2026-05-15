'use client'
import { ReactNode } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { redirect, usePathname } from "next/navigation";

interface AdvertiserRouteProps {
  children: ReactNode;
}

export function AdvertiserRoute({ children }: AdvertiserRouteProps) {
  const { isAuthenticated, loading } = useAuthContext();
  const { isAdvertiser, isAdmin, isLoading: roleLoading } = useUserRole();
  const pathname = usePathname();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return redirect("/auth");
  }

  // Admins should only use the admin dashboard, not advertiser routes
  if (isAdmin) {
    return redirect("/admin");
  }

  // Only advertisers can access /app routes
  if (!isAdvertiser) {
    return redirect("/");
  }

  return <>{children}</>;
}

