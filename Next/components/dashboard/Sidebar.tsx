'use client'
import { 
  Building2, 
  Users,
  LayoutDashboard,
  Mail,
  HelpCircle,
  UserCircle,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  id: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Översikt",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", id: "dashboard" },
    ],
  },
  {
    title: "Objektshantering",
    items: [
      { label: "Objekt", icon: Building2, href: "/listings", id: "objekt" },
    ],
  },
  {
    title: "Leadsverktyg",
    items: [
      { label: "Leads", icon: Users, href: "/leads", id: "leads" },
    ],
  },
  {
    title: "Konto",
    items: [
      { label: "Min profil", icon: UserCircle, href: "/profile", id: "profile" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Kontakt", icon: Mail, href: "#", id: "kontakt" },
      { label: "FAQ", icon: HelpCircle, href: "#", id: "faq" },
    ],
  },
];

interface SidebarProps {
  activeItem?: string;
}

export function Sidebar({ activeItem }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuthContext();

  const isActive = (item: NavItem) => {
    if (activeItem) {
      return item.id === activeItem;
    }
    return location.pathname.startsWith(item.href) && item.href !== "#";
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col">
      <div className="px-6 py-5 border-b border-border">
        <div className="text-lg font-semibold text-foreground">Halmstadlokaler</div>
        <div className="text-xs text-muted-foreground">CRM & Publiceringsverktyg</div>
      </div>

      <nav className="flex-1 px-4 py-4 text-sm overflow-y-auto">
        {navSections.map((section, index) => (
          <div key={section.title} className={cn(index > 0 && "mt-6")}>
            <p className="px-2 mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {section.title}
            </p>
            {section.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
                  isActive(item)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logga ut
        </Button>
      </div>

      <div className="px-6 py-4 border-t border-border text-xs text-muted-foreground">
        © Halmstadlokaler
      </div>
    </aside>
  );
}

