'use client'
import { ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Building2,
  Users,
  LayoutDashboard,
  UserCircle,
  LogOut,
  Building,
  Menu,
  MapPin,
  Receipt,
  Tags,
  BookOpen,
} from "lucide-react";
import { AdminGlobalSearch } from "@/components/admin/AdminGlobalSearch";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badgeKey?: string;
}

const navSections: { title: string; items: NavItem[]; iconColor?: string }[] = [
  {
    title: "Översikt",
    iconColor: "text-teal-700",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    ],
  },
  {
    title: "Hantering",
    iconColor: "text-teal-500",
    items: [
      { label: "Kunder", icon: Building, href: "/admin/kunder", badgeKey: "pendingAdvertisers" },
      { label: "Städer", icon: MapPin, href: "/admin/stader" },
      { label: "Kategorier", icon: Tags, href: "/admin/kategorier" },
      { label: "Lokalexperten", icon: BookOpen, href: "/admin/lokalexperten" },
      { label: "Alla lokaler", icon: Building2, href: "/admin/lokaler" },
      { label: "Alla leads", icon: Users, href: "/admin/leads" },
    ],
  },
  {
    title: "Ekonomi",
    iconColor: "text-emerald-500",
    items: [
      { label: "Fakturering", icon: Receipt, href: "/admin/fakturering" },
    ],
  },
  {
    title: "Konto",
    iconColor: "text-teal-400",
    items: [
      { label: "Min profil", icon: UserCircle, href: "/admin/profil" },
    ],
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { signOut } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch pending advertisers count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin-pending-advertisers-count"],
    queryFn: async () => {
      // Get advertiser user_ids
      const { data: advertiserRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "advertiser");

      if (!advertiserRoles || advertiserRoles.length === 0) return 0;

      const advertiserUserIds = advertiserRoles.map(r => r.user_id);

      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("user_id", advertiserUserIds)
        .eq("status", "pending")
        .is("deleted_at", null);

      if (error) return 0;
      return count || 0;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const badges: Record<string, number> = {
    pendingAdvertisers: pendingCount,
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <nav className="flex-1 px-4 py-4 text-sm overflow-y-auto">
        {navSections.map((section, index) => (
          <div key={section.title} className={cn(index > 0 && "mt-6")}>
            <p className="px-2 mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {section.title}
            </p>
            {section.items.map((item) => {
              const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2 py-2 rounded-md transition-colors",
                    isActive(item.href)
                      ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className={cn("w-4 h-4", section.iconColor)} />
                    {item.label}
                  </span>
                  {badgeCount > 0 && (
                    <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-medium rounded-full bg-amber-500 text-white">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => {
            onNavigate?.();
            signOut();
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logga ut
        </Button>
      </div>

      <div className="px-6 py-4 border-t border-border text-xs text-muted-foreground">
        © Halmstadlokaler
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Admin indicator bar */}
      <div className="h-1 w-full bg-emerald-500" />
      
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <div className="text-base font-semibold text-foreground">Halmstadlokaler</div>
        </Link>
        <div className="flex items-center gap-2">
          <AdminGlobalSearch />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Öppna meny</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SheetHeader className="px-6 py-5 border-b border-border">
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <SheetTitle className="text-lg font-semibold text-foreground">Halmstadlokaler</SheetTitle>
                </Link>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </SheetHeader>
              <NavContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      <div className="flex flex-1 w-full">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-72 bg-card border-r border-border flex-col">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <div className="text-lg font-semibold text-foreground">Halmstadlokaler</div>
                <div className="text-xs text-muted-foreground">Admin Panel</div>
              </div>
            </Link>
          </div>
          
          {/* Global search in sidebar */}
          <div className="px-4 py-3 border-b border-border">
            <AdminGlobalSearch />
          </div>

          <NavContent />
        </aside>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

