import { AdminLayout } from "@/components/layouts/AdminLayout";
import { AdminLeadsView } from "@/components/admin/AdminLeadsView";

/**
 * ADMIN ONLY: Leads page showing ALL leads across all advertisers.
 */
export default function AdminLeadsPage() {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-foreground">Alla leads</h1>
          <p className="text-muted-foreground">Hantera alla leads på plattformen</p>
        </div>

        <AdminLeadsView />
      </div>
    </AdminLayout>
  );
}
