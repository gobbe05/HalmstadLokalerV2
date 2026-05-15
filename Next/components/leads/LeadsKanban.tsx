'use client'
import { useState } from "react";
import { useLeads, useUpdateLeadStatus, useUpdateLeadNotes, useDeleteLead, LeadStatus, LeadWithListing } from "@/hooks/useLeads";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MessageSquare, 
  MoreHorizontal,
  Trash2,
  Calendar,
  FileText,
  ChevronRight,
  Plus,
  Loader2,
  Clock
} from "lucide-react";
import { 
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useActivitiesForLead, useCreateManualActivity, type ActivityType } from "@/hooks/useActivities";

const PIPELINE_STAGES: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "Ny", color: "bg-blue-500" },
  { status: "contacted", label: "Kontaktad", color: "bg-yellow-500" },
  { status: "viewing", label: "Visning", color: "bg-purple-500" },
  { status: "negotiating", label: "Förhandling", color: "bg-orange-500" },
  { status: "won", label: "Lokal uthyrd", color: "bg-green-500" },
  { status: "lost", label: "Förlorad", color: "bg-red-500" },
];

interface LeadCardProps {
  lead: LeadWithListing;
  onDelete: () => void;
  onClick: () => void;
}

function LeadCard({ lead, onDelete, onClick }: LeadCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all bg-card border border-border"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              {lead.contact_name}
            </div>
            {lead.company_name && (
              <div className="text-xs text-muted-foreground truncate">
                {lead.company_name}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {lead.email && (
                <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                  <a href={`mailto:${lead.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Skicka e-post
                  </a>
                </DropdownMenuItem>
              )}
              {lead.phone && (
                <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                  <a href={`tel:${lead.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Ring
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ta bort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {lead.listing && (
          <a
            href={`/app/lokaler/${lead.listing_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.listing.titel}</span>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
          </a>
        )}

        {lead.message && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {lead.message.length > 80 ? lead.message.slice(0, 80) + "..." : lead.message}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(lead.created_at), "d MMM", { locale: sv })}
          </span>
          <div className="flex items-center gap-2">
            {lead.email && <Mail className="h-3 w-3" />}
            {lead.phone && <Phone className="h-3 w-3" />}
            {lead.notes && (
              <span className="flex items-center gap-1 text-primary">
                <FileText className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity icons
const activityIcons: Record<ActivityType, React.ReactNode> = {
  LEAD_CREATED: <User className="w-3.5 h-3.5 text-green-500" />,
  STATUS_CHANGED: <Clock className="w-3.5 h-3.5 text-blue-500" />,
  NOTE_ADDED: <FileText className="w-3.5 h-3.5 text-yellow-500" />,
  EMAIL_SENT: <Mail className="w-3.5 h-3.5 text-purple-500" />,
  CALL_MADE: <Phone className="w-3.5 h-3.5 text-green-600" />,
  MANUAL_ACTIVITY: <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />,
};

interface LeadDetailDialogProps {
  lead: LeadWithListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: LeadStatus) => void;
}

function LeadDetailDialog({ lead, open, onOpenChange, onStatusChange }: LeadDetailDialogProps) {
  const updateNotes = useUpdateLeadNotes();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(10);
  const { data: result, isLoading: activitiesLoading } = useActivitiesForLead(lead?.id || null, { limit: displayCount });
  const createManualActivity = useCreateManualActivity();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState("");

  const activities = result?.data || [];
  const hasMore = result?.hasMore || false;

  if (!lead) return null;

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.status === lead.status);
  const currentStage = PIPELINE_STAGES[currentStageIndex];

  const handleAddActivity = () => {
    if (!newActivity.trim() || !lead) return;
    
    createManualActivity.mutate(
      { 
        leadId: lead.id, 
        listingId: lead.listing_id,
        description: newActivity.trim() 
      },
      {
        onSuccess: () => {
          setNewActivity("");
          setShowAddActivity(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {lead.contact_name}
          </DialogTitle>
          {lead.company_name && (
            <DialogDescription>{lead.company_name}</DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className={`${currentStage?.color} text-white`}>
                {currentStage?.label}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Kontaktuppgifter</h4>
              <div className="grid gap-2">
                {lead.email && (
                  <a 
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a 
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {lead.phone}
                  </a>
                )}
              </div>
            </div>

            {lead.listing && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Lokal</h4>
                <a 
                  href={`/app/lokaler/${lead.listing_id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  <span>{lead.listing.titel}</span>
                  {lead.listing.stad && <span className="text-xs">• {lead.listing.stad}</span>}
                  <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Message */}
            {lead.message && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Meddelande
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {lead.message}
                </p>
              </div>
            )}

            {/* Date */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Mottagen: {format(new Date(lead.created_at), "d MMMM yyyy 'kl.' HH:mm", { locale: sv })}
            </div>

            {/* Quick Status Change */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Ändra status</h4>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.filter(s => s.status !== lead.status).map(stage => (
                  <Button
                    key={stage.status}
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(stage.status)}
                    className="text-xs"
                  >
                    <span className={`w-2 h-2 rounded-full ${stage.color} mr-2`} />
                    {stage.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {lead.email && (
                <Button asChild size="sm">
                  <a href={`mailto:${lead.email}?subject=Angående ${lead.listing?.titel || 'er förfrågan'}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Skicka e-post
                  </a>
                </Button>
              )}
              {lead.phone && (
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${lead.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Ring
                  </a>
                </Button>
              )}
            </div>

            {/* Activity Log */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Aktivitetslogg
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddActivity(!showAddActivity)}
                  className="gap-1 text-xs h-7"
                >
                  <Plus className="w-3 h-3" />
                  Lägg till
                </Button>
              </div>

              {showAddActivity && (
                <div className="flex gap-2 items-center bg-muted/50 p-2 rounded-md">
                  <Input
                    placeholder="T.ex. Ringde kunden..."
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    className="text-sm h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddActivity();
                      if (e.key === "Escape") setShowAddActivity(false);
                    }}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddActivity}
                    disabled={!newActivity.trim() || createManualActivity.isPending}
                    className="h-8"
                  >
                    {createManualActivity.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Spara"
                    )}
                  </Button>
                </div>
              )}

              {activitiesLoading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Laddar...
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-2">
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/30">
                        <div className="mt-0.5">
                          {activityIcons[activity.type as ActivityType] || <MessageSquare className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-xs">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), "d MMM 'kl.' HH:mm", { locale: sv })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMore && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDisplayCount(prev => prev + 10)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Visa fler
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  Ingen aktivitet ännu.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface KanbanColumnProps {
  stage: typeof PIPELINE_STAGES[0];
  leads: LeadWithListing[];
  onLeadClick: (lead: LeadWithListing) => void;
  onDeleteLead: (lead: LeadWithListing) => void;
}

function KanbanColumn({ stage, leads, onLeadClick, onDeleteLead }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-72 bg-muted/30 rounded-lg flex flex-col">
      {/* Column Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
            <span className="font-medium text-sm">{stage.label}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 h-[calc(100vh-320px)] min-h-[400px]">
        <div className="p-2 space-y-2">
          {leads.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
              Inga leads
            </div>
          ) : (
            leads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead)}
                onDelete={() => onDeleteLead(lead)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function LeadsKanban() {
  const { data: leads, isLoading } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const deleteLead = useDeleteLead();
  const [selectedLead, setSelectedLead] = useState<LeadWithListing | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads?.filter(lead => lead.status === status) || [];
  };

  const handleDelete = (lead: LeadWithListing) => {
    if (confirm(`Är du säker på att du vill ta bort lead "${lead.contact_name}"?`)) {
      deleteLead.mutate(lead.id);
    }
  };

  const handleStatusChange = (status: LeadStatus) => {
    if (selectedLead) {
      updateStatus.mutate({ 
        id: selectedLead.id, 
        status, 
        oldStatus: selectedLead.status 
      });
      setSelectedLead({ ...selectedLead, status });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalLeads = leads?.length || 0;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {totalLeads} {totalLeads === 1 ? "lead" : "leads"} totalt
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.status}
            stage={stage}
            leads={getLeadsByStatus(stage.status)}
            onLeadClick={(lead) => {
              setSelectedLead(lead);
              setDialogOpen(true);
            }}
            onDeleteLead={handleDelete}
          />
        ))}
      </div>

      <LeadDetailDialog
        lead={selectedLead}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}

