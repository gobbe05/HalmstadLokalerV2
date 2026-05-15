'use client'
import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useCities, useCreateCity, useUpdateCity, useDeleteCity } from "@/hooks/useCities";
import { useAdminCityStats } from "@/hooks/useAdminCityStats";
import { useAdminCityCustomers } from "@/hooks/useAdminCityCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Pencil, Trash2, Globe, MapPin, CheckCircle2, XCircle, Building2, Users, ExternalLink, AlertTriangle } from "lucide-react";
import { CityLaunchChecklist, getCityLaunchReadiness } from "@/components/admin/CityLaunchChecklist";
import { CityImageUpload } from "@/components/admin/CityImageUpload";
import { CitySchemaConfig } from "@/components/admin/CitySchemaConfig";
import type { City } from "@/contexts/CityContext";
import Link from "next/link";

type FilterMode = "all" | "published" | "unpublished" | "not-ready";

export default function AdminCitiesPage() {
  const queryClient = useQueryClient();
  const { data: cities = [], isLoading } = useCities();
  const { data: cityStats } = useAdminCityStats();
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();

  const [editingCity, setEditingCity] = useState<Partial<City> | null>(null);
  const [deletingCity, setDeletingCity] = useState<City | null>(null);
  const [viewingCustomersCity, setViewingCustomersCity] = useState<City | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Fetch customers for the selected city
  const { data: cityCustomers = [], isLoading: isLoadingCustomers } = useAdminCityCustomers(
    viewingCustomersCity?.id ?? null
  );

  const filteredCities = useMemo(() => {
    switch (filterMode) {
      case "published":
        return cities.filter((c) => c.is_published);
      case "unpublished":
        return cities.filter((c) => !c.is_published);
      case "not-ready":
        return cities.filter((c) => !getCityLaunchReadiness(c).isReady);
      default:
        return cities;
    }
  }, [cities, filterMode]);

  const stats = useMemo(() => {
    const published = cities.filter((c) => c.is_published).length;
    const unpublished = cities.filter((c) => !c.is_published).length;
    const notReady = cities.filter((c) => !getCityLaunchReadiness(c).isReady).length;
    return { published, unpublished, notReady };
  }, [cities]);

  const handleNew = () => {
    setIsNew(true);
    setEditingCity({
      id: "",
      name: "",
      domain: "",
      is_published: false,
      seo_title: "",
      seo_description: "",
      intro_text: "",
    });
  };

  const handleEdit = (city: City) => {
    setIsNew(false);
    setEditingCity({ ...city });
  };

  const handleSave = () => {
    if (!editingCity) return;

    if (isNew) {
      createCity.mutate(editingCity, {
        onSuccess: () => setEditingCity(null),
      });
    } else {
      updateCity.mutate(editingCity as City, {
        onSuccess: () => setEditingCity(null),
      });
    }
  };

  const handleDelete = () => {
    if (deletingCity) {
      deleteCity.mutate(deletingCity.id, {
        onSuccess: () => setDeletingCity(null),
      });
    }
  };

  const getStats = (cityId: string) => {
    return cityStats?.get(cityId) || { listings_count: 0, customers_count: 0 };
  };

  return (
    <AdminLayout>
      <section className="flex-1 px-4 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium">Städer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hantera städer och domäner för multi-city support
            </p>
          </div>
          <Button onClick={handleNew} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Lägg till stad
          </Button>
        </div>

        {/* Filter buttons and summary */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            variant={filterMode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMode("all")}
          >
            Alla ({cities.length})
          </Button>
          <Button
            variant={filterMode === "published" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMode("published")}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Publicerade ({stats.published})
          </Button>
          <Button
            variant={filterMode === "unpublished" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMode("unpublished")}
          >
            <XCircle className="w-3 h-3 mr-1" />
            Ej publicerade ({stats.unpublished})
          </Button>
          {stats.notReady > 0 && (
            <Button
              variant={filterMode === "not-ready" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setFilterMode("not-ready")}
              className={filterMode !== "not-ready" ? "border-destructive text-destructive hover:bg-destructive/10" : ""}
            >
              ⚠️ Ej redo ({stats.notReady})
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Laddar...</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {filteredCities.map((city) => {
                const stats = getStats(city.id);
                return (
                  <Card key={city.id} className="border-l-2 border-l-teal-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-teal-500" />
                          {city.name}
                        </CardTitle>
                        {city.is_published ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Publicerad
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="w-3 h-3" />
                            Ej publicerad
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">ID:</span> {city.id}
                      </div>
                      {city.domain && (
                        <div className="text-sm flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <a 
                            href={`https://${city.domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {city.domain}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {stats.listings_count} lokaler
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingCustomersCity(city)}
                          className="flex items-center gap-1 hover:text-primary hover:underline transition-colors"
                        >
                          <Users className="w-3 h-3" />
                          {stats.customers_count} kunder
                        </button>
                      </div>
                      
                      {/* Launch readiness checklist */}
                      <div className="pt-2 border-t">
                        <CityLaunchChecklist city={city} />
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(city)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Redigera
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingCity(city)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Card className="border-l-2 border-l-teal-600">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-muted border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold w-[10%]">ID</th>
                      <th className="px-3 py-2.5 font-semibold w-[10%]">Namn</th>
                      <th className="px-3 py-2.5 font-semibold w-[16%]">Domän</th>
                      <th className="px-2 py-2.5 font-semibold text-center w-[6%]">Lok.</th>
                      <th className="px-2 py-2.5 font-semibold text-center w-[6%]">Kunder</th>
                      <th className="px-3 py-2.5 font-semibold w-[10%]">Status</th>
                      <th className="px-3 py-2.5 font-semibold w-[12%]">Lansering</th>
                      <th className="px-3 py-2.5 font-semibold w-[22%]">SEO-titel</th>
                      <th className="px-2 py-2.5 font-semibold text-right w-[8%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCities.map((city) => {
                      const stats = getStats(city.id);
                      return (
                        <tr key={city.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-xs truncate" title={city.id}>{city.id}</td>
                          <td className="px-3 py-2.5 font-medium truncate" title={city.name}>{city.name}</td>
                          <td className="px-3 py-2.5">
                            {city.domain ? (
                              <a 
                                href={`https://${city.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline truncate"
                                title={city.domain}
                              >
                                <Globe className="w-3 h-3 shrink-0" />
                                <span className="truncate">{city.domain}</span>
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center tabular-nums">
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              {stats.listings_count}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 text-center tabular-nums">
                            <button
                              type="button"
                              onClick={() => setViewingCustomersCity(city)}
                              className="inline-flex items-center gap-1 text-xs hover:text-primary hover:underline transition-colors"
                            >
                              <Users className="w-3 h-3 text-muted-foreground" />
                              {stats.customers_count}
                            </button>
                          </td>
                          <td className="px-3 py-2.5">
                            {city.is_published ? (
                              <Badge variant="default" className="gap-1 text-[10px] px-1.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="hidden lg:inline">Publicerad</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 text-[10px] px-1.5">
                                <XCircle className="w-3 h-3" />
                                <span className="hidden lg:inline">Ej pub.</span>
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <CityLaunchChecklist city={city} compact />
                          </td>
                          <td className="px-3 py-2.5 text-sm text-muted-foreground truncate" title={city.seo_title || undefined}>
                            {city.seo_title || "—"}
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEdit(city)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDeletingCity(city)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          </>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={!!editingCity} onOpenChange={(open) => !open && setEditingCity(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isNew ? "Lägg till stad" : "Redigera stad"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city-id">ID (unik, t.ex. "varberg")</Label>
                  <Input
                    id="city-id"
                    value={editingCity?.id || ""}
                    onChange={(e) =>
                      setEditingCity((prev) => ({ ...prev, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
                    }
                    disabled={!isNew}
                    placeholder="varberg"
                  />
                </div>
                <div>
                  <Label htmlFor="city-name">Namn</Label>
                  <Input
                    id="city-name"
                    value={editingCity?.name || ""}
                    onChange={(e) =>
                      setEditingCity((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Varberg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="city-domain">Domän</Label>
                <Input
                  id="city-domain"
                  value={editingCity?.domain || ""}
                  onChange={(e) =>
                    setEditingCity((prev) => ({ ...prev, domain: e.target.value }))
                  }
                  placeholder="varberglokaler.se"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Produktionsdomänen för denna stad (utan https://)
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="city-published" className="text-base">Publicerad</Label>
                  <p className="text-sm text-muted-foreground">
                    Markera som publicerad när domänen är konfigurerad och redo
                  </p>
                </div>
                <Switch
                  id="city-published"
                  checked={editingCity?.is_published ?? false}
                  onCheckedChange={(checked) =>
                    setEditingCity((prev) => ({ ...prev, is_published: checked }))
                  }
                />
              </div>

              {/* Publish validation warning */}
              {editingCity?.is_published && (!editingCity?.domain || !editingCity?.hero_image_url) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {!editingCity?.domain && !editingCity?.hero_image_url
                      ? "Domän och hero-bild krävs för publicering"
                      : !editingCity?.domain
                      ? "Domän krävs för publicering"
                      : "Hero-bild krävs för publicering"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Image uploads - only show for existing cities */}
              {!isNew && editingCity?.id && (
                <div className="space-y-4 pt-2 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground">Bilder</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CityImageUpload
                      cityId={editingCity.id}
                      imageType="hero"
                      currentUrl={editingCity.hero_image_url ?? null}
                      blurPlaceholder={editingCity.hero_blur_placeholder ?? null}
                      onUploadComplete={(url, blur) => {
                        setEditingCity((prev) => ({
                          ...prev,
                          hero_image_url: url,
                          hero_blur_placeholder: blur ?? prev?.hero_blur_placeholder,
                        }));
                        queryClient.invalidateQueries({ queryKey: ["cities"] });
                      }}
                    />
                    <CityImageUpload
                      cityId={editingCity.id}
                      imageType="og"
                      currentUrl={editingCity.og_image_url ?? null}
                      onUploadComplete={(url) => {
                        setEditingCity((prev) => ({
                          ...prev,
                          og_image_url: url,
                        }));
                        queryClient.invalidateQueries({ queryKey: ["cities"] });
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="city-seo-title">SEO-titel</Label>
                <Input
                  id="city-seo-title"
                  value={editingCity?.seo_title || ""}
                  onChange={(e) =>
                    setEditingCity((prev) => ({ ...prev, seo_title: e.target.value }))
                  }
                  placeholder="Lediga lokaler i Varberg | Hitta din nästa lokal"
                />
              </div>
              <div>
                <Label htmlFor="city-seo-desc">SEO-beskrivning</Label>
                <Textarea
                  id="city-seo-desc"
                  value={editingCity?.seo_description || ""}
                  onChange={(e) =>
                    setEditingCity((prev) => ({ ...prev, seo_description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Meta-beskrivning för sökmotorer..."
                />
              </div>
              <div>
                <Label htmlFor="city-intro">Introduktionstext</Label>
                <Textarea
                  id="city-intro"
                  value={editingCity?.intro_text || ""}
                  onChange={(e) =>
                    setEditingCity((prev) => ({ ...prev, intro_text: e.target.value }))
                  }
                  rows={3}
                  placeholder="Välkomnande text som visas på startsidan..."
                />
              </div>

              {/* Schema Markup configuration - only for existing cities */}
              {!isNew && editingCity?.id && (
                <CitySchemaConfig 
                  cityId={editingCity.id} 
                  cityName={editingCity.name || ""} 
                  cityDomain={editingCity.domain}
                />
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setEditingCity(null)} className="w-full sm:w-auto">
                Avbryt
              </Button>
              <Button
                onClick={handleSave}
                disabled={createCity.isPending || updateCity.isPending || !editingCity?.id || !editingCity?.name}
                className="w-full sm:w-auto"
              >
                {isNew ? "Skapa" : "Spara"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deletingCity} onOpenChange={(open) => !open && setDeletingCity(null)}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Ta bort stad?</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill ta bort staden "{deletingCity?.name}"? Lokaler kopplade till denna stad kommer att förlora sin stadskoppling.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto">Ta bort</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* City Customers Dialog */}
        <Dialog open={!!viewingCustomersCity} onOpenChange={(open) => !open && setViewingCustomersCity(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-500" />
                Kunder i {viewingCustomersCity?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 overflow-y-auto max-h-[50vh]">
              {isLoadingCustomers ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Laddar...</p>
              ) : cityCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Inga kunder kopplade till denna stad.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {cityCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {customer.company_name || customer.display_name || "Okänd"}
                        </p>
                        {customer.email && (
                          <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={customer.status === "approved" ? "default" : customer.status === "pending" ? "secondary" : "destructive"}
                          className="text-[10px]"
                        >
                          {customer.status === "approved" ? "Godkänd" : customer.status === "pending" ? "Väntar" : "Avvisad"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          asChild
                        >
                          <Link href={`/admin/kunder/${customer.id}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingCustomersCity(null)}>
                Stäng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </AdminLayout>
  );
}
