'use client'
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Eye, 
  Users, 
  Pencil, 
  Trash2, 
  Globe, 
  GlobeLock,
  MoreHorizontal,
  Code,
  Share2,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  AlertTriangle,
  Clock,
  Info,
  Building2,
  ArchiveX,
  RotateCcw,
  ListFilter,
  X,
  Star
} from "lucide-react";
import { TypeBadges } from "./TypeBadges";
import { supabase } from "@/integrations/supabase/client";
import { useListings, useDeleteListing, useUpdateListing, useSoftDeleteListing, useRestoreListing, type ListingWithStats } from "@/hooks/useListings";
import { useAdminListings, type AdminListingWithStats } from "@/hooks/useAdminListings";
import { useToggleFeatured, MAX_FEATURED } from "@/hooks/useFeaturedListings";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  draft: "Utkast",
  internal: "Intern",
  published: "Publicerad",
  pending_approval: "Väntar på godkännande",
  rented: "Uthyrd",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  internal: "bg-status-viewing-bg text-status-viewing-text",
  published: "bg-status-won-bg text-status-won-text",
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  rented: "bg-status-contacted-bg text-status-contacted-text",
};

const BASE_URL = "https://leadhantering-fastigheter.lovable.app";

export function ListingsTable() {
  const router = useRouter();
  const pathname = usePathname();
  
  const basePath = pathname.startsWith("/admin") ? "/admin/lokaler" : "/app/lokaler";
  const isAdminView = pathname.startsWith("/admin");
  const isAdvertiserView = pathname.startsWith("/app");
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Use admin hook for admin portal (sees ALL listings), regular hook for advertiser portal (sees ONLY own listings)
  const advertiserListings = useListings();
  const adminListings = useAdminListings(showDeleted);
  
  const { data: listings, isLoading } = isAdminView ? adminListings : advertiserListings;
  const { data: profileData } = useProfileCompletion();
  const deleteListing = useDeleteListing();
  const updateListing = useUpdateListing();
  const softDeleteListing = useSoftDeleteListing();
  const restoreListing = useRestoreListing();
  const toggleFeatured = useToggleFeatured();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [softDeleteId, setSoftDeleteId] = useState<string | null>(null);
  const [unpublishId, setUnpublishId] = useState<string | null>(null);
  const [widgetListing, setWidgetListing] = useState<ListingWithStats | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const profileIncomplete = isAdvertiserView && profileData && !profileData.isComplete;
  const isPendingApproval = isAdvertiserView && profileData && !profileData.isApproved;

  // Get unique types from listings for filter
  const availableTypes = useMemo(() => {
    if (!listings) return [];
    const types = new Set<string>();
    listings.forEach(listing => {
      if (listing.typ) {
        listing.typ.split(",").forEach(t => types.add(t.trim()));
      }
    });
    return Array.from(types).sort();
  }, [listings]);

  // Count featured listings for admin
  const featuredCount = useMemo(() => {
    if (!isAdminView || !listings) return 0;
    return listings.filter(l => (l as AdminListingWithStats).is_featured).length;
  }, [listings, isAdminView]);

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const handleToggleFeatured = (listing: AdminListingWithStats) => {
    const newFeaturedState = !listing.is_featured;
    
    // Only published listings can be featured
    if (newFeaturedState && listing.status !== "published") {
      toast.error("Endast publicerade lokaler kan markeras som utvalda.");
      return;
    }
    
    // Check if we're at max featured
    if (newFeaturedState && featuredCount >= MAX_FEATURED) {
      toast.error(`Max ${MAX_FEATURED} utvalda annonser tillåtna. Ta bort en annan först.`);
      return;
    }

    toggleFeatured.mutate({ listingId: listing.id, isFeatured: newFeaturedState });
  };

  // Fetch advertisers for admin filter
  const { data: advertisers } = useQuery({
    queryKey: ["admin-advertisers-list"],
    queryFn: async () => {
      const { data: advertiserRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "advertiser");

      if (!advertiserRoles || advertiserRoles.length === 0) return [];

      const advertiserUserIds = advertiserRoles.map(r => r.user_id);

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, company_name")
        .in("user_id", advertiserUserIds)
        .is("deleted_at", null)
        .order("company_name", { ascending: true });

      if (error) throw error;
      return profiles || [];
    },
    enabled: isAdminView,
  });

  const filteredListings = useMemo(() => {
    let result = listings || [];
    
    // Filter by advertiser (admin view only)
    if (isAdminView && selectedAdvertiser !== "all") {
      result = result.filter((listing) => listing.owner_id === selectedAdvertiser);
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((listing) => listing.status === statusFilter);
    }
    
    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((listing) => 
        listing.typ?.split(",").map(t => t.trim()).includes(typeFilter)
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((listing) =>
        listing.titel.toLowerCase().includes(term) ||
        listing.adress?.toLowerCase().includes(term) ||
        listing.stad?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [listings, selectedAdvertiser, statusFilter, typeFilter, searchTerm, isAdminView]);

  const handlePublish = (listing: ListingWithStats) => {
    // Don't allow publishing if profile is incomplete (only for advertiser view)
    if (profileIncomplete) {
      toast.error("För att kunna publicera behöver kontaktperson, e-post, telefon, adress och företagsnamn vara ifyllda.", {
        action: {
          label: "Gå till profil",
          onClick: () => router.push("/app/profil"),
        },
      });
      return;
    }
    
    // If advertiser is pending approval, use pending_approval status instead of published
    if (isPendingApproval) {
      updateListing.mutate({ id: listing.id, status: "pending_approval" });
      return;
    }
    
    updateListing.mutate({ id: listing.id, status: "published" }, {
      onSuccess: () => {
        toast.success("Lokalen är publicerad.");
      }
    });
  };

  const handleUnpublish = () => {
    if (unpublishId) {
      // When unpublishing, also remove featured status
      updateListing.mutate({ id: unpublishId, status: "draft", is_featured: false, featured_order: 0 }, {
        onSuccess: () => {
          toast.success("Lokalen är avpublicerad.");
          setUnpublishId(null);
        }
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteListing.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleSoftDelete = () => {
    if (softDeleteId) {
      softDeleteListing.mutate(softDeleteId);
      setSoftDeleteId(null);
    }
  };

  const handleRestore = (id: string) => {
    restoreListing.mutate(id);
  };

  const getListingUrl = (listing: ListingWithStats) => {
    const slug = `${listing.adress || "lokal"}-${listing.typ?.split(",")[0] || "lokal"}-${listing.area_sqm || 0}m2-${listing.id.slice(-6)}`
      .toLowerCase()
      .replace(/[åä]/g, "a")
      .replace(/ö/g, "o")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `${BASE_URL}/lokal/${slug}`;
  };

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error("Kunde inte kopiera");
    }
  };

  const shareToLinkedIn = (listing: ListingWithStats) => {
    const url = getListingUrl(listing);
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, "_blank", "width=600,height=600");
  };

  const shareToFacebook = (listing: ListingWithStats) => {
    const url = getListingUrl(listing);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, "_blank", "width=600,height=600");
  };

  const getWidgetCode = (listing: ListingWithStats) => {
    const url = getListingUrl(listing);
    return `<!-- Halmstadlokaler Widget -->
<div class="halmstadlokaler-widget" data-listing-id="${listing.id}">
  <iframe 
    src="${url}?embed=true" 
    width="100%" 
    height="600" 
    frameborder="0" 
    style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
    title="${listing.titel}"
  ></iframe>
</div>
<!-- /Halmstadlokaler Widget -->`;
  };

  const copyWidgetCode = async () => {
    if (!widgetListing) return;
    const code = getWidgetCode(widgetListing);
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast.success("Widget-kod kopierad!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera");
    }
  };

  // Mobile card component - compact style matching desktop
  const ListingCard = ({ listing }: { listing: ListingWithStats }) => (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
      {/* Main content - clickable */}
      <button
        onClick={() => router.push(`${basePath}/${listing.id}`)}
        className="flex-1 text-left min-w-0"
      >
        <div className="font-medium text-foreground text-sm truncate">
          {listing.titel}
        </div>
        {listing.adress && (
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{listing.adress}{listing.stad && `, ${listing.stad}`}</span>
            {listing.area_sqm && <span className="shrink-0">· {listing.area_sqm} m²</span>}
          </div>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <Badge className={`${statusColors[listing.status]} text-[10px] px-1.5 py-0`}>
            {statusLabels[listing.status]}
          </Badge>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {listing.views_count}
            </span>
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {listing.leads_count}
            </span>
          </div>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant={listing.status === "published" || listing.status === "pending_approval" ? "default" : "outline"}
          size="sm"
          disabled={profileIncomplete && listing.status !== "published" && listing.status !== "pending_approval"}
          onClick={() => {
            if (listing.status === "published" || listing.status === "pending_approval") {
              setUnpublishId(listing.id);
            } else {
              handlePublish(listing);
            }
          }}
          className="h-8 px-2 text-xs"
        >
          {listing.status === "published" ? (
            <GlobeLock className="w-3.5 h-3.5" />
          ) : listing.status === "pending_approval" ? (
            <Clock className="w-3.5 h-3.5" />
          ) : (
            <Globe className="w-3.5 h-3.5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push(`${basePath}/${listing.id}`)}>
              <Pencil className="w-4 h-4 mr-2" />
              Redigera
            </DropdownMenuItem>
            
            {listing.status === "published" && (
              <>
                <DropdownMenuItem onClick={() => window.open(getListingUrl(listing), "_blank")}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visa på hemsidan
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => copyToClipboard(getListingUrl(listing), "Länk kopierad!")}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Kopiera länk
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setWidgetListing(listing)}>
                  <Code className="w-4 h-4 mr-2" />
                  Hämta widget-kod
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Share2 className="w-4 h-4 mr-2" />
                    Dela på sociala medier
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => shareToLinkedIn(listing)}>
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareToFacebook(listing)}>
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}

            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => setDeleteId(listing.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Ta bort
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <section className="flex flex-col h-full min-h-0">
      {/* Sticky header section */}
      <div className="sticky top-0 z-10 bg-background px-4 md:px-8 pt-6 pb-4 shrink-0">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-medium text-foreground">Mina lokaler</h1>
              <p className="text-muted-foreground text-sm">Hantera och publicera dina lokaler</p>
            </div>
            <Button onClick={() => router.push(`${basePath}/ny`)} className="hidden sm:flex">
              <Plus className="w-4 h-4 mr-2" />
              Ny lokal
            </Button>
          </div>
        </div>

        {/* Pending approval info banner - takes priority */}
        {isPendingApproval && !profileIncomplete && (
          <Alert className="mb-4 border-blue-500/50 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-500" />
            <div className="ml-2">
              <p className="font-medium text-foreground">Din annonsörsprofil granskas</p>
              <p className="text-sm text-muted-foreground">
                Din lokal är skapad men visas inte publikt ännu. En administratör behöver först godkänna ditt konto.
              </p>
            </div>
          </Alert>
        )}

        {/* Profile incomplete notice */}
        {profileIncomplete && (
          <Alert className="mb-4 border-amber-500/50 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2 ml-2">
              <div>
                <p className="font-medium text-foreground">Komplettera profilen</p>
                <p className="text-sm text-muted-foreground">
                  För att kunna publicera och ta emot förfrågningar behöver kontaktperson, e-post, telefon, adress och företagsnamn vara ifyllda.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 w-fit">
                <Link href="/app/profil">Gå till profil</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filter row */}
        <div className="flex items-center gap-2">
          {/* Filter dropdown - left side */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={hasActiveFilters ? "default" : "outline"} size="icon" className="shrink-0 sm:hidden h-10 w-10 relative">
                <ListFilter className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {(statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuTrigger asChild>
              <Button variant={hasActiveFilters ? "default" : "outline"} size="default" className="hidden sm:flex gap-2 shrink-0">
                <ListFilter className="h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {(statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-popover">
              <div className="p-2 space-y-3">
                {/* Status filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Alla statusar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla statusar</SelectItem>
                      <SelectItem value="draft">Utkast</SelectItem>
                      <SelectItem value="published">Publicerad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Typ</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Alla typer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla typer</SelectItem>
                      {availableTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="w-full justify-start text-muted-foreground"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rensa filter
                    </Button>
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search field */}
          <div className="flex items-center flex-1 border border-input rounded-md bg-card px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Sök på titel, adress eller stad"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full outline-none text-sm text-foreground placeholder:text-muted-foreground bg-transparent"
            />
          </div>
          {isAdminView && advertisers && advertisers.length > 0 && (
            <Select value={selectedAdvertiser} onValueChange={setSelectedAdvertiser}>
              <SelectTrigger className="w-full sm:w-[220px] bg-card">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Alla annonsörer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla annonsörer</SelectItem>
                {advertisers.map((advertiser) => (
                  <SelectItem key={advertiser.id} value={advertiser.id}>
                    {advertiser.company_name || advertiser.display_name || "Okänd"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {isAdminView && (
            <Button
              variant={showDeleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDeleted(!showDeleted)}
              className="gap-1.5 shrink-0"
            >
              <ArchiveX className="w-4 h-4" />
              {showDeleted ? "Dölj raderade" : "Visa raderade"}
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-6 min-h-0">
        {/* Mobile cards view */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Laddar...</div>
          ) : filteredListings && filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">Du har inga lokaler ännu.</p>
              <Button onClick={() => router.push(`${basePath}/ny`)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Lägg till din första lokal
              </Button>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="font-semibold text-foreground">
              Lokaler{" "}
              {filteredListings && filteredListings.length > 0 && (
                <span className="text-muted-foreground font-normal">
                  ({filteredListings.length})
                </span>
              )}
            </div>
            {isAdminView && (
              <div className="text-xs text-muted-foreground">
                <Star className="w-3 h-3 inline-block text-amber-500 fill-amber-500 mr-1" />
                {featuredCount}/{MAX_FEATURED} utvalda
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                {isAdminView && <th className="px-2 py-2 font-semibold text-center w-10">Utvald</th>}
                <th className="px-4 py-2 font-semibold">Lokal</th>
                {isAdminView && <th className="px-4 py-2 font-semibold">Annonsör</th>}
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold text-center">Statistik</th>
                <th className="px-4 py-2 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdminView ? 6 : 4} className="px-4 py-8 text-center text-muted-foreground">
                    Laddar...
                  </td>
                </tr>
              ) : filteredListings && filteredListings.length > 0 ? (
                filteredListings.map((listing) => {
                  const adminListing = listing as AdminListingWithStats;
                  return (
                  <tr key={listing.id} className="hover:bg-muted/50 transition-colors">
                    {/* Featured star toggle - admin only */}
                    {isAdminView && (
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={() => handleToggleFeatured(adminListing)}
                          disabled={listing.status !== "published" || toggleFeatured.isPending}
                          className={`p-1 rounded transition-colors ${
                            adminListing.is_featured 
                              ? "text-amber-500 hover:text-amber-600" 
                              : "text-muted-foreground/40 hover:text-amber-500"
                          } ${listing.status !== "published" ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                          title={
                            listing.status !== "published" 
                              ? "Endast publicerade annonser kan vara utvalda" 
                              : adminListing.is_featured 
                                ? "Ta bort från utvalda" 
                                : featuredCount >= MAX_FEATURED 
                                  ? `Max ${MAX_FEATURED} utvalda tillåtna` 
                                  : "Markera som utvald"
                          }
                        >
                          <Star 
                            className={`w-4 h-4 ${adminListing.is_featured ? "fill-amber-500" : ""}`} 
                          />
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`${basePath}/${listing.id}`)}
                        className="text-left group"
                      >
                        <div className="font-medium text-foreground group-hover:text-primary group-hover:underline">
                          {listing.titel}
                        </div>
                        {listing.adress && (
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {listing.adress}{listing.stad && `, ${listing.stad}`}
                            {listing.area_sqm && <span className="ml-1">· {listing.area_sqm} m²</span>}
                          </div>
                        )}
                      </button>
                    </td>
                    {isAdminView && (
                      <td className="px-4 py-3">
                        {adminListing.owner_id ? (
                          <button
                            onClick={() => router.push(`/admin/kunder/${adminListing.owner_id}`)}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline text-left"
                          >
                            {adminListing.advertiser_company || adminListing.advertiser_name || "-"}
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {(listing as AdminListingWithStats).deleted_at ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Raderad
                          </Badge>
                        ) : (
                          <Badge className={statusColors[listing.status]}>
                            {statusLabels[listing.status]}
                          </Badge>
                        )}
                        {listing.status === "pending_approval" && !(listing as AdminListingWithStats).deleted_at && (
                          <span className="text-xs text-muted-foreground" title="Lokalen publiceras automatiskt när ditt konto har godkänts.">
                            <Clock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1" title="Visningar">
                          <Eye className="w-3.5 h-3.5" />
                          {listing.views_count}
                        </span>
                        <span className="flex items-center gap-1" title="Leads">
                          <Users className="w-3.5 h-3.5" />
                          {listing.leads_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Publish/Unpublish button - always shown, disabled when profile incomplete */}
                        <Button
                          variant={listing.status === "published" || listing.status === "pending_approval" ? "default" : "outline"}
                          size="sm"
                          disabled={profileIncomplete && listing.status !== "published" && listing.status !== "pending_approval"}
                          onClick={() => {
                            if (listing.status === "published" || listing.status === "pending_approval") {
                              setUnpublishId(listing.id);
                            } else {
                              handlePublish(listing);
                            }
                          }}
                          className="gap-1.5"
                          title={profileIncomplete && listing.status !== "published" && listing.status !== "pending_approval" ? "Slutför profilen för att kunna publicera" : undefined}
                        >
                          {listing.status === "published" ? (
                            <>
                              <GlobeLock className="w-3.5 h-3.5" />
                              Avpublicera
                            </>
                          ) : listing.status === "pending_approval" ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              Väntar...
                            </>
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5" />
                              Publicera
                            </>
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`${basePath}/${listing.id}`)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Redigera
                            </DropdownMenuItem>
                            
                            {listing.status === "published" && (
                              <>
                                <DropdownMenuItem onClick={() => window.open(getListingUrl(listing), "_blank")}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Visa på hemsidan
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => copyToClipboard(getListingUrl(listing), "Länk kopierad!")}>
                                  <LinkIcon className="w-4 h-4 mr-2" />
                                  Kopiera länk
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => setWidgetListing(listing)}>
                                  <Code className="w-4 h-4 mr-2" />
                                  Hämta widget-kod
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Dela på sociala medier
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => shareToLinkedIn(listing)}>
                                      <Linkedin className="w-4 h-4 mr-2" />
                                      LinkedIn
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => shareToFacebook(listing)}>
                                      <Facebook className="w-4 h-4 mr-2" />
                                      Facebook
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              </>
                            )}

                            <DropdownMenuSeparator />

                            {/* Restore option for soft-deleted listings (admin only) */}
                            {isAdminView && (listing as AdminListingWithStats).deleted_at && (
                              <DropdownMenuItem 
                                onClick={() => handleRestore(listing.id)}
                                className="text-green-600 focus:text-green-600"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Återställ
                              </DropdownMenuItem>
                            )}

                            {/* Soft delete option for admin (permanent removal with noindex) */}
                            {isAdminView && !(listing as AdminListingWithStats).deleted_at && (
                              <DropdownMenuItem 
                                onClick={() => setSoftDeleteId(listing.id)}
                                className="text-amber-600 focus:text-amber-600"
                              >
                                <ArchiveX className="w-4 h-4 mr-2" />
                                Radera permanent
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(listing.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Ta bort helt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdminView ? 6 : 4} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <p>Du har inga lokaler ännu.</p>
                      <Button onClick={() => router.push(`${basePath}/ny`)} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Lägg till din första lokal
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={!!unpublishId} onOpenChange={() => setUnpublishId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Avpublicera lokal?</AlertDialogTitle>
            <AlertDialogDescription>
              Lokalen syns inte längre publikt och kan inte få nya förfrågningar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnpublish} className="w-full sm:w-auto">Avpublicera</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort lokal?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta går inte att ångra. Lokalen och all relaterad data kommer att tas bort.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto">Ta bort</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Soft Delete Confirmation Dialog */}
      <AlertDialog open={!!softDeleteId} onOpenChange={() => setSoftDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Radera lokal permanent?</AlertDialogTitle>
            <AlertDialogDescription>
              Lokalen markeras som permanent borttagen och kommer att avindexeras från sökmotorer.
              <br /><br />
              Besökare som har sparat länken ser ett meddelande om att lokalen inte längre finns.
              <br /><br />
              <strong>Du kan återställa lokalen senare om det behövs.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleSoftDelete} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">
              Radera permanent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!widgetListing} onOpenChange={() => setWidgetListing(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Widget-kod
            </DialogTitle>
            <DialogDescription>
              Kopiera koden nedan och klistra in på din webbplats för att visa lokalen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono">
                <code>{widgetListing && getWidgetCode(widgetListing)}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 gap-1.5"
                onClick={copyWidgetCode}
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Kopierad!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Kopiera
                  </>
                )}
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <h4 className="font-medium mb-2">Tips</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm">
                <li>Klistra in koden där du vill visa lokalen på din webbplats</li>
                <li>Widgeten anpassar sig automatiskt till bredden</li>
                <li>Du kan ändra höjden genom att justera height-värdet</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile FAB */}
      <button
        onClick={() => router.push(`${basePath}/ny`)}
        className="sm:hidden fixed bottom-6 right-6 z-50 h-12 px-5 rounded-full 
                   bg-teal-600 text-white shadow-lg hover:bg-teal-700 
                   flex items-center gap-2 transition-all
                   hover:scale-105 active:scale-95 font-medium"
        aria-label="Lägg till ny lokal"
      >
        <Plus className="w-5 h-5" />
        Ny lokal
      </button>
    </section>
  );
}
