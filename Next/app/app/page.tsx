'use client'
import { AppLayout } from "@/components/layouts/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Eye, TrendingUp, ArrowRight, AlertCircle, Plus, Sparkles, Info } from "lucide-react";
import { format, subDays } from "date-fns";
import { sv } from "date-fns/locale";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";
import { ProfileReminderCard } from "@/components/onboarding/ProfileReminderCard";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import Link from "next/link";

export default function AppDashboardPage() {
  const { user } = useAuthContext();
  const { data: profileData } = useProfileCompletion();
  const isProfileIncomplete = profileData && !profileData.isComplete;

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["app-dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      // If the user is missing a profile row (shouldn't happen, but can), create a minimal one
      if (!profile && !profileError) {
        const displayName =
          (user.user_metadata as { display_name?: string } | null)?.display_name ||
          user.email ||
          "";

        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: user.id,
          email: user.email,
          display_name: displayName,
          status: "pending",
        });

        if (insertError) throw insertError;

        const res = await supabase
          .from("profiles")
          .select("id, display_name")
          .eq("user_id", user.id)
          .maybeSingle();

        profile = res.data;
        profileError = res.error;
      }

      if (profileError || !profile) return null;

      const { data: listings } = await supabase
        .from("listings")
        .select("id, titel, status, adress, created_at")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false });

      const listingIds = listings?.map((l) => l.id) || [];
      const publishedListings = listings?.filter(l => l.status === "published") || [];

      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("listing_id", listingIds.length > 0 ? listingIds : ["none"]);

      const { data: latestLeads } = await supabase
        .from("leads")
        .select("id, contact_name, company_name, created_at, listing_id, status")
        .in("listing_id", listingIds.length > 0 ? listingIds : ["none"])
        .order("created_at", { ascending: false })
        .limit(5);

      const { count: newLeadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("listing_id", listingIds.length > 0 ? listingIds : ["none"])
        .eq("status", "new");

      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { count: views30Days } = await supabase
        .from("listing_events")
        .select("*", { count: "exact", head: true })
        .in("listing_id", listingIds.length > 0 ? listingIds : ["none"])
        .eq("event_type", "view")
        .gte("created_at", thirtyDaysAgo);

      const { count: totalViews } = await supabase
        .from("listing_events")
        .select("*", { count: "exact", head: true })
        .in("listing_id", listingIds.length > 0 ? listingIds : ["none"])
        .eq("event_type", "view");

      const { data: viewsPerListing } = await supabase
        .from("listing_events")
        .select("listing_id")
        .in("listing_id", listingIds.length > 0 ? listingIds : ["none"])
        .eq("event_type", "view");

      const viewCounts: Record<string, number> = {};
      viewsPerListing?.forEach(event => {
        viewCounts[event.listing_id] = (viewCounts[event.listing_id] || 0) + 1;
      });

      let topListing = null;
      let topListingViews = 0;
      Object.entries(viewCounts).forEach(([listingId, views]) => {
        if (views > topListingViews) {
          topListingViews = views;
          const listing = listings?.find(l => l.id === listingId);
          if (listing) {
            topListing = { ...listing, views };
          }
        }
      });

      const leadsWithListings = latestLeads?.map(lead => {
        const listing = listings?.find(l => l.id === lead.listing_id);
        return { ...lead, listingTitle: listing?.titel || "Okänd lokal" };
      });

      return {
        profile,
        listings: listings || [],
        publishedCount: publishedListings.length,
        totalListings: listings?.length || 0,
        totalLeads: totalLeads || 0,
        newLeadsCount: newLeadsCount || 0,
        latestLeads: leadsWithListings || [],
        views30Days: views30Days || 0,
        totalViews: totalViews || 0,
        topListing,
      };
    },
    enabled: !!user?.id,
  });

  const hasNoListings = dashboardData && dashboardData.totalListings === 0;
  const hasNoPublished = dashboardData && dashboardData.publishedCount === 0 && dashboardData.totalListings > 0;
  const hasListings = dashboardData && dashboardData.totalListings > 0;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-500/10 text-blue-500",
      contacted: "bg-yellow-500/10 text-yellow-500",
      viewing: "bg-purple-500/10 text-purple-500",
      negotiation: "bg-orange-500/10 text-orange-500",
      won: "bg-green-500/10 text-green-500",
      lost: "bg-red-500/10 text-red-500",
    };
    const labels: Record<string, string> = {
      new: "Ny",
      contacted: "Kontaktad",
      viewing: "Visning",
      negotiation: "Förhandling",
      won: "Vunnen",
      lost: "Förlorad",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.new}`}>
        {labels[status] || "Ny"}
      </span>
    );
  };

  // First-time state: No listings yet - show only single CTA
  if (!isLoading && hasNoListings) {
    return (
      <AppLayout>
        <OnboardingRedirect />
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-medium text-foreground">
                  Lägg upp din första lokal
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Börja med att lägga in en lokal för att kunna ta emot förfrågningar.
                </p>
              </div>

              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/app/lokaler/new">
                  <Plus className="h-5 w-5 mr-2" />
                  Lägg till lokal
                </Link>
              </Button>

              <p className="text-xs text-muted-foreground">
                Tar normalt ett par minuter.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Redirect incomplete profiles to onboarding */}
      <OnboardingRedirect />
      
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header with greeting */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-medium text-foreground">
            Välkommen{dashboardData?.profile?.display_name ? `, ${dashboardData.profile.display_name}` : ""}!
          </h1>
          <p className="text-sm text-muted-foreground">Här är en överblick av dina lokaler och leads</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Laddar dashboard...</div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Profile completion notice - only show if profile is incomplete */}
            {isProfileIncomplete && (
              <Card className="border-blue-500/50 bg-blue-500/5">
                <CardContent className="flex flex-col sm:flex-row items-start gap-4 p-4 md:p-6">
                  <div className="p-2 rounded-full bg-blue-500/10 shrink-0">
                    <Info className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1 text-sm sm:text-base">
                      Slutför din annonsörsprofil
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      För att kunna ta emot förfrågningar behöver du fylla i kontaktuppgifter.
                    </p>
                    <Button asChild size="sm" className="w-full sm:w-auto">
                      <Link href="/app/profil">
                        Slutför profil
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alert for unpublished listings - only show when profile is complete */}
            {hasNoPublished && !isProfileIncomplete && (
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="flex flex-col sm:flex-row items-start gap-4 p-4 md:p-6">
                  <div className="p-2 rounded-full bg-amber-500/10 shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1 text-sm sm:text-base">
                      Publicera dina lokaler
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      Du har lokaler men ingen är publicerad. Publicera dem för att synas på hemsidan.
                    </p>
                    <Button asChild size="sm" className="w-full sm:w-auto">
                      <Link href="/app/lokaler">
                        Hantera lokaler
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/app/lokaler">
                <Card className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98] border-l-2 border-l-teal-700">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Publicerade lokaler
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-teal-700" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.publishedCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      av {dashboardData?.totalListings || 0} totalt
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/app/leads?status=new">
                <Card className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98] border-l-2 border-l-teal-500">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Nya leads
                    </CardTitle>
                    <Users className="h-4 w-4 text-teal-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.newLeadsCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.totalLeads || 0} totalt
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/app/lokaler">
                <Card className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98] border-l-2 border-l-teal-400">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Visningar (30 dagar)
                    </CardTitle>
                    <Eye className="h-4 w-4 text-teal-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.views30Days || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.totalViews || 0} totalt
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href={dashboardData?.topListing ? `/app/lokaler/${dashboardData.topListing.id}` : "/app/lokaler"}>
                <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-l-2 border-l-teal-300 cursor-pointer transition-all hover:from-teal-500/15 hover:to-teal-600/10 hover:shadow-md active:scale-[0.98]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-300">
                      Topplokal
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.topListing ? (
                      <>
                        <div className="text-base sm:text-lg font-bold truncate">{dashboardData.topListing.titel}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardData.topListing.views} visningar
                        </p>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Ingen data ännu</div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Two Column Layout - only show when profile is complete */}
            {!isProfileIncomplete && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latest Leads */}
              <Card className="border-l-2 border-l-teal-500">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle>Senaste leads</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Nyligen inkomna förfrågningar</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                    <Link href="/app/leads">
                      Visa alla <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {dashboardData?.latestLeads && dashboardData.latestLeads.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.latestLeads.map((lead) => (
                        <Link 
                          key={lead.id} 
                          href={`/app/leads?leadId=${lead.id}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{lead.contact_name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {lead.company_name || lead.listingTitle}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            {getStatusBadge(lead.status)}
                            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                              {format(new Date(lead.created_at), "d MMM", { locale: sv })}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Inga leads ännu</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Förfrågningar från besökare visas här
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-l-2 border-l-teal-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-500" />
                    Snabbåtgärder
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Öka synlighet och få fler leads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link 
                    href="/app/lokaler/new"
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-dashed border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 transition-colors group"
                  >
                    <div className="p-2 rounded-full bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors shrink-0">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">Lägg till ny lokal</div>
                      <div className="text-xs text-muted-foreground">Publicera och börja få förfrågningar</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 transition-colors shrink-0" />
                  </Link>

                  <Link 
                    href="/app/lokaler"
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="p-2 rounded-full bg-muted shrink-0">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">Hantera lokaler</div>
                      <div className="text-xs text-muted-foreground">Redigera, publicera eller ta bort</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </Link>

                  <Link 
                    href="/app/leads"
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="p-2 rounded-full bg-muted shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">Hantera leads</div>
                      <div className="text-xs text-muted-foreground">Följ upp och konvertera förfrågningar</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </Link>
                </CardContent>
              </Card>
            </div>
            )}

            {/* CTA Banner - only show when profile is complete */}
            {!isProfileIncomplete && dashboardData && dashboardData.totalListings > 0 && dashboardData.publishedCount < dashboardData.totalListings && (
              <Card className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
                <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6">
                  <div className="text-center sm:text-left">
                    <h3 className="font-medium text-base">
                      Du har {dashboardData.totalListings - dashboardData.publishedCount} opublicerade lokaler
                    </h3>
                    <p className="text-primary-foreground/80 text-xs sm:text-sm mt-1">
                      Publicera dem för att öka din synlighet och få fler leads
                    </p>
                  </div>
                  <Button variant="secondary" asChild className="w-full sm:w-auto shrink-0">
                    <Link href="/app/lokaler">
                      Publicera nu <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}