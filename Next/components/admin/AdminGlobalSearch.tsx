'use client'
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, Building, Users, MapPin, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: "customer" | "listing" | "lead" | "city";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export function AdminGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search query
  const { data: results = [] } = useQuery({
    queryKey: ["admin-global-search", search],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!search || search.length < 2) return [];

      const term = `%${search}%`;
      const results: SearchResult[] = [];

      // Search customers (profiles)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, company_name, email")
        .is("deleted_at", null)
        .or(`display_name.ilike.${term},company_name.ilike.${term},email.ilike.${term}`)
        .limit(5);

      profiles?.forEach((p) => {
        results.push({
          type: "customer",
          id: p.id,
          title: p.company_name || p.display_name || "Okänd",
          subtitle: p.email || undefined,
          href: `/admin/kunder/${p.id}`,
        });
      });

      // Search listings
      const { data: listings } = await supabase
        .from("listings")
        .select("id, titel, adress, stad")
        .is("deleted_at", null)
        .or(`titel.ilike.${term},adress.ilike.${term},stad.ilike.${term}`)
        .limit(5);

      listings?.forEach((l) => {
        results.push({
          type: "listing",
          id: l.id,
          title: l.titel,
          subtitle: l.adress ? `${l.adress}${l.stad ? `, ${l.stad}` : ""}` : undefined,
          href: `/admin/lokaler/${l.id}`,
        });
      });

      // Search leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, contact_name, email, company_name")
        .or(`contact_name.ilike.${term},email.ilike.${term},company_name.ilike.${term}`)
        .limit(5);

      leads?.forEach((l) => {
        results.push({
          type: "lead",
          id: l.id,
          title: l.contact_name,
          subtitle: l.company_name || l.email || undefined,
          href: `/admin/leads`,
        });
      });

      // Search cities
      const { data: cities } = await supabase
        .from("cities")
        .select("id, name, domain")
        .or(`name.ilike.${term},domain.ilike.${term}`)
        .limit(5);

      cities?.forEach((c) => {
        results.push({
          type: "city",
          id: c.id,
          title: c.name,
          subtitle: c.domain || undefined,
          href: `/admin/stader`,
        });
      });

      return results;
    },
    enabled: search.length >= 2,
    staleTime: 10 * 1000, // 10 seconds
  });

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setSearch("");
      router.push(result.href);
    },
    [router]
  );

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "customer":
        return <Building className="w-4 h-4" />;
      case "listing":
        return <FileText className="w-4 h-4" />;
      case "lead":
        return <Users className="w-4 h-4" />;
      case "city":
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getGroupLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "customer":
        return "Kunder";
      case "listing":
        return "Lokaler";
      case "lead":
        return "Leads";
      case "city":
        return "Städer";
    }
  };

  // Group results by type
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden lg:flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Sök...</span>
        <kbd className="pointer-events-none shrink-0 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="w-5 h-5" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Sök kunder, lokaler, leads..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {search.length < 2 ? (
            <CommandEmpty>Skriv minst 2 tecken för att söka</CommandEmpty>
          ) : results.length === 0 ? (
            <CommandEmpty>Inga resultat hittades</CommandEmpty>
          ) : (
            Object.entries(groupedResults).map(([type, items]) => (
              <CommandGroup key={type} heading={getGroupLabel(type as SearchResult["type"])}>
                {items.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-muted-foreground">
                      {getIcon(result.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

