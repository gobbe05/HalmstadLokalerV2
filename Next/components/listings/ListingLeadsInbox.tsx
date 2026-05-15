'use client'
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Link, useLocation } from "react-router-dom";
import { 
  Inbox, 
  UserPlus, 
  Loader2,
  ChevronRight,
  Mail,
  Phone
} from "lucide-react";
import { useLeads, type LeadStatus } from "@/hooks/useLeads";
import { Badge } from "@/components/ui/badge";

interface ListingLeadsInboxProps {
  listingId: string;
}

const statusLabels: Record<LeadStatus, string> = {
  new: "Ny",
  contacted: "Kontaktad",
  viewing: "Visning",
  negotiating: "Förhandling",
  won: "Uthyrd",
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

export function ListingLeadsInbox({ listingId }: ListingLeadsInboxProps) {
  const location = useLocation();
  const { data: leads, isLoading } = useLeads(listingId);
  
  const basePath = location.pathname.startsWith("/admin") ? "/admin/leads" : "/app/leads";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Inbox className="w-5 h-5" />
          Leads kopplade till lokalen
        </h3>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Laddar leads...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Inbox className="w-5 h-5" />
          Leads kopplade till lokalen
          {leads && leads.length > 0 && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {leads.length}
            </span>
          )}
        </h3>
      </div>

      {leads && leads.length > 0 ? (
        <div className="space-y-1 divide-y divide-border">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              to={`${basePath}?leadId=${lead.id}`}
              className="flex items-start gap-3 py-3 first:pt-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
            >
              <div className="mt-0.5 flex-shrink-0">
                <UserPlus className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground truncate">
                    {lead.contact_name}
                  </span>
                  <Badge variant="secondary" className={`text-xs ${statusColors[lead.status]}`}>
                    {statusLabels[lead.status]}
                  </Badge>
                </div>
                {lead.company_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.company_name}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {lead.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </span>
                  )}
                  {lead.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(lead.created_at), "d MMMM yyyy 'kl.' HH:mm", { locale: sv })}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Inga leads ännu.</p>
          <p className="text-sm">Leads visas här när potentiella hyresgäster kontaktar dig.</p>
        </div>
      )}
    </div>
  );
}

