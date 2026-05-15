'use client'
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ListingForm } from "@/components/listings/ListingForm";
import { ListingWizard } from "@/components/listings/ListingWizard";
import { useSearchParams } from "next/navigation";

export default function AdminListingDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isNew = id?.toLowerCase() === "ny" || id?.toLowerCase() === "new";

  return (
    <AdminLayout>
      {isNew ? <ListingWizard /> : <ListingForm />}
    </AdminLayout>
  );
}
