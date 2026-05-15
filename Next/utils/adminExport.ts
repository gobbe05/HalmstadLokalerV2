import type { CustomerBillingOverview } from "@/hooks/useAdminBilling";

/**
 * Export billing data to CSV file
 */
export function exportBillingToCSV(data: CustomerBillingOverview[], filename = "fakturering.csv") {
  const headers = [
    "Företag",
    "Kontaktperson",
    "Org.nr",
    "Faktura-e-post",
    "Telefon",
    "Adress",
    "Postnummer",
    "Stad",
    "Status",
  ];

  const rows = data.map((item) => [
    item.company_name || "",
    item.contact_person || item.display_name || "",
    item.org_number || "",
    item.billing_email || item.email || "",
    item.phone || "",
    item.billing_address || "",
    item.billing_zip || "",
    item.billing_city || "",
    item.is_complete ? "Komplett" : `Saknas: ${item.missing_fields.join(", ")}`,
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.map(escapeCSV).join(";")),
  ].join("\n");

  // Add BOM for proper Excel encoding
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function escapeCSV(value: string): string {
  // Escape quotes and wrap in quotes if contains special characters
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
