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
  Eye,
  FileText,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActivitiesForListing, useCreateManualActivity, type Activity, type ActivityType } from "@/hooks/useActivities";

const activityIcons: Record<ActivityType | string, React.ReactNode> = {
  LEAD_CREATED: <UserPlus className="w-4 h-4 text-green-500" />,
  STATUS_CHANGED: <ArrowRight className="w-4 h-4 text-blue-500" />,
  NOTE_ADDED: <StickyNote className="w-4 h-4 text-yellow-500" />,
  EMAIL_SENT: <Mail className="w-4 h-4 text-purple-500" />,
  MANUAL_ACTIVITY: <MessageSquare className="w-4 h-4 text-muted-foreground" />,
  view: <Eye className="w-4 h-4 text-cyan-500" />,
  contact: <FileText className="w-4 h-4 text-orange-500" />,
};

interface ListingActivityTabProps {
  listingId: string;
}

export function ListingActivityTab({ listingId }: ListingActivityTabProps) {
  const [displayCount, setDisplayCount] = useState(20);
  const { data: result, isLoading } = useActivitiesForListing(listingId, { limit: displayCount });
  const createManualActivity = useCreateManualActivity();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState("");

  const activities = result?.data || [];
  const hasMore = result?.hasMore || false;

  const handleAddActivity = () => {
    if (!newActivity.trim()) return;
    
    createManualActivity.mutate(
      { 
        listingId, 
        description: newActivity.trim() 
      },
      {
        onSuccess: () => {
          setNewActivity("");
          setShowAddForm(false);
        },
      }
    );
  };

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Aktivitetslogg
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Lägg till aktivitet
        </Button>
      </div>

      {showAddForm && (
        <div className="flex gap-2 items-center bg-muted/50 p-3 rounded-lg">
          <Input
            placeholder="T.ex. Kontaktade intressent, Uppdaterade bilder..."
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            className="text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddActivity();
              if (e.key === "Escape") setShowAddForm(false);
            }}
          />
          <Button 
            onClick={handleAddActivity}
            disabled={!newActivity.trim() || createManualActivity.isPending}
          >
            {createManualActivity.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Spara"
            )}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Laddar aktiviteter...
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-2">
          <div className="space-y-1 divide-y divide-border">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
          {hasMore && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShowMore}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="w-4 h-4 mr-1" />
              Visa fler aktiviteter
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Ingen aktivitet registrerad ännu.</p>
          <p className="text-sm">Aktiviteter loggas automatiskt när leads skapas eller hanteras.</p>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const icon = activityIcons[activity.type] || <MessageSquare className="w-4 h-4 text-muted-foreground" />;
  
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0">
      <div className="mt-0.5 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(new Date(activity.created_at), "d MMMM yyyy 'kl.' HH:mm", { locale: sv })}
        </p>
      </div>
    </div>
  );
}

