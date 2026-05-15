'use client'

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Building2, Users, Eye, Phone, Mail, AlertTriangle, Trash2, RotateCcw, Archive, Plus, Loader2, UserCog, CheckCircle, Clock, XCircle, AlertOctagon, ExternalLink, MapPin, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BillingSection } from "@/components/admin/BillingSection";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { AllowedCitiesSelect } from "@/components/admin/AllowedCitiesSelect";
import { useAdvertiserPageStatusBatch } from "@/hooks/useAdvertiserPageStats";
import { Badge } from "@/components/ui/badge";
import { useCities } from "@/hooks/useCities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface CustomerBillingInfo {
  company_name: string | null;
  org_number: string | null;
}

type ProfileStatus = "pending" | "approved" | "rejected";

interface CustomerWithStats {
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
  listings_count: number;
  leads_count: number;
  pending_listings_count: number;
  billing: CustomerBillingInfo | null;
}

interface CustomerListing {
  id: string;
  titel: string;
  status: string;
  stad: string | null;
  leads_count: number;
}

type FilterMode = "all" | "pending" | "approved" | "rejected";

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { startImpersonation } = useImpersonation();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: cities } = useCities();
  const [newCustomer, setNewCustomer] = useState({
    email: "",
    password: "",
    displayName: "",
    phone: "",
    companyName: "",
    allowedCities: [] as string[],
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async () => {
      // First get user_ids that are advertisers - not admins or seekers
      const { data: advertiserRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "advertiser");

      if (rolesError) throw rolesError;

      const advertiserUserIds = advertiserRoles?.map(r => r.user_id) || [];

      if (advertiserUserIds.length === 0) {
        return [];
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", advertiserUserIds)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("owner_id, status");

      if (listingsError) throw listingsError;

      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("listing_id, listings!inner(owner_id)");

      if (leadsError) throw leadsError;

      // Fetch billing info for all profiles
      const { data: billingData, error: billingError } = await supabase
        .from("customer_billing")
        .select("profile_id, company_name, org_number");

      if (billingError) throw billingError;

      const customersWithStats: CustomerWithStats[] = (profiles || []).map((profile) => {
        const customerListings = listings?.filter((l) => l.owner_id === profile.id) || [];
        const listingsCount = customerListings.length;
        const pendingListingsCount = customerListings.filter((l: any) => l.status === 'pending_approval').length;
        const leadsCount = leads?.filter((l) => (l.listings as any)?.owner_id === profile.id).length || 0;
        const billing = billingData?.find((b) => b.profile_id === profile.id) || null;

        return {
          ...profile,
          status: (profile.status as ProfileStatus) || "pending",
          listings_count: listingsCount,
          leads_count: leadsCount,
          pending_listings_count: pendingListingsCount,
          billing: billing ? {
            company_name: billing.company_name,
            org_number: billing.org_number,
          } : null,
        };
      });

      return customersWithStats;
    },
  });

  const { data: customerListings } = useQuery({
    queryKey: ["customer-listings", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];

      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          titel,
          status,
          stad,
          leads(count)
        `)
        .eq("owner_id", selectedCustomer.id);

      if (error) throw error;

      return (data || []).map((listing) => ({
        ...listing,
        leads_count: (listing.leads as any)?.[0]?.count || 0,
      })) as CustomerListing[];
    },
    enabled: !!selectedCustomer?.id,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Kundstatus uppdaterad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera status");
    },
  });

  const updateAllowedCitiesMutation = useMutation({
    mutationFn: async ({ id, allowedCities }: { id: string; allowedCities: string[] }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ allowed_cities: allowedCities })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Tillåtna städer uppdaterade");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera tillåtna städer");
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      console.log("Attempting soft delete for profile:", profileId);
      const now = new Date().toISOString();
      
      // First soft-delete all listings belonging to this profile
      const { error: listingsError } = await supabase
        .from("listings")
        .update({ deleted_at: now, status: "draft" })
        .eq("owner_id", profileId)
        .is("deleted_at", null);

      if (listingsError) {
        console.error("Error soft-deleting listings:", listingsError);
        throw listingsError;
      }

      // Then soft-delete the profile
      const { error, data } = await supabase
        .from("profiles")
        .update({ deleted_at: now })
        .eq("id", profileId)
        .select();

      console.log("Soft delete result:", { error, data });
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Ingen profil uppdaterad - kontrollera behörigheter");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["public-listings"] });
      setSelectedCustomer(null);
      toast.success("Kund och deras lokaler borttagna");
    },
    onError: (error: Error) => {
      console.error("Soft delete error:", error);
      toast.error(error.message || "Kunde inte ta bort kund");
    },
  });

  const restoreCustomerMutation = useMutation({
    mutationFn: async (profileId: string) => {
      // First restore the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ deleted_at: null })
        .eq("id", profileId);

      if (profileError) throw profileError;

      // Then restore all listings that were soft-deleted (set them to draft, user can publish again)
      const { error: listingsError } = await supabase
        .from("listings")
        .update({ deleted_at: null })
        .eq("owner_id", profileId)
        .not("deleted_at", "is", null);

      if (listingsError) {
        console.error("Error restoring listings:", listingsError);
        // Don't throw - profile is restored, just log the warning
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["public-listings"] });
      setSelectedCustomer(null);
      toast.success("Kund och deras lokaler återställda");
    },
    onError: () => {
      toast.error("Kunde inte återställa kund");
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-customer', {
        body: { userId },
      });

      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Kunde inte radera permanent");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      setSelectedCustomer(null);
      toast.success("Kund permanent borttagen");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunde inte radera permanent");
    },
  });

  // Approve advertiser and automatically publish their pending_approval listings
  const approveAdvertiserMutation = useMutation({
    mutationFn: async (profileId: string) => {
      // First update profile status to approved
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ status: "approved" })
        .eq("id", profileId);

      if (profileError) throw profileError;

      // Then update all pending_approval listings to published
      const { error: listingsError } = await supabase
        .from("listings")
        .update({ status: "published" })
        .eq("owner_id", profileId)
        .eq("status", "pending_approval");

      if (listingsError) throw listingsError;
    },
    onSuccess: (_, profileId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-listings", profileId] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      
      // Update selected customer state
      if (selectedCustomer) {
        setSelectedCustomer({
          ...selectedCustomer,
          status: "approved",
          pending_listings_count: 0,
        });
      }
      
      toast.success("Annonsör godkänd! Deras väntande lokaler är nu publicerade.");
    },
    onError: () => {
      toast.error("Kunde inte godkänna annonsör");
    },
  });

  // Reject advertiser
  const rejectAdvertiserMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "rejected" })
        .eq("id", profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      
      if (selectedCustomer) {
        setSelectedCustomer({
          ...selectedCustomer,
          status: "rejected",
        });
      }
      
      toast.success("Annonsör avvisad");
    },
    onError: () => {
      toast.error("Kunde inte avvisa annonsör");
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: typeof newCustomer) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Du måste vara inloggad");
      }

      const response = await supabase.functions.invoke('create-customer', {
        body: data,
      });

      if (response.error) {
        throw new Error(response.error.message || "Kunde inte skapa kund");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      setShowAddDialog(false);
      setNewCustomer({
        email: "",
        password: "",
        displayName: "",
        phone: "",
        companyName: "",
        allowedCities: [],
      });
      toast.success("Kund skapad");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunde inte skapa kund");
    },
  });

  const handleImpersonate = async (customer: CustomerWithStats) => {
    if (!customer.user_id) {
      toast.error("Kunden har inget user_id");
      return;
    }

    setIsImpersonating(true);
    try {
      // Get current session to save for later
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        toast.error("Du är inte inloggad");
        return;
      }

      // Call edge function to get magic link token
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { targetUserId: customer.user_id },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Kunde inte starta impersonation");
      }

      // Store admin session before switching
      startImpersonation(currentSession);

      // Sign in with the magic link token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: "magiclink",
      });

      if (verifyError) {
        throw verifyError;
      }

      toast.success(`Inloggad som ${customer.display_name || customer.email}`);
      setSelectedCustomer(null);
      router.push("/app");
    } catch (error: any) {
      console.error("Impersonation error:", error);
      toast.error(error.message || "Kunde inte logga in som kund");
    } finally {
      setIsImpersonating(false);
    }
  };

  // Mobile card component - defined here, but uses advertiserPageStatusMap from below
  const CustomerCard = ({ customer, isAdvertiserPageActive }: { customer: CustomerWithStats; isAdvertiserPageActive?: boolean }) => (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push(`/admin/kunder/${customer.id}`)}
            className="font-medium text-foreground truncate text-left hover:text-primary hover:underline transition-colors"
          >
            {customer.display_name || customer.email || "Okänd"}
          </button>
          {customer.company_name && (
            <div className="text-xs text-muted-foreground truncate">
              {customer.company_name}
            </div>
          )}
          {/* Approval status badge */}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {customer.status === "approved" ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                Godkänd
              </span>
            ) : customer.status === "rejected" ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-destructive">
                <XCircle className="h-3 w-3" />
                Avvisad
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                Väntar på godkännande
                {customer.pending_listings_count > 0 && (
                  <span className="ml-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded-full text-[9px] font-medium">
                    {customer.pending_listings_count}
                  </span>
                )}
              </span>
            )}
            {/* Advertiser page status badge */}
            <button onClick={() => router.push(`/admin/kunder/${customer.id}`)}>
              {isAdvertiserPageActive ? (
                <Badge className="text-[9px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50">
                  Sida AKTIV
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 hover:bg-muted/80">
                  Sida INAKTIV
                </Badge>
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Switch
            checked={customer.is_active}
            onCheckedChange={(checked) =>
              toggleActiveMutation.mutate({
                id: customer.id,
                isActive: checked,
              })
            }
          />
          {!customer.is_active && customer.listings_count > 0 && (
            <span className="text-[10px] text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Dold
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {customer.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            <span>{customer.phone}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {customer.listings_count}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {customer.leads_count}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCustomer(customer)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Filter customers based on showDeleted toggle and filterMode
  const activeCustomers = customers?.filter(c => !c.deleted_at) || [];
  const deletedCustomers = customers?.filter(c => c.deleted_at) || [];
  
  // Calculate summary stats
  const pendingCustomers = activeCustomers.filter(c => c.status === "pending");
  const totalPendingListings = pendingCustomers.reduce((sum, c) => sum + c.pending_listings_count, 0);
  const approvedCustomers = activeCustomers.filter(c => c.status === "approved");
  const rejectedCustomers = activeCustomers.filter(c => c.status === "rejected");
  
  // Apply filter mode
  let filteredActiveCustomers = activeCustomers;
  if (filterMode === "pending") {
    filteredActiveCustomers = pendingCustomers;
  } else if (filterMode === "approved") {
    filteredActiveCustomers = approvedCustomers;
  } else if (filterMode === "rejected") {
    filteredActiveCustomers = rejectedCustomers;
  }
  
  // Apply city filter
  const filteredByCity = useMemo(() => {
    if (cityFilter === "all") return filteredActiveCustomers;
    return filteredActiveCustomers.filter(c => 
      c.allowed_cities?.includes(cityFilter)
    );
  }, [filteredActiveCustomers, cityFilter]);
  
  // Apply search filter
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredByCity;
    const query = searchQuery.toLowerCase().trim();
    return filteredByCity.filter(c => 
      c.display_name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.company_name?.toLowerCase().includes(query) ||
      c.billing?.company_name?.toLowerCase().includes(query)
    );
  }, [filteredByCity, searchQuery]);
  
  const displayedCustomers = showDeleted ? deletedCustomers : filteredBySearch;

  // Get unique cities from customers for the filter dropdown
  const customerCityIds = useMemo(() => {
    const citySet = new Set<string>();
    activeCustomers.forEach(c => {
      c.allowed_cities?.forEach(cityId => citySet.add(cityId));
    });
    return Array.from(citySet);
  }, [activeCustomers]);

  // Fetch advertiser page status for all displayed customers
  const displayedCustomerIds = displayedCustomers.map(c => c.id);
  const { data: advertiserPageStatusMap } = useAdvertiserPageStatusBatch(displayedCustomerIds);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Kunder</h1>
            <p className="text-sm text-muted-foreground">Hantera annonsörer och deras lokaler</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Lägg till kund
            </Button>
            
            {deletedCustomers.length > 0 && (
              <Button
                variant={showDeleted ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Archive className="h-4 w-4 mr-2" />
                {showDeleted ? "Visa aktiva" : `Visa borttagna (${deletedCustomers.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* Search input */}
        {!showDeleted && (
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök namn, e-post eller företag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Pending customers summary alert */}
        {!showDeleted && pendingCustomers.length > 0 && (
          <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>
                <strong>{pendingCustomers.length}</strong> kund{pendingCustomers.length !== 1 ? "er" : ""} väntar på godkännande
                {totalPendingListings > 0 && (
                  <span className="text-amber-700 dark:text-amber-300">
                    {" "}med totalt <strong>{totalPendingListings}</strong> lokal{totalPendingListings !== 1 ? "er" : ""} som inte visas publikt
                  </span>
                )}
              </span>
              {filterMode !== "pending" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFilterMode("pending")}
                  className="shrink-0 border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                >
                  Visa endast pending
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Filter tabs */}
        {!showDeleted && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={filterMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMode("all")}
            >
              Alla ({activeCustomers.length})
            </Button>
            <Button
              variant={filterMode === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMode("pending")}
              className={filterMode !== "pending" && pendingCustomers.length > 0 ? "border-amber-500/50 text-amber-700 dark:text-amber-300" : ""}
            >
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Väntar ({pendingCustomers.length})
            </Button>
            <Button
              variant={filterMode === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMode("approved")}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Godkända ({approvedCustomers.length})
            </Button>
            {rejectedCustomers.length > 0 && (
              <Button
                variant={filterMode === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("rejected")}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Avvisade ({rejectedCustomers.length})
              </Button>
            )}
            
            {/* City filter dropdown */}
            {customerCityIds.length > 0 && (
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Filtrera per stad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla städer</SelectItem>
                  {customerCityIds.map(cityId => {
                    const city = cities?.find(c => c.id === cityId);
                    return (
                      <SelectItem key={cityId} value={cityId}>
                        {city?.name || cityId}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {showDeleted && (
          <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
            <Archive className="h-4 w-4" />
            <AlertDescription>
              Visar {deletedCustomers.length} borttagna kund{deletedCustomers.length !== 1 ? "er" : ""}. Klicka på en kund för att återställa.
            </AlertDescription>
          </Alert>
        )}

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Laddar...</div>
          ) : displayedCustomers.length > 0 ? (
            displayedCustomers.map((customer) => (
              <CustomerCard 
                key={customer.id} 
                customer={customer} 
                isAdvertiserPageActive={advertiserPageStatusMap?.get(customer.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {showDeleted ? "Inga borttagna kunder." : filterMode !== "all" ? "Inga kunder matchar filtret." : "Inga kunder hittades."}
            </div>
          )}
        </div>

        {/* Desktop table */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>{showDeleted ? "Borttagna kunder" : filterMode === "all" ? "Alla kunder" : filterMode === "pending" ? "Kunder som väntar på godkännande" : filterMode === "approved" ? "Godkända kunder" : "Avvisade kunder"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">Laddar...</div>
            ) : (
              <table className="w-full text-sm table-fixed">
                  <thead className="bg-muted border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold w-[18%]">Kund</th>
                      <th className="px-3 py-2.5 font-semibold w-[16%]">Företag</th>
                      <th className="px-3 py-2.5 font-semibold w-[22%]">E-post</th>
                      <th className="px-3 py-2.5 font-semibold text-center w-[12%]">Status</th>
                      <th className="px-2 py-2.5 font-semibold text-center w-[8%]">Sida</th>
                      <th className="px-2 py-2.5 font-semibold text-center w-[7%]">Lok.</th>
                      <th className="px-2 py-2.5 font-semibold text-center w-[7%]">Leads</th>
                      <th className="px-2 py-2.5 font-semibold text-center w-[6%]">Aktiv</th>
                      <th className="px-2 py-2.5 w-[4%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                          {showDeleted ? "Inga borttagna kunder." : filterMode !== "all" ? "Inga kunder matchar filtret." : "Inga kunder hittades."}
                        </td>
                      </tr>
                    ) : displayedCustomers.map((customer) => (
                      <tr key={customer.id} className={`hover:bg-muted/50 transition-colors ${customer.deleted_at ? 'opacity-60' : ''}`}>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => router.push(`/admin/kunder/${customer.id}`)}
                            className="text-left font-medium hover:text-primary hover:underline transition-colors truncate block max-w-full"
                            title={customer.display_name || undefined}
                          >
                            {customer.display_name || "-"}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground truncate" title={customer.billing?.company_name || customer.company_name || undefined}>
                          {customer.billing?.company_name || customer.company_name || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground truncate" title={customer.email || undefined}>
                          {customer.email || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {customer.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400" title="Godkänd">
                              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden lg:inline">Godkänd</span>
                            </span>
                          ) : customer.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive" title="Avvisad">
                              <XCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden lg:inline">Avvisad</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" title="Väntar på godkännande">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden lg:inline">Väntar</span>
                              {customer.pending_listings_count > 0 && (
                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded-full text-[10px] font-medium">
                                  {customer.pending_listings_count}
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <button
                            onClick={() => router.push(`/admin/kunder/${customer.id}`)}
                            className="inline-block"
                          >
                            {advertiserPageStatusMap?.get(customer.id) ? (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer text-[9px] px-1.5">
                                AKTIV
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer text-[9px] px-1.5">
                                —
                              </Badge>
                            )}
                          </button>
                        </td>
                        <td className="px-2 py-2.5 text-center tabular-nums text-xs">
                          {customer.listings_count}
                        </td>
                        <td className="px-2 py-2.5 text-center tabular-nums text-xs">
                          {customer.leads_count}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <Switch
                            checked={customer.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({
                                id: customer.id,
                                isActive: checked,
                              })
                            }
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomer?.display_name || selectedCustomer?.email}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Företag:</span>{" "}
                  {selectedCustomer?.company_name || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Telefon:</span>{" "}
                  {selectedCustomer?.phone || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">E-post:</span>{" "}
                  {selectedCustomer?.email || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className={!selectedCustomer?.is_active ? "text-destructive font-medium" : ""}>
                    {selectedCustomer?.is_active ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
              </div>

              {/* Approval Status & Actions */}
              {selectedCustomer && !selectedCustomer.deleted_at && (
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-sm mb-1">Godkännandestatus</h3>
                      {selectedCustomer.status === "approved" ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Godkänd annonsör</span>
                        </div>
                      ) : selectedCustomer.status === "rejected" ? (
                        <div className="flex items-center gap-2 text-destructive">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Avvisad</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Väntar på godkännande
                            {selectedCustomer.pending_listings_count > 0 && (
                              <span className="ml-2 text-muted-foreground">
                                ({selectedCustomer.pending_listings_count} lokal{selectedCustomer.pending_listings_count !== 1 ? "er" : ""} väntar)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {selectedCustomer.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveAdvertiserMutation.mutate(selectedCustomer.id)}
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
                          onClick={() => rejectAdvertiserMutation.mutate(selectedCustomer.id)}
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
                    
                    {selectedCustomer.status === "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveAdvertiserMutation.mutate(selectedCustomer.id)}
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
                </div>
              )}

              {!selectedCustomer?.is_active && (customerListings?.length || 0) > 0 && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Denna kund är avstängd. Kundens {customerListings?.length} lokal{customerListings?.length !== 1 ? "er" : ""} visas inte på den publika hemsidan.
                  </AlertDescription>
                </Alert>
              )}

              {/* Allowed Cities Section */}
              {selectedCustomer && !selectedCustomer.deleted_at && (
                <AllowedCitiesSelect
                  value={selectedCustomer.allowed_cities || []}
                  onChange={(allowedCities) => {
                    updateAllowedCitiesMutation.mutate({
                      id: selectedCustomer.id,
                      allowedCities,
                    });
                    // Optimistically update local state
                    setSelectedCustomer({
                      ...selectedCustomer,
                      allowed_cities: allowedCities,
                    });
                  }}
                  label="Tillåtna städer för publicering"
                />
              )}

              {/* Billing Section */}
              {selectedCustomer && (
                <BillingSection profileId={selectedCustomer.id} />
              )}

              <div>
                <h3 className="font-medium mb-3">Lokaler ({customerListings?.length || 0})</h3>
                {customerListings?.length ? (
                  <div className="space-y-2 md:hidden">
                    {customerListings.map((listing) => (
                      <div key={listing.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="font-medium">{listing.titel}</div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{listing.stad || "-"}</span>
                          <span>{listing.status}</span>
                          <span>{listing.leads_count} leads</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {customerListings?.length ? (
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2">Titel</th>
                          <th className="px-4 py-2">Stad</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2 text-center">Leads</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {customerListings.map((listing) => (
                          <tr key={listing.id}>
                            <td className="px-4 py-2">{listing.titel}</td>
                            <td className="px-4 py-2 text-muted-foreground">{listing.stad || "-"}</td>
                            <td className="px-4 py-2">{listing.status}</td>
                            <td className="px-4 py-2 text-center">{listing.leads_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Inga lokaler</p>
                )}
              </div>

              {/* Actions Section */}
              <div className="pt-4 border-t border-border flex flex-wrap gap-2">
                {/* Impersonate Button */}
                {selectedCustomer && !selectedCustomer.deleted_at && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleImpersonate(selectedCustomer)}
                    disabled={isImpersonating}
                  >
                    {isImpersonating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserCog className="h-4 w-4 mr-2" />
                    )}
                    Logga in som kund
                  </Button>
                )}

                {selectedCustomer?.deleted_at ? (
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => selectedCustomer && restoreCustomerMutation.mutate(selectedCustomer.id)}
                      disabled={restoreCustomerMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Återställ kund
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={permanentDeleteMutation.isPending}>
                          <AlertOctagon className="h-4 w-4 mr-2" />
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
                            <p><strong>Detta går inte att ångra.</strong></p>
                            <p>
                              Kunden och all relaterad data tas bort permanent (profil, lokaler, leads och aktiviteter).
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => selectedCustomer?.user_id && permanentDeleteMutation.mutate(selectedCustomer.user_id)}
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
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Ta bort kund
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ta bort kund?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Detta kommer ta bort{" "}
                          <strong>{selectedCustomer?.display_name || selectedCustomer?.email}</strong>.
                          {(customerListings?.length || 0) > 0 && (
                            <>
                              <br /><br />
                              <span className="text-destructive font-medium">
                                Varning: Kunden har {customerListings?.length} lokal{customerListings?.length !== 1 ? "er" : ""} som också kommer döljas.
                              </span>
                            </>
                          )}
                          <br /><br />
                          Du kan återställa kunden senare om du ändrar dig.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => selectedCustomer && softDeleteMutation.mutate(selectedCustomer.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ta bort
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Customer Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lägg till ny kund</DialogTitle>
            </DialogHeader>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createCustomerMutation.mutate(newCustomer);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">E-post *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="kund@foretag.se"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Lösenord *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={newCustomer.password}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minst 6 tecken"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Namn</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={newCustomer.displayName}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Anna Andersson"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Företag</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={newCustomer.companyName}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Företaget AB"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="070-123 45 67"
                />
              </div>

              <AllowedCitiesSelect
                value={newCustomer.allowedCities}
                onChange={(allowedCities) => setNewCustomer(prev => ({ ...prev, allowedCities }))}
                label="Tillåtna städer *"
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Avbryt
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomerMutation.isPending}
                >
                  {createCustomerMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Skapa kund
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}