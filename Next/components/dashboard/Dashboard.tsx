'use client'
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { LeadsTable } from "./LeadsTable";

export function Dashboard() {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header newLeadsCount={1} />
        <LeadsTable />
      </main>
    </div>
  );
}

