'use client'

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ListingForm } from "@/components/listings/ListingForm";
import { ListingWizard } from "@/components/listings/ListingWizard";
import { useParams } from "next/navigation";

export default function AdminListingDetailPage() {
  const {id} = useParams();
  const isNew = (id as string).toLowerCase() === "ny" || (id as string).toLowerCase() === "new";

  return (
    <AdminLayout>
      {isNew ? <ListingWizard /> : <ListingForm />}
    </AdminLayout>
  );
}
