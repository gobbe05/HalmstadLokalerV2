'use client'
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAdminDashboardStats } from "@/hooks/useAdminDashboardStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Eye, TrendingUp, UserCheck, FileText, Trophy, Clock, ArrowRight } from "lucide-react";
import { GoogleMapsStatusPanel } from "@/components/admin/GoogleMapsStatusPanel";
import Link from "next/link";

interface PendingAdvertiser {
  id: string;
  company_name: string | null;
  display_name: string | null;
  email: string | null;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminDashboardStats();

  // Fetch pending advertisers for the widget
  const { data: pendingAdvertisers = [] } = useQuery({
    queryKey: ["admin-pending-advertisers"],
    queryFn: async (): Promise<PendingAdvertiser[]> => {
      // Get advertiser user_ids
      const { data: advertiserRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "advertiser");

      if (!advertiserRoles || advertiserRoles.length === 0) return [];

      const advertiserUserIds = advertiserRoles.map(r => r.user_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, company_name, display_name, email, created_at")
        .in("user_id", advertiserUserIds)
        .eq("status", "pending")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) return [];
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Översikt över hela plattformen</p>
        </div>

        {/* Pending Advertisers Alert Widget */}
        {pendingAdvertisers.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Kunder som väntar på godkännande ({pendingAdvertisers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingAdvertisers.slice(0, 3).map((advertiser) => (
                  <div key={advertiser.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {advertiser.company_name || advertiser.display_name || "Okänd"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {advertiser.email}
                      </p>
                    </div>
                    <Link href={`/admin/kunder/${advertiser.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        Granska
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              {pendingAdvertisers.length > 3 && (
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                  <Link href="/admin/kunder?filter=pending">
                    <Button variant="ghost" size="sm" className="w-full text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300">
                      Visa alla {pendingAdvertisers.length} väntande kunder
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-muted-foreground">Laddar statistik...</div>
        ) : (
          <>
            {/* Primary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/admin/kunder">
                <Card className="h-full cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98] border-l-2 border-l-teal-700">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Kunder
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-teal-700" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeCustomers || 0} aktiva
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/lokaler">
                <Card className="h-full cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98] border-l-2 border-l-teal-600">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Lokaler
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalListings || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.publishedListings || 0} pub / {stats?.draftListings || 0} utkast
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/leads">
                <Card className="h-full cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98] border-l-2 border-l-teal-500">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Leads
                    </CardTitle>
                    <Users className="h-4 w-4 text-teal-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.newLeads || 0} nya
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Card className="h-full border-l-2 border-l-teal-400">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Visningar
                    </CardTitle>
                    <Eye className="h-4 w-4 text-teal-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
                  </CardContent>
                </Card>

              <Link href="/admin/leads?status=won">
                <Card className="h-full cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98] border-l-2 border-l-teal-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Konvertering
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-teal-300" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.conversionRate?.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.wonLeads || 0} vunna
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/leads?status=lost">
                <Card className="h-full cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98] border-l-2 border-l-teal-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Förlorade
                    </CardTitle>
                    <FileText className="h-4 w-4 text-teal-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.lostLeads || 0}</div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Listings by Views */}
              <Card className="border-l-2 border-l-teal-600">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Trophy className="h-4 w-4 text-teal-600" />
                  <CardTitle className="text-sm font-medium">Top 5 lokaler (visningar)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.topListingsByViews?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Inga visningar ännu</p>
                    ) : (
                      stats?.topListingsByViews?.map((listing, index) => (
                        <div key={listing.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-5">
                              {index + 1}.
                            </span>
                            <div className="min-w-0">
                              <Link 
                                href={`/admin/lokaler/${listing.id}`}
                                className="text-sm font-medium hover:underline truncate block"
                              >
                                {listing.titel}
                              </Link>
                              <p className="text-xs text-muted-foreground truncate">
                                {listing.owner_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            {listing.views}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Listings by Leads */}
              <Card className="border-l-2 border-l-teal-500">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Trophy className="h-4 w-4 text-teal-500" />
                  <CardTitle className="text-sm font-medium">Top 5 lokaler (leads)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.topListingsByLeads?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Inga leads ännu</p>
                    ) : (
                      stats?.topListingsByLeads?.map((listing, index) => (
                        <div key={listing.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-5">
                              {index + 1}.
                            </span>
                            <div className="min-w-0">
                              <Link 
                                href={`/admin/lokaler/${listing.id}`}
                                className="text-sm font-medium hover:underline truncate block"
                              >
                                {listing.titel}
                              </Link>
                              <p className="text-xs text-muted-foreground truncate">
                                {listing.owner_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {listing.leads}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <div className="pt-4 border-t border-border">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">Systemstatus</h2>
              <GoogleMapsStatusPanel />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
