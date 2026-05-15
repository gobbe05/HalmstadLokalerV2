'use client'
import { cn } from "@/lib/utils";

export type LeadStatus = "new" | "contacted" | "viewing" | "negotiating" | "won" | "lost";

interface StatusBadgeProps {
  status: LeadStatus;
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: {
    label: "Ny",
    className: "bg-status-new-bg text-status-new-text border-status-new/30",
  },
  contacted: {
    label: "Kontaktad",
    className: "bg-status-contacted-bg text-status-contacted-text border-status-contacted/30",
  },
  viewing: {
    label: "Visning bokad",
    className: "bg-status-viewing-bg text-status-viewing-text border-status-viewing/30",
  },
  negotiating: {
    label: "Förhandling",
    className: "bg-status-negotiating-bg text-status-negotiating-text border-status-negotiating/30",
  },
  won: {
    label: "Lokal uthyrd",
    className: "bg-status-won-bg text-status-won-text border-status-won/30",
  },
  lost: {
    label: "Förlorad",
    className: "bg-status-lost-bg text-status-lost-text border-status-lost/30",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

