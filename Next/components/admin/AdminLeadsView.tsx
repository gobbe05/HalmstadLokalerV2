'use client'
/**
 * ADMIN ONLY: Leads view for Admin portal.
 * 
 * SECURITY: This component uses useAdminLeads which fetches ALL leads
 * across all advertisers. Only use in /admin/* routes.
 */

import { useState, useMemo } from "react";
import { Search, Trash2, ExternalLink, ChevronDown, ChevronUp, Phone, Mail, Building2, MessageSquare, Send, StickyNote, Save, Calendar, MapPin, FileText, Tag } from "lucide-react";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAdminLeads } from "@/hooks/useAdminLeads";
import { useAdminListings } from "@/hooks/useAdminListings";
import { useUpdateLeadStatus, useUpdateLeadNotes, useDeleteLead, type LeadStatus } from "@/hooks/useLeads";
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
import { ActivityLog } from "@/components/leads/ActivityLog";
import { useRouter } from "next/navigation";

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

export function AdminLeadsView() {
  const router = useRouter();
  // ADMIN: Use admin hooks that fetch ALL data
  const { data: leads, isLoading } = useAdminLeads();
  const { data: listings } = useAdminListings();
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

  const handleNotesChange = (leadId: string, value: string) => {
    setEditingNotes(prev => ({ ...prev, [leadId]: value }));
  };

  const saveNotes = (leadId: string) => {
    const notes = editingNotes[leadId];
    if (notes !== undefined) {
      updateNotes.mutate({ id: leadId, notes });
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

  return (
    <section className="flex-1">
      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
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

      {/* Desktop table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between text-sm">
          <div className="font-semibold text-foreground">
            Alla intresseanmälningar{" "}
            {filteredLeads.length > 0 && (
              <span className="text-muted-foreground font-normal">
                ({filteredLeads.length})
              </span>
            )}
          </div>
          {selectedLeads.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteSelected}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Ta bort ({selectedLeads.size})
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold w-8"></th>
                <th className="px-4 py-2 font-semibold">Datum</th>
                <th className="px-4 py-2 font-semibold">Typ</th>
                <th className="px-4 py-2 font-semibold">Kontakt</th>
                <th className="px-4 py-2 font-semibold">Objekt</th>
                <th className="px-4 py-2 font-semibold">Annonsör</th>
                <th className="px-4 py-2 font-semibold">Meddelande</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 text-center font-semibold">Välj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Laddar...
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead: any) => {
                  const isExpanded = expandedLead === lead.id;
                  return (
                    <>
                      <tr 
                        key={lead.id} 
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(lead.id)}
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(lead.created_at), "d MMM yyyy", { locale: sv })}
                        </td>
                        <td className="px-4 py-3">
                          {lead.lead_type === "matching_widget" ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">
                              Matchning
                            </Badge>
                          ) : lead.lead_type === "matching" ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px]">
                              Lokalmatchning
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">
                              Objekt
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{lead.contact_name}</div>
                          {lead.company_name && (
                            <div className="text-xs text-muted-foreground">{lead.company_name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.listing ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/lokaler/${lead.listing_id}`);
                              }}
                              className="flex items-center gap-1 font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {lead.listing.titel}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground italic">Lokal borttagen</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.listing?.advertiser_company || lead.listing?.advertiser_name ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (lead.listing?.owner_id) {
                                  router.push(`/admin/kunder/${lead.listing.owner_id}`);
                                }
                              }}
                              className="text-sm text-muted-foreground hover:text-primary hover:underline"
                            >
                              {lead.listing.advertiser_company || lead.listing.advertiser_name}
                            </button>
                          ) : (
                            <span className="text-muted-foreground/50 italic">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[180px]">
                          {lead.message ? (
                            <TruncatedText text={lead.message} maxLength={50} />
                          ) : (
                            <span className="text-muted-foreground/50 italic">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={lead.status}
                            onValueChange={(value) => handleStatusChange(lead.id, value as LeadStatus, lead.status)}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <Badge className={`${statusColors[lead.status]} text-[10px]`}>
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
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={() => toggleLead(lead.id)}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${lead.id}-expanded`} className="bg-muted/30">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Contact Info */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-foreground text-sm">Kontaktuppgifter</h4>
                                <div className="space-y-2 text-sm">
                                  {lead.phone && (
                                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                                      <Phone className="w-4 h-4" />
                                      {lead.phone}
                                    </a>
                                  )}
                                  {lead.email && (
                                    <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-primary hover:underline">
                                      <Mail className="w-4 h-4" />
                                      {lead.email}
                                    </a>
                                  )}
                                  {lead.company_name && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Building2 className="w-4 h-4" />
                                      {lead.company_name}
                                    </div>
                                  )}
                                </div>
                                {lead.email && (
                                  <Button asChild size="sm" className="mt-2 gap-2">
                                    <a href={`mailto:${lead.email}?subject=Angående ${lead.listing?.titel || 'er förfrågan'}`}>
                                      <Send className="w-4 h-4" />
                                      Skicka e-post
                                    </a>
                                  </Button>
                                )}
                              </div>

                              {/* Matching widget info */}
                              {(lead.lead_type === "matching_widget" || lead.preferred_property_types || lead.preferred_area_range) && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-blue-600" />
                                    Matchningsförfrågan
                                  </h4>
                                  <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-3 text-sm space-y-1.5">
                                    {lead.preferred_property_types && (
                                      <div className="flex items-start gap-2 text-muted-foreground">
                                        <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <span><strong>Lokaltyper:</strong> {lead.preferred_property_types}</span>
                                      </div>
                                    )}
                                    {lead.preferred_area_range && (
                                      <div className="flex items-start gap-2 text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <span><strong>Storlek:</strong> {lead.preferred_area_range}</span>
                                      </div>
                                    )}
                                    {lead.min_area_sqm != null && (
                                      <div className="flex items-start gap-2 text-muted-foreground">
                                        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <span><strong>Yta:</strong> {lead.min_area_sqm}{lead.max_area_sqm ? ` – ${lead.max_area_sqm}` : '+'} kvm</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Message */}
                              {lead.message && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Meddelande
                                  </h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-3 rounded-md border">
                                    {lead.message}
                                  </p>
                                </div>
                              )}

                              {/* Notes */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                  <StickyNote className="w-4 h-4" />
                                  Anteckningar
                                </h4>
                                <Textarea
                                  placeholder="Skriv anteckningar om denna kund..."
                                  value={editingNotes[lead.id] ?? lead.notes ?? ""}
                                  onChange={(e) => handleNotesChange(lead.id, e.target.value)}
                                  className="min-h-[80px] text-sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => saveNotes(lead.id)}
                                  disabled={updateNotes.isPending || editingNotes[lead.id] === undefined}
                                  className="gap-2"
                                >
                                  <Save className="w-4 h-4" />
                                  Spara anteckning
                                </Button>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-border">
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
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Inga leads att visa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIds.length > 0} onOpenChange={() => setDeleteIds([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort leads</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort {deleteIds.length} lead(s)? Detta kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

