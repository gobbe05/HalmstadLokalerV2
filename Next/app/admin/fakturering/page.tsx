'use client'
import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAdminBilling } from "@/hooks/useAdminBilling";
import { exportBillingToCSV } from "@/utils/adminExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Building,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

type FilterMode = "all" | "complete" | "missing_org" | "missing_email" | "incomplete";

export default function AdminBillingPage() {
  const { data: customers = [], isLoading } = useAdminBilling();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Apply filter
    switch (filterMode) {
      case "complete":
        result = result.filter((c) => c.is_complete);
        break;
      case "incomplete":
        result = result.filter((c) => !c.is_complete);
        break;
      case "missing_org":
        result = result.filter((c) => !c.org_number);
        break;
      case "missing_email":
        result = result.filter((c) => !c.billing_email);
        break;
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.company_name?.toLowerCase().includes(term) ||
          c.display_name?.toLowerCase().includes(term) ||
          c.org_number?.toLowerCase().includes(term) ||
          c.billing_email?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [customers, filterMode, searchTerm]);

  const stats = useMemo(() => {
    const complete = customers.filter((c) => c.is_complete).length;
    const incomplete = customers.filter((c) => !c.is_complete).length;
    return { complete, incomplete, total: customers.length };
  }, [customers]);

  const handleExport = () => {
    exportBillingToCSV(filteredCustomers);
  };

  return (
    <AdminLayout>
      <section className="flex-1 px-4 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium">Fakturering</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Översikt över kunders fakturauppgifter
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportera CSV
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totalt
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-2xl font-semibold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Komplett
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-2xl font-semibold text-emerald-600">{stats.complete}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Saknas info
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-2xl font-semibold text-amber-600">{stats.incomplete}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Sök kund, org.nr, e-post..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla kunder</SelectItem>
              <SelectItem value="complete">Komplett info</SelectItem>
              <SelectItem value="incomplete">Saknas info</SelectItem>
              <SelectItem value="missing_org">Saknar org.nr</SelectItem>
              <SelectItem value="missing_email">Saknar faktura-e-post</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Laddar...</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredCustomers.map((customer) => (
                <Card key={customer.profile_id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate flex items-center gap-2">
                          <Building className="w-4 h-4 text-teal-500 shrink-0" />
                          {customer.company_name || customer.display_name || "—"}
                        </div>
                        {customer.org_number && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Org.nr: {customer.org_number}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {customer.billing_email || customer.email || "Ingen e-post"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {customer.is_complete ? (
                          <Badge variant="default" className="bg-emerald-500 text-white gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Komplett
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Saknas
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/kunder/${customer.profile_id}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    {!customer.is_complete && (
                      <div className="mt-2 text-xs text-amber-600">
                        Saknas: {customer.missing_fields.join(", ")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Företag</TableHead>
                      <TableHead>Org.nr</TableHead>
                      <TableHead>Faktura-e-post</TableHead>
                      <TableHead>Adress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.profile_id}>
                        <TableCell>
                          <div className="font-medium">
                            {customer.company_name || customer.display_name || "—"}
                          </div>
                          {customer.contact_person && (
                            <div className="text-sm text-muted-foreground">
                              {customer.contact_person}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {customer.org_number || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.billing_email || (
                            <span className="text-muted-foreground">
                              {customer.email || "—"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {customer.billing_address ? (
                            <div className="text-sm">
                              {customer.billing_address}
                              {customer.billing_zip && customer.billing_city && (
                                <span className="text-muted-foreground">
                                  , {customer.billing_zip} {customer.billing_city}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.is_complete ? (
                            <Badge variant="default" className="bg-emerald-500 text-white gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Komplett
                            </Badge>
                          ) : (
                            <div>
                              <Badge variant="secondary" className="gap-1 mb-1">
                                <AlertCircle className="w-3 h-3" />
                                Saknas info
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {customer.missing_fields.join(", ")}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/kunder/${customer.profile_id}`}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Inga kunder matchar filtret
              </div>
            )}
          </>
        )}
      </section>
    </AdminLayout>
  );
}
