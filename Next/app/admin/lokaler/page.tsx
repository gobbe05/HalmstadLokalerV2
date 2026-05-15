'use client'
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ListingsTable } from "@/components/listings/ListingsTable";
import { useLeads } from "@/hooks/useLeads";

export default function ListingsPage() {
  const { data: leads } = useLeads();
  const newLeadsCount = leads?.filter((l) => l.status === "new").length || 0;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar activeItem="objekt" />
      <main className="flex-1 flex flex-col">
        <Header newLeadsCount={newLeadsCount} />
        <ListingsTable />
      </main>
    </div>
  );
}
