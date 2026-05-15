'use client'
import { useState, useMemo } from "react";
import { Search, Calendar, Trash2, Star } from "lucide-react";
import { StatusBadge, LeadStatus } from "./StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";

interface Lead {
  id: string;
  created_at: string;
  contact_name: string;
  company_name: string;
  phone: string;
  email: string;
  listing_title: string;
  city: string;
  space_type: string;
  area_sqm: number;
  status: LeadStatus;
}

const initialLeads: Lead[] = [
  {
    id: "lead_1",
    created_at: "2025-02-10",
    contact_name: "Jesper Johansson",
    company_name: "Spotify",
    phone: "0762-12 34 56",
    email: "jesper.johansson@spotify.se",
    listing_title: "Kontor, Uppköparvägen 7",
    city: "Stockholm",
    space_type: "Kontor",
    area_sqm: 160,
    status: "new",
  },
  {
    id: "lead_2",
    created_at: "2025-02-09",
    contact_name: "Maria Svensson",
    company_name: "ABB",
    phone: "0787-15 16 47",
    email: "maria.svensson@abb.com",
    listing_title: "Verkstadslokal, Storalastvägen 1",
    city: "Uppsala",
    space_type: "Verkstadslokal",
    area_sqm: 1500,
    status: "contacted",
  },
  {
    id: "lead_3",
    created_at: "2025-02-07",
    contact_name: "Anders Andersson",
    company_name: "Sweoffice",
    phone: "0798-13 34 64",
    email: "anders@sweoffice.se",
    listing_title: "Kontor / Lager, Materialgatan 14",
    city: "Malmö",
    space_type: "Kontor / Lager",
    area_sqm: 300,
    status: "viewing",
  },
];

const statusOptions = [
  { value: "all", label: "Visa alla" },
  { value: "new", label: "Endast nya" },
  { value: "contacted", label: "Kontaktade" },
  { value: "viewing", label: "Visning bokad" },
  { value: "negotiating", label: "Förhandling" },
  { value: "won", label: "Kontrakt" },
  { value: "lost", label: "Förlorade" },
];

export function LeadsTable() {
  const [leads] = useState<Lead[]>(initialLeads);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const haystack = [
          lead.contact_name,
          lead.company_name,
          lead.listing_title,
          lead.city,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      }

      return true;
    });
  }, [leads, statusFilter, searchTerm]);

  const newLeadsCount = leads.filter((l) => l.status === "new").length;

  const toggleLead = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  return (
    <section className="flex-1 px-8 py-6">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-input bg-card text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex items-center flex-1 max-w-md border border-input rounded-md bg-card px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Sök på namn, företag eller annons"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none text-sm text-foreground placeholder:text-muted-foreground bg-transparent"
          />
        </div>

        <button className="flex items-center gap-2 border border-input rounded-md bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <span>Datumintervall</span>
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between text-sm">
          <div className="font-semibold text-foreground">
            Intresseanmälningar{" "}
            {filteredLeads.length > 0 && (
              <span className="text-muted-foreground font-normal">
                ({filteredLeads.length})
              </span>
            )}
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
            Exportera
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Datum</th>
                <th className="px-4 py-2 font-semibold">Kontakt</th>
                <th className="px-4 py-2 font-semibold">Telefon</th>
                <th className="px-4 py-2 font-semibold">E-post</th>
                <th className="px-4 py-2 font-semibold">Annons</th>
                <th className="px-4 py-2 font-semibold">Lokaltyp</th>
                <th className="px-4 py-2 font-semibold">Yta</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 text-center font-semibold">Välj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {lead.created_at}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-foreground">
                      {lead.contact_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lead.company_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {lead.phone}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {lead.email}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-foreground underline cursor-pointer hover:text-primary transition-colors">
                      {lead.listing_title}
                    </div>
                    <div className="text-xs text-muted-foreground">{lead.city}</div>
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {lead.space_type}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {lead.area_sqm} m²
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 align-middle text-center">
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => toggleLead(lead.id)}
                    />
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Inga leads att visa med valda filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
          <div>
            {filteredLeads.length > 0
              ? `Visar ${filteredLeads.length} lead(s).`
              : "Inga leads att visa ännu."}
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Ta bort valda</span>
            </button>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Star className="w-3.5 h-3.5" />
              <span>Spara till mina leads</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

