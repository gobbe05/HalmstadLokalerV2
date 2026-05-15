'use client'
import { useState, useMemo, useEffect } from "react";
import { Search, Trash2, ExternalLink, ChevronDown, ChevronUp, Phone, Mail, Building2, MessageSquare, Send, StickyNote, Save, MapPin, Calendar, FileText } from "lucide-react";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLeads, useUpdateLeadStatus, useUpdateLeadNotes, useDeleteLead, type LeadStatus, type LeadType } from "@/hooks/useLeads";
import { useListings } from "@/hooks/useListings";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ActivityLog } from "./ActivityLog";
import { useRouter, useSearchParams } from "next/navigation";

const statusOptions = [
  { value: "all", label: "Visa alla" },
  { value: "new", label: "Endast nya" },
  { value: "contacted", label: "Kontaktade" },
  { value: "viewing", label: "Visning bokad" },
  { value: "negotiating", label: "Förhandling" },
  { value: "won", label: "Lokal uthyrd" },
  { value: "lost", label: "Förlorade" },
];

const statusLabels: Record<LeadStatus, string> = {
  new: "Ny",
  contacted: "Kontaktad",
  viewing: "Visning",
  negotiating: "Förhandling",
  won: "Lokal uthyrd",
  lost: "Förlorad",
};

const statusColors: Record<LeadStatus, string> = {
  new: "bg-status-new-bg text-status-new-text",
  contacted: "bg-status-contacted-bg text-status-contacted-text",
  viewing: "bg-status-viewing-bg text-status-viewing-text",
  negotiating: "bg-status-negotiating-bg text-status-negotiating-text",
  won: "bg-status-won-bg text-status-won-text",
  lost: "bg-status-lost-bg text-status-lost-text",
};

interface LeadsViewProps {
  viewToggle?: React.ReactNode;
}

export function LeadsView({ viewToggle }: LeadsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: leads, isLoading } = useLeads();
  const { data: listings } = useListings();
  const updateStatus = useUpdateLeadStatus();
  const updateNotes = useUpdateLeadNotes();
  const deleteLead = useDeleteLead();

  const [statusFilter, setStatusFilter] = useState("all");
  const [listingFilter, setListingFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  // Auto-expand lead from URL query parameter
  useEffect(() => {
    const leadId = searchParams.get("leadId");
    if (leadId && leads?.some(l => l.id === leadId)) {
      setExpandedLead(leadId);
    }
  }, [searchParams, leads]);

  const handleNotesChange = (leadId: string, value: string) => {
    setEditingNotes(prev => ({ ...prev, [leadId]: value }));
  };

  const saveNotes = (leadId: string) => {
    const notes = editingNotes[leadId];
    if (notes !== undefined) {
      updateNotes.mutate(
        { id: leadId, notes },
        {
          onSuccess: () => {
            // Clear the editing state after successful save so the field shows
            // the persisted value from the database
            setEditingNotes((prev) => {
              const next = { ...prev };
              delete next[leadId];
              return next;
            });
          },
        }
      );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLead(expandedLead === id ? null : id);
  };

  const filteredLeads = useMemo(() => {
    return (leads || []).filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }
      if (listingFilter !== "all" && lead.listing_id !== listingFilter) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const haystack = [
          lead.contact_name,
          lead.company_name,
          lead.listing?.titel,
          lead.listing?.stad,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      }
      return true;
    });
  }, [leads, statusFilter, listingFilter, searchTerm]);

  const toggleLead = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  const handleStatusChange = (leadId: string, newStatus: LeadStatus, oldStatus: LeadStatus) => {
    updateStatus.mutate({ id: leadId, status: newStatus, oldStatus });
  };

  const handleDeleteSelected = () => {
    setDeleteIds(Array.from(selectedLeads));
  };

  const confirmDelete = () => {
    deleteIds.forEach((id) => {
      deleteLead.mutate(id);
    });
    setSelectedLeads(new Set());
    setDeleteIds([]);
  };

  // Mobile card for each lead - compact style matching listings
  const LeadCard = ({ lead }: { lead: typeof filteredLeads[0] }) => {
    const isExpanded = expandedLead === lead.id;
    
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Compact header row */}
        <div 
          className="p-3 flex items-center gap-3 cursor-pointer"
          onClick={() => toggleExpand(lead.id)}
        >
          {/* Expand icon */}
          <div className="shrink-0 text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-sm truncate">{lead.contact_name}</span>
              {lead.company_name && (
                <span className="text-xs text-muted-foreground truncate hidden xs:inline">· {lead.company_name}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {lead.lead_type === "matching" ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0">
                  Lokalmatchning
                </Badge>
              ) : lead.listing && (
                <span className="text-xs text-muted-foreground truncate">{lead.listing.titel}</span>
              )}
              <span className="text-[10px] text-muted-foreground/70 shrink-0">
                {format(new Date(lead.created_at), "d MMM", { locale: sv })}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <Badge className={`${statusColors[lead.status]} text-[10px] px-1.5 py-0 shrink-0`}>
            {statusLabels[lead.status]}
          </Badge>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-2 border-t border-border bg-muted/30 space-y-3">
            {/* Matching info for lokalmatchning leads */}
            {lead.lead_type === "matching" && (
              <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-3 text-xs space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Sökkritierier
                </div>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 opacity-50" />
                    <span>
                      <strong>Yta:</strong>{" "}
                      {lead.min_area_sqm && lead.max_area_sqm
                        ? `${lead.min_area_sqm} - ${lead.max_area_sqm} kvm`
                        : lead.min_area_sqm
                          ? `Minst ${lead.min_area_sqm} kvm`
                          : lead.max_area_sqm
                            ? `Max ${lead.max_area_sqm} kvm`
                            : "Ej angivet"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 opacity-50" />
                    <span>
                      <strong>Behov:</strong>{" "}
                      {lead.move_within_months
                        ? `Inom ${lead.move_within_months} månader`
                        : "Ej angivet"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 opacity-50" />
                    <span>
                      <strong>Uppsagt:</strong>{" "}
                      {lead.lease_status === "ja"
                        ? "Ja"
                        : lead.lease_status === "nej"
                          ? "Nej"
                          : lead.lease_status === "nyetablering"
                            ? "Nyetablering"
                            : "Ej angivet"}
                    </span>
                  </div>
                  {lead.org_number && (
                    <div>
                      <strong>Org.nr:</strong> {lead.org_number}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick actions row */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Select
                value={lead.status}
                onValueChange={(value) => handleStatusChange(lead.id, value as LeadStatus, lead.status)}
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(statusLabels) as LeadStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Checkbox
                checked={selectedLeads.has(lead.id)}
                onCheckedChange={() => toggleLead(lead.id)}
              />
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap gap-2 text-xs">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-primary hover:underline bg-primary/5 px-2 py-1 rounded">
                  <Phone className="w-3 h-3" />
                  {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-primary hover:underline bg-primary/5 px-2 py-1 rounded">
                  <Mail className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">{lead.email}</span>
                </a>
              )}
            </div>

            {/* Message if exists */}
            {lead.message && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-start gap-2">
                <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{lead.message}</span>
              </div>
            )}

            {/* Send email button */}
            {lead.email && (
              <Button asChild size="sm" className="w-full gap-2 h-8 text-xs">
                <a href={`mailto:${lead.email}?subject=Angående ${lead.listing?.titel || 'er förfrågan'}`}>
                  <Send className="w-3 h-3" />
                  Skicka e-post
                </a>
              </Button>
            )}

            {/* Activity log */}
            <div className="pt-1">
              <ActivityLog leadId={lead.id} listingId={lead.listing_id} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="flex flex-col h-full min-h-0">
      {/* Sticky header section */}
      <div className="sticky top-0 z-10 bg-background px-4 md:px-8 pt-6 pb-4 shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-foreground">Mina leads</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Allt som rör dina leads, på ett ställe. Hantera status, skriv anteckningar och följ processen i en tydlig tidslinje.
            </p>
          </div>
          {viewToggle}
        </div>

        {/* Filter row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={listingFilter} onValueChange={setListingFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Alla objekt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla objekt</SelectItem>
                {listings?.map((listing) => (
                  <SelectItem key={listing.id} value={listing.id}>
                    {listing.titel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center flex-1 border border-input rounded-md bg-card px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Sök på namn, företag eller annons"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full outline-none text-sm text-foreground placeholder:text-muted-foreground bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-6 min-h-0">
        {/* Mobile cards view */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Laddar...</div>
          ) : filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Inga leads att visa.
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden shadow-sm border-l-2 border-l-teal-500">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between text-sm">
          <div className="font-semibold text-foreground">
            Intresseanmälningar{" "}
            {filteredLeads.length > 0 && (
              <span className="text-muted-foreground font-normal">
                ({filteredLeads.length})
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold w-8"></th>
                <th className="px-3 py-2 font-semibold">Kontakt</th>
                <th className="px-3 py-2 font-semibold">Objekt</th>
                <th className="px-3 py-2 font-semibold">Meddelande</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Laddar...
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const isExpanded = expandedLead === lead.id;
                  return (
                    <>
                      <tr 
                        key={lead.id} 
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(lead.id)}
                      >
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium">{lead.contact_name}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {lead.company_name && <span>{lead.company_name}</span>}
                              {lead.company_name && <span>·</span>}
                              <span>{format(new Date(lead.created_at), "d MMM", { locale: sv })}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {lead.lead_type === "matching" ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                              Lokalmatchning
                            </Badge>
                          ) : lead.listing ? (
                            <span className="text-sm">{lead.listing.titel}</span>
                          ) : (
                            <span className="italic text-sm">Lokal borttagen</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground max-w-[200px]">
                          {lead.message ? (
                            <TruncatedText text={lead.message} maxLength={40} />
                          ) : (
                            <span className="text-muted-foreground/50 italic text-sm">–</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={lead.status}
                            onValueChange={(value) => handleStatusChange(lead.id, value as LeadStatus, lead.status)}
                          >
                            <SelectTrigger className="h-7 w-28 text-xs">
                              <Badge className={`${statusColors[lead.status]} text-xs`}>
                                {statusLabels[lead.status]}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(statusLabels) as LeadStatus[]).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {statusLabels[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={() => toggleLead(lead.id)}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${lead.id}-expanded`} className="bg-muted/30">
                          <td colSpan={6} className="px-4 py-4">
                            {/* Matching info for lokalmatchning leads */}
                            {lead.lead_type === "matching" && (
                              <div className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4 mb-4">
                                <h4 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  Sökkritierier
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-4 h-4 opacity-50" />
                                    <span>
                                      <strong>Önskad yta:</strong>{" "}
                                      {lead.min_area_sqm && lead.max_area_sqm
                                        ? `${lead.min_area_sqm} - ${lead.max_area_sqm} kvm`
                                        : lead.min_area_sqm
                                          ? `Minst ${lead.min_area_sqm} kvm`
                                          : lead.max_area_sqm
                                            ? `Max ${lead.max_area_sqm} kvm`
                                            : "Ej angivet"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4 opacity-50" />
                                    <span>
                                      <strong>Behov:</strong>{" "}
                                      {lead.move_within_months
                                        ? `Inom ${lead.move_within_months} månader`
                                        : "Ej angivet"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <FileText className="w-4 h-4 opacity-50" />
                                    <span>
                                      <strong>Uppsagt:</strong>{" "}
                                      {lead.lease_status === "ja"
                                        ? "Ja"
                                        : lead.lease_status === "nej"
                                          ? "Nej"
                                          : lead.lease_status === "nyetablering"
                                            ? "Nyetablering"
                                            : "Ej angivet"}
                                    </span>
                                  </div>
                                </div>
                                {lead.org_number && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    <strong>Org.nummer:</strong> {lead.org_number}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Kundens data - vad de sa */}
                            <div className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    Kontaktuppgifter till kund
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    {lead.phone && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4 opacity-50" />
                                        <a href={`tel:${lead.phone}`} className="hover:text-primary hover:underline">
                                          {lead.phone}
                                        </a>
                                      </div>
                                    )}
                                    {lead.email && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-4 h-4 opacity-50" />
                                        <a href={`mailto:${lead.email}`} className="hover:text-primary hover:underline">
                                          {lead.email}
                                        </a>
                                      </div>
                                    )}
                                    {lead.company_name && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Building2 className="w-4 h-4 opacity-50" />
                                        <span>{lead.company_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    Meddelande från kund
                                  </h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {lead.message || "Inget meddelande"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-6">
                              <ActivityLog leadId={lead.id} listingId={lead.listing_id} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Inga leads att visa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedLeads.size > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <div>{selectedLeads.size} lead(s) markerade</div>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 text-destructive hover:underline"
            >
              <Trash2 className="w-4 h-4" />
              Ta bort markerade
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Mobile delete action bar */}
      {selectedLeads.size > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{selectedLeads.size} markerade</span>
          <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
            <Trash2 className="w-4 h-4 mr-2" />
            Ta bort
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteIds.length > 0} onOpenChange={() => setDeleteIds([])}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort leads?</AlertDialogTitle>
            <AlertDialogDescription>
              Du håller på att ta bort {deleteIds.length} lead(s). Detta går inte att ångra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="w-full sm:w-auto">Ta bort</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
