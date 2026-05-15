'use client'
import { ArrowLeft, Phone, Mail, Building2, MessageSquare, Send, Calendar, Loader2, User, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLeads, useUpdateLeadStatus, useUpdateLeadNotes, type LeadStatus } from "@/hooks/useLeads";
import { ActivityLog } from "@/components/leads/ActivityLog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const statusLabels: Record<LeadStatus, string> = {
  new: "Ny",
  contacted: "Kontaktad",
  viewing: "Visning",
  negotiating: "Förhandling",
  won: "Lokal uthyrd",
  lost: "Förlorad",
};

const statusColors: Record<LeadStatus, string> = {
  new: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  viewing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  negotiating: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  won: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  lost: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function AppLeadDetailPage() {
  const router = useRouter();
  const {id} = useParams();
  const { data: leads, isLoading } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const updateNotes = useUpdateLeadNotes();
  
  const lead = leads?.find(l => l.id === id);
  
  const [editingNotes, setEditingNotes] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (lead) {
      setEditingNotes(lead.notes || "");
    }
  }, [lead]);

  const handleNotesChange = (value: string) => {
    setEditingNotes(value);
    setHasChanges(value !== (lead?.notes || ""));
  };

  const saveNotes = () => {
    if (id && hasChanges) {
      updateNotes.mutate(
        { id, notes: editingNotes },
        {
          onSuccess: () => {
            setHasChanges(false);
          },
        }
      );
    }
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    if (id && lead) {
      updateStatus.mutate({ id, status: newStatus, oldStatus: lead.status });
    }
  };

  const basePath = location.pathname.startsWith("/admin") ? "/admin" : "/app";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!lead) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.push(`${basePath}/leads`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-medium text-foreground">Lead hittades inte</h1>
          </div>
          <p className="text-muted-foreground">Leadet du söker finns inte eller har tagits bort.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(`${basePath}/leads`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-medium text-foreground">
                {lead.contact_name}
              </h1>
              <Badge className={statusColors[lead.status]}>
                {statusLabels[lead.status]}
              </Badge>
            </div>
            {lead.company_name && (
              <p className="text-muted-foreground">{lead.company_name}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact info card */}
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Kontaktuppgifter
              </h2>
              <div className="space-y-3">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-3 text-primary hover:underline">
                    <Phone className="w-4 h-4" />
                    {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-3 text-primary hover:underline">
                    <Mail className="w-4 h-4" />
                    {lead.email}
                  </a>
                )}
                {lead.company_name && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    {lead.company_name}
                  </div>
                )}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Inkom {format(new Date(lead.created_at), "d MMMM yyyy 'kl.' HH:mm", { locale: sv })}
                </div>
              </div>
              
              {lead.email && (
                <Button asChild className="w-full mt-4 gap-2">
                  <a href={`mailto:${lead.email}?subject=Angående ${lead.listing?.titel || 'er förfrågan'}`}>
                    <Send className="w-4 h-4" />
                    Skicka e-post
                  </a>
                </Button>
              )}
            </div>

            {/* Message card */}
            {lead.message && (
              <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Meddelande från kunden
                </h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{lead.message}</p>
              </div>
            )}

            {/* Notes card */}
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Anteckning
              </h2>
              <Textarea
                value={editingNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Skriv anteckningar om denna lead..."
                className="min-h-[100px] mb-3"
              />
              <Button 
                onClick={saveNotes} 
                disabled={!hasChanges || updateNotes.isPending}
                size="sm"
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {updateNotes.isPending ? "Sparar..." : "Spara anteckning"}
              </Button>
            </div>

            {/* Activity log */}
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <ActivityLog leadId={lead.id} listingId={lead.listing_id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status card */}
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <h2 className="font-medium text-foreground mb-4">Status</h2>
              <Select value={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
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
            </div>

            {/* Listing card */}
            {lead.listing && (
              <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                <h2 className="font-medium text-foreground mb-4">Lokal</h2>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{lead.listing.titel}</p>
                  {lead.listing.stad && (
                    <p className="text-sm text-muted-foreground">{lead.listing.stad}</p>
                  )}
                  {lead.listing.typ && (
                    <p className="text-sm text-muted-foreground">{lead.listing.typ}</p>
                  )}
                  {lead.listing.area_sqm && (
                    <p className="text-sm text-muted-foreground">{lead.listing.area_sqm} m²</p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 gap-2"
                    onClick={() => router.push(`${basePath}/lokaler/${lead.listing_id}`)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visa lokal
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
