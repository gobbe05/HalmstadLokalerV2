'use client'
import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { 
  Clock, 
  Plus, 
  UserPlus, 
  ArrowRight, 
  StickyNote, 
  Mail, 
  MessageSquare,
  Loader2,
  ChevronDown,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActivitiesForLead, useCreateManualActivity, useCreateTypedActivity, type Activity, type ActivityType } from "@/hooks/useActivities";
import { Textarea } from "@/components/ui/textarea";

const activityIcons: Record<ActivityType, React.ReactNode> = {
  LEAD_CREATED: <UserPlus className="w-4 h-4 text-green-500" />,
  STATUS_CHANGED: <ArrowRight className="w-4 h-4 text-blue-500" />,
  NOTE_ADDED: <StickyNote className="w-4 h-4 text-yellow-500" />,
  EMAIL_SENT: <Mail className="w-4 h-4 text-purple-500" />,
  CALL_MADE: <Phone className="w-4 h-4 text-green-600" />,
  MANUAL_ACTIVITY: <MessageSquare className="w-4 h-4 text-muted-foreground" />,
};

interface ActivityLogProps {
  leadId: string;
  listingId?: string | null;
}

export function ActivityLog({ leadId, listingId }: ActivityLogProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const { data: result, isLoading } = useActivitiesForLead(leadId, { limit: displayCount, listingId });
  const createTypedActivity = useCreateTypedActivity();
  const [activeForm, setActiveForm] = useState<"note" | "call" | "email" | null>(null);
  const [formText, setFormText] = useState("");

  const activities = result?.data || [];
  const hasMore = result?.hasMore || false;

  const handleSubmit = (type: ActivityType, prefix: string) => {
    if (!formText.trim()) return;
    
    createTypedActivity.mutate(
      { 
        leadId, 
        listingId: listingId || null,
        type,
        description: `${prefix}: ${formText.trim()}`
      },
      {
        onSuccess: () => {
          setFormText("");
          setActiveForm(null);
        },
      }
    );
  };

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 10);
  };

  const quickActions = [
    { key: "note" as const, label: "Skapa anteckning", icon: StickyNote, type: "NOTE_ADDED" as ActivityType, prefix: "Anteckning", color: "text-yellow-600" },
    { key: "call" as const, label: "Logga samtal", icon: Phone, type: "CALL_MADE" as ActivityType, prefix: "Samtal", color: "text-green-600" },
    { key: "email" as const, label: "Logga e-post", icon: Mail, type: "EMAIL_SENT" as ActivityType, prefix: "E-post", color: "text-purple-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Quick action buttons */}
      <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
        <h4 className="font-medium text-foreground text-sm">Lägg till händelse</h4>
        <div className="flex flex-wrap gap-2">
          {quickActions.map(action => (
            <Button
              key={action.key}
              variant={activeForm === action.key ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveForm(activeForm === action.key ? null : action.key)}
              className="gap-1.5 text-xs h-8"
            >
              <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
              {action.label}
            </Button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Händelsen loggas i tidslinjen</p>
      </div>

      {/* Timeline section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium text-foreground text-sm">Tidslinje</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Allt som hänt med denna lead.</p>
      </div>

      {/* Active form */}
      {activeForm && (
        <div className="bg-muted/50 p-3 rounded-lg space-y-2 border">
          <Textarea
            placeholder={
              activeForm === "note" ? "Skriv din anteckning..." :
              activeForm === "call" ? "Vad pratade ni om?" :
              "Vad handlade e-posten om?"
            }
            value={formText}
            onChange={(e) => setFormText(e.target.value)}
            className="min-h-[60px] text-sm bg-background"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setActiveForm(null);
                setFormText("");
              }
            }}
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => {
                const action = quickActions.find(a => a.key === activeForm);
                if (action) handleSubmit(action.type, action.prefix);
              }}
              disabled={!formText.trim() || createTypedActivity.isPending}
              className="h-8"
            >
              {createTypedActivity.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Spara"
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setActiveForm(null);
                setFormText("");
              }}
              className="h-8"
            >
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Laddar aktiviteter...
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-2">
          <div className="max-h-[200px] overflow-y-auto space-y-2">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} leadId={leadId} listingId={listingId} />
            ))}
          </div>
          {hasMore && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShowMore}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="w-3 h-3 mr-1" />
              Visa fler
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic py-2">
          Ingen aktivitet registrerad ännu.
        </p>
      )}
    </div>
  );
}

interface ActivityItemProps {
  activity: Activity;
  leadId: string;
  listingId?: string | null;
}

function ActivityItem({ activity, leadId, listingId }: ActivityItemProps) {
  // Determine if this activity is from the lead or listing
  const isFromLead = activity.lead_id === leadId;
  const isFromListing = !isFromLead && activity.listing_id === listingId;

  return (
    <div className="flex items-start gap-3 text-sm py-2 border-l-2 border-muted pl-4 ml-2 hover:bg-muted/30 transition-colors rounded-r-md">
      <div className="mt-0.5">
        {activityIcons[activity.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">
          {format(new Date(activity.created_at), "d MMM yyyy 'kl.' HH:mm", { locale: sv })}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-foreground">{activity.description}</p>
          {isFromListing && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium whitespace-nowrap">
              Objekt
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

