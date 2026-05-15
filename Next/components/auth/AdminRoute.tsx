'use client'
import { ReactNode } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { redirect, usePathname } from "next/navigation";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, loading } = useAuthContext();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const pathname = usePathname();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return redirect("/admin/login");
  }

  if (!isAdmin) {
    return redirect("/app");
  }

  return <>{children}</>;
}

