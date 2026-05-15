'use client'
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Building2, Users, ArrowLeft, Phone, Mail, AlertTriangle, 
  Trash2, RotateCcw, Loader2, UserCog, CheckCircle, Clock, XCircle, Eye,
  AlertOctagon, ExternalLink, BarChart3, Globe
} from "lucide-react";
import { useAdvertiserPageStats } from "@/hooks/useAdvertiserPageStats";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BillingSection } from "@/components/admin/BillingSection";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { AllowedCitiesSelect } from "@/components/admin/AllowedCitiesSelect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

type ProfileStatus = "pending" | "approved" | "rejected";

interface CustomerDetail {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  company_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  deleted_at: string | null;
  allowed_cities: string[] | null;
  status: ProfileStatus;
}

interface CustomerListing {
  id: string;
  titel: string;
  status: string;
  stad: string | null;
  leads_count: number;
}

export default function AdminCustomerDetailPage() {
  const {id} = useParams()
  const router = useRouter();
  const queryClient = useQueryClient();
  const { startImpersonation, endImpersonation } = useImpersonation();
  const [isImpersonating, setIsImpersonating] = useState(false);

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ["admin-customer", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        status: (data.status as ProfileStatus) || "pending",
      } as CustomerDetail;
    },
    enabled: !!id,
  });

  const { data: customerListings } = useQuery({
    queryKey: ["customer-listings", id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          titel,
          status,
          stad,
          leads(count)
        `)
        .eq("owner_id", id);

      if (error) throw error;

      return (data || []).map((listing) => ({
        ...listing,
        leads_count: (listing.leads as any)?.[0]?.count || 0,
      })) as CustomerListing[];
    },
    enabled: !!id,
  });

  const { data: billingData } = useQuery({
    queryKey: ["customer-billing", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("customer_billing")
        .select("*")
        .eq("profile_id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch advertiser slugs (whitelabel)
  const { data: advertiserSlugs } = useQuery({
    queryKey: ["advertiser-slugs", id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from("advertiser_slugs")
        .select("slug, city_id, is_active, created_at")
        .eq("profile_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch advertiser page stats
  const { data: advertiserPageStats } = useAdvertiserPageStats(id);

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ isActive }: { isActive: boolean }) => {
      if (!id) return;
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer", id] });
      toast.success("Kundstatus uppdaterad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera status");
    },
  });

  const updateAllowedCitiesMutation = useMutation({
    mutationFn: async ({ allowedCities }: { allowedCities: string[] }) => {
      if (!id) return;
      const { error } = await supabase
        .from("profiles")
        .update({ allowed_cities: allowedCities })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer", id] });
      toast.success("Tillåtna städer uppdaterade");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera tillåtna städer");
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Kund borttagen");
      router.push("/admin/kunder");
    },
    onError: () => {
      toast.error("Kunde inte ta bort kund");
    },
  });

  const restoreCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: null })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Kund återställd");
    },
    onError: () => {
      toast.error("Kunde inte återställa kund");
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async () => {
      if (!customer?.user_id) throw new Error("Ingen user_id");
      
      const { data, error } = await supabase.functions.invoke('delete-customer', {
        body: { userId: customer.user_id },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Kunde inte ta bort kund");
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Kund permanent borttagen");
      router.push("/admin/kunder");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunde inte ta bort kund permanent");
    },
  });

  const approveAdvertiserMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ status: "approved" })
        .eq("id", id);

      if (profileError) throw profileError;

      const { error: listingsError } = await supabase
        .from("listings")
        .update({ status: "published" })
        .eq("owner_id", id)
        .eq("status", "pending_approval");

      if (listingsError) throw listingsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer", id] });
      queryClient.invalidateQueries({ queryKey: ["customer-listings", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Annonsör godkänd! Deras väntande lokaler är nu publicerade.");
    },
    onError: () => {
      toast.error("Kunde inte godkänna annonsör");
    },
  });

  const rejectAdvertiserMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase
        .from("profiles")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer", id] });
      toast.success("Annonsör avvisad");
    },
    onError: () => {
      toast.error("Kunde inte avvisa annonsör");
    },
  });

  const handleImpersonate = async () => {
    if (!customer?.user_id) {
      toast.error("Kunden har inget user_id");
      return;
    }

    setIsImpersonating(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        toast.error("Du är inte inloggad");
        setIsImpersonating(false);
        return;
      }

      // Store admin session FIRST before any sign out
      startImpersonation(currentSession);

      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { targetUserId: customer.user_id },
      });

      if (error || data?.error) {
        endImpersonation(); // Clean up if edge function fails
        throw new Error(data?.error || error?.message || "Kunde inte starta impersonation");
      }

      console.log("Impersonation response:", data);

      // Sign out admin session
      await supabase.auth.signOut();

      // Use verifyOtp with the actual token (not hashed) extracted from the magic link
      const { data: otpData, error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: "magiclink",
      });

      console.log("OTP verification result:", { otpData, verifyError });

      if (verifyError) {
        console.error("OTP verification failed:", verifyError);
        // Restore admin session on failure
        const originalSession = endImpersonation();
        if (originalSession) {
          await supabase.auth.setSession({
            access_token: originalSession.access_token,
            refresh_token: originalSession.refresh_token,
          });
        }
        throw verifyError;
      }

      toast.success(`Inloggad som ${customer.display_name || customer.email}`);
      router.push("/app");
    } catch (error: any) {
      console.error("Impersonation error:", error);
      toast.error(error.message || "Kunde inte logga in som kund");
    } finally {
      setIsImpersonating(false);
    }
  };

  const pendingListingsCount = customerListings?.filter(l => l.status === 'pending_approval').length || 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !customer) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Button variant="ghost" onClick={() => router.push("/admin/kunder")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Kunden hittades inte.</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <Button variant="ghost" onClick={() => router.push("/admin/kunder")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till kunder
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-foreground">
              {customer.display_name || customer.email || "Okänd kund"}
            </h1>
            {customer.company_name && (
              <p className="text-sm text-muted-foreground">{customer.company_name}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleImpersonate}
              disabled={isImpersonating}
            >
              {isImpersonating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserCog className="h-4 w-4 mr-2" />
              )}
              Logga in som kund
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kontaktuppgifter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.company_name || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={!customer.is_active ? "text-destructive font-medium" : ""}>
                    {customer.is_active ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Status */}
          {!customer.deleted_at && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Godkännandestatus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    {customer.status === "approved" ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Godkänd annonsör</span>
                      </div>
                    ) : customer.status === "rejected" ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Avvisad</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Väntar på godkännande
                          {pendingListingsCount > 0 && (
                            <span className="ml-2 text-muted-foreground">
                              ({pendingListingsCount} lokal{pendingListingsCount !== 1 ? "er" : ""} väntar)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {customer.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveAdvertiserMutation.mutate()}
                        disabled={approveAdvertiserMutation.isPending}
                        className="gap-1.5"
                      >
                        {approveAdvertiserMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Godkänn
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectAdvertiserMutation.mutate()}
                        disabled={rejectAdvertiserMutation.isPending}
                        className="gap-1.5"
                      >
                        {rejectAdvertiserMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Avvisa
                      </Button>
                    </div>
                  )}
                  
                  {customer.status === "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approveAdvertiserMutation.mutate()}
                      disabled={approveAdvertiserMutation.isPending}
                      className="gap-1.5"
                    >
                      {approveAdvertiserMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Godkänn ändå
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inactive warning */}
          {!customer.is_active && (customerListings?.length || 0) > 0 && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Denna kund är avstängd. Kundens {customerListings?.length} lokal{customerListings?.length !== 1 ? "er" : ""} visas inte på den publika hemsidan.
              </AlertDescription>
            </Alert>
          )}

          {/* Allowed Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tillåtna städer</CardTitle>
            </CardHeader>
            <CardContent>
              <AllowedCitiesSelect
                value={customer.allowed_cities || []}
                onChange={(cities) => updateAllowedCitiesMutation.mutate({ allowedCities: cities })}
              />
            </CardContent>
          </Card>

          {/* Whitelabel / Advertiser Slugs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Whitelabel-publicering
              </CardTitle>
            </CardHeader>
            <CardContent>
              {advertiserSlugs && advertiserSlugs.length > 0 ? (
                <div className="space-y-3">
                  {advertiserSlugs.map((slugData) => (
                    <div key={`${slugData.city_id}-${slugData.slug}`} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">/annonsor/{slugData.slug}</span>
                          {slugData.is_active ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                              Aktiv
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inaktiv</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Stad: {slugData.city_id}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5"
                      >
                        <a
                          href={`/annonsor/${slugData.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Öppna
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Ingen whitelabel-publicering konfigurerad
                </div>
              )}
            </CardContent>
          </Card>

          {/* Public Advertiser Page Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Publik annonsörssida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {advertiserPageStats?.isActive ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
                      AKTIV
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      INAKTIV
                    </Badge>
                  )}
                </div>

                {/* Link to public page */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Länk</span>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-1.5"
                  >
                    <a
                      href={advertiserPageStats?.publicProfileUrl || `/annonsorer/${customer.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Öppna publik annonsörssida
                    </a>
                  </Button>
                </div>

                {/* Views 30 days */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Visningar (30 dagar)</span>
                  <span className="text-sm font-medium">{advertiserPageStats?.views30d ?? 0}</span>
                </div>

                {/* Total views */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Visningar (totalt)</span>
                  <span className="text-sm font-medium">{advertiserPageStats?.totalViews ?? 0}</span>
                </div>

                {/* Active listings count */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Aktiva lokaler</span>
                  <span className="text-sm font-medium">{advertiserPageStats?.activeListingsCount ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Section */}
          <BillingSection profileId={customer.id} />

          {/* Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Kundens lokaler ({customerListings?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerListings && customerListings.length > 0 ? (
                <div className="space-y-2">
                  {customerListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/lokaler/${listing.id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{listing.titel}</div>
                        <div className="text-xs text-muted-foreground">
                          {listing.stad || "Ingen stad"} • {listing.leads_count} leads
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          listing.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          listing.status === 'pending_approval' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {listing.status === 'published' ? 'Publicerad' :
                           listing.status === 'pending_approval' ? 'Väntar' :
                           listing.status === 'draft' ? 'Utkast' :
                           listing.status}
                        </span>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Inga lokaler</p>
              )}
            </CardContent>
          </Card>

          {/* Active toggle and actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inställningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Aktiv kund</p>
                  <p className="text-xs text-muted-foreground">
                    Inaktiva kunder visas inte på hemsidan
                  </p>
                </div>
                <Switch
                  checked={customer.is_active}
                  onCheckedChange={(checked) => toggleActiveMutation.mutate({ isActive: checked })}
                />
              </div>

              <div className="pt-4 border-t border-border">
                {customer.deleted_at ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => restoreCustomerMutation.mutate()}
                      disabled={restoreCustomerMutation.isPending}
                      className="gap-2"
                    >
                      {restoreCustomerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Återställ kund
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <AlertOctagon className="h-4 w-4" />
                          Radera permanent
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertOctagon className="h-5 w-5" />
                            Permanent radering
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>
                              <strong>Detta går inte att ångra!</strong> All data kommer att tas bort permanent:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                              <li>Användarkontot från inloggningssystemet</li>
                              <li>Profil och faktureringsuppgifter</li>
                              <li>Alla lokaler ({customerListings?.length || 0} st)</li>
                              <li>Alla leads och aktivitetsloggar</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => permanentDeleteMutation.mutate()}
                            disabled={permanentDeleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {permanentDeleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Ja, radera permanent
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Ta bort kund
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ta bort kund?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Kunden kommer att döljas men kan återställas senare. Kundens lokaler kommer inte längre att visas på hemsidan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => softDeleteMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ta bort
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
