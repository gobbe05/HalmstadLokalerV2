'use client'
import { 
  Building2, 
  User, 
  LogOut, 
  LogIn,
  ChevronDown,
  Warehouse,
  Store,
  Factory,
  UtensilsCrossed,
  GraduationCap,
  Users,
  MapPin,
  LucideIcon,
  PlusCircle,
  LayoutDashboard
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePublicAuth } from "@/contexts/PublicAuthContext";
import { LoginModal } from "./LoginModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";

// Category navigation items
interface CategoryNavItem {
  slug: string;
  label: string;
  icon: LucideIcon;
}

const CATEGORY_NAV_ITEMS: CategoryNavItem[] = [
  { slug: "kontor", label: "Kontor", icon: Building2 },
  { slug: "lager", label: "Lager & logistik", icon: Warehouse },
  { slug: "butik", label: "Butiker", icon: Store },
  { slug: "industri", label: "Industri & verkstad", icon: Factory },
  { slug: "restaurang", label: "Restaurang & café", icon: UtensilsCrossed },
  { slug: "skola-vard-omsorg", label: "Skola, vård & omsorg", icon: GraduationCap },
  { slug: "coworking", label: "Kontorshotell & coworking", icon: Users },
  { slug: "ovrigt", label: "Övrigt", icon: MapPin },
];

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, user, signOut } = usePublicAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Kunde inte logga ut");
    } else {
      toast.success("Du är nu utloggad");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - premium, elegant styling */}
            <Link 
              href="/" 
              className="flex items-center gap-1.5 font-heading font-bold text-xl tracking-tight rounded-lg px-3 py-1.5 -ml-3 transition-all duration-200 hover:bg-secondary hover:shadow-soft active:scale-[0.98]"
            >
              <span className="text-foreground">Halmstad</span>
              <span className="text-accent font-medium">Lokaler</span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-6">
              
              {/* Categories dropdown - only show for non-authenticated users */}
              {!isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Lokaler
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-background border border-border shadow-lg rounded-lg p-1">
                    {CATEGORY_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.slug} asChild className="p-0">
                          <Link 
                            href={`/${item.slug}/`} 
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-secondary"
                          >
                            <Icon className="h-4 w-4 text-accent" />
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem asChild className="p-0">
                      <Link 
                        href="/lokaler" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer font-medium transition-colors hover:bg-secondary"
                      >
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="text-sm">Visa alla lokaler</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Lägg in annons - only show for non-authenticated users */}
              {!isAuthenticated && (
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href="/lagg-in-annons">
                    <PlusCircle className="h-4 w-4" />
                    Lägg in annons
                  </Link>
                </Button>
              )}

              {isAuthenticated ? (
                <>
                  {/* Dashboard link for all authenticated users */}
                  <Link
                    href="/app"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Mina annonser
                  </Link>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="max-w-[100px] truncate">
                          {user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Konto"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/app" className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Mina annonser
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logga ut
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowLoginModal(true)} className="gap-1.5">
                  <LogIn className="h-4 w-4" />
                  Logga in
                </Button>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              {isAuthenticated && (
                <Link href="/app" className="p-2">
                  <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Meny"
                className="relative w-10 h-10"
              >
                <span className="sr-only">{isMenuOpen ? "Stäng meny" : "Öppna meny"}</span>
                <div className="flex flex-col justify-center items-center w-5 h-5">
                  <span 
                    className={cn(
                      "block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-out",
                      isMenuOpen ? "rotate-45 translate-y-[3px]" : "rotate-0 -translate-y-1"
                    )}
                  />
                  <span 
                    className={cn(
                      "block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-out",
                      isMenuOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
                    )}
                  />
                  <span 
                    className={cn(
                      "block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-out",
                      isMenuOpen ? "-rotate-45 -translate-y-[3px]" : "rotate-0 translate-y-1"
                    )}
                  />
                </div>
              </Button>
            </div>
          </div>

          {/* Mobile navigation - compact */}
          <div
            className={cn(
              "md:hidden overflow-hidden transition-all duration-300 ease-out",
              isMenuOpen ? "max-h-[400px] pb-3 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <nav className="flex flex-col gap-0.5 pt-2">
              {/* Categories grid - compact 2 columns - only for non-authenticated users */}
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-1 px-1 py-2">
                  {CATEGORY_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.slug}
                        href={`/${item.slug}/`}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground rounded-md hover:bg-secondary hover:text-accent transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                  {/* Alla lokaler - styled same as category items */}
                  <Link
                    href="/lokaler"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground rounded-md hover:bg-secondary hover:text-accent transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Alla lokaler</span>
                  </Link>
                </div>
              )}
              
              {/* Auth section */}
              <div className="flex flex-col gap-2 px-1 pt-2 border-t border-border/50">
                {isAuthenticated ? (
                  <div className="flex gap-2">
                    <Link
                      href="/app"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Mina annonser
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-destructive bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {/* Lägg in annons CTA */}
              <Link
                href="/lagg-in-annons"
                onClick={() => setIsMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Lägg in annons
              </Link>
                    <button
                      onClick={() => { setShowLoginModal(true); setIsMenuOpen(false); }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Logga in
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </>
  );
}
