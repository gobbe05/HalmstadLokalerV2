'use client'
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { LeadsView } from "@/components/leads/LeadsView";
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

const LEADS_VIEW_KEY = "leads-view-preference";

// Feature flag: Set to true to enable Kanban view toggle
const ENABLE_KANBAN_VIEW = false;

export default function AppLeadsPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">(() => {
    if (!ENABLE_KANBAN_VIEW) return "list";
    const saved = localStorage.getItem(LEADS_VIEW_KEY);
    return saved === "list" || saved === "kanban" ? saved : "kanban";
  });

  useEffect(() => {
    if (ENABLE_KANBAN_VIEW) {
      localStorage.setItem(LEADS_VIEW_KEY, viewMode);
    }
  }, [viewMode]);

  // ViewToggle kept for future use when ENABLE_KANBAN_VIEW is true
  const ViewToggle = ENABLE_KANBAN_VIEW ? (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setViewMode("list")}
        className="gap-2"
      >
        <List className="h-4 w-4" />
        Lista
      </Button>
      <Button
        variant={viewMode === "kanban" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setViewMode("kanban")}
        className="gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        Kanban
      </Button>
    </div>
  ) : null;

  return (
    <AppLayout>
      {ENABLE_KANBAN_VIEW && viewMode === "kanban" ? (
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-medium text-foreground">Mina leads</h1>
              <p className="text-muted-foreground">Hantera förfrågningar i din pipeline</p>
            </div>
            {ViewToggle}
          </div>
          <LeadsKanban />
        </div>
      ) : (
        <LeadsView viewToggle={ViewToggle} />
      )}
    </AppLayout>
  );
}
