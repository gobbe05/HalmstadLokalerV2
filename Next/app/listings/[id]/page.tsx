'use client'
import { redirect, useParams } from "next/navigation";

// Legacy route redirect component
function LegacyListingRedirect() {
  const { id } = useParams();
  return redirect(`/app/lokaler/${id}`);
}