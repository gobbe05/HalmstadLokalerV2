'use client'
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
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
  Menu,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

interface AppLayoutProps {
  children: ReactNode;
}

const navSections: { title: string; items: NavItem[]; iconColor?: string }[] = [
  {
    title: "Översikt",
    iconColor: "text-teal-700",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/app" },
    ],
  },
  {
    title: "Mina objekt",
    iconColor: "text-teal-500",
    items: [
      { label: "Mina lokaler", icon: Building2, href: "/app/lokaler" },
      { label: "Mina leads", icon: Users, href: "/app/leads" },
    ],
  },
  {
    title: "Konto",
    iconColor: "text-teal-400",
    items: [
      { label: "Annonsörsprofil", icon: UserCircle, href: "/app/profil" },
      { label: "Annonsörssida", icon: Share2, href: "/app/annonsorsida" },
    ],
  },
];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { signOut } = useAuthContext();
  const { data: profileData } = useProfileCompletion();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const profileIncomplete = profileData && !profileData.isComplete;

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(href);
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
              const isProfileItem = item.href === "/app/profil";
              const showBadge = isProfileItem && profileIncomplete;
              
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
                  <div className="flex items-center gap-2">
                    <item.icon className={cn("w-4 h-4", section.iconColor)} strokeWidth={1} />
                    {item.label}
                  </div>
                  {showBadge && (
                    <span className="flex items-center justify-center w-2 h-2 rounded-full bg-amber-500" title="Profil ej komplett" />
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
          <LogOut className="w-4 h-4 mr-2" strokeWidth={1} />
          Logga ut
        </Button>
      </div>

      <div className="px-6 py-4 border-t border-border text-xs text-muted-foreground">
        © Halmstadlokaler
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] lg:h-screen flex flex-col w-full bg-background lg:overflow-hidden">
      {/* Indicator bar */}
      <div className="h-1 w-full bg-accent shrink-0" />
      
      {/* Mobile header - sticky at top */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3.5 border-b border-border/60 bg-card shadow-soft shrink-0 sticky top-0 z-40">
        <Link href="/app" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="inline-block w-2 h-2 rounded-full bg-accent" />
          <div className="text-base font-heading font-bold text-foreground">Halmstadlokaler</div>
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" strokeWidth={1} />
              <span className="sr-only">Öppna meny</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="px-6 py-5 border-b border-border/60">
              <Link href="/app" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                <SheetTitle className="text-lg font-heading font-bold text-foreground">Halmstadlokaler</SheetTitle>
              </Link>
              <p className="text-xs text-muted-foreground">Annonsörportal</p>
            </SheetHeader>
            <NavContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>
      
      <div className="flex flex-1 w-full min-h-0">
        {/* Desktop sidebar - fixed position */}
        <aside className="hidden lg:flex w-72 bg-card border-r border-border/60 flex-col shadow-soft shrink-0">
          <Link href="/app" className="block px-6 py-5 border-b border-border/60 hover:bg-secondary transition-colors shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-accent" />
              <div className="text-lg font-heading font-bold text-foreground">Halmstadlokaler</div>
            </div>
            <div className="text-xs text-muted-foreground">Annonsörportal</div>
          </Link>

          <NavContent />
        </aside>

        {/* Main content area - scrollable */}
        <main className="flex-1 min-h-0 overflow-auto">
          {children}
        </main>
      </div>

    </div>
  );
}

