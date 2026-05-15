'use client'
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Pencil, RotateCcw, Info } from "lucide-react";
import { 
  useCategorySeoList, 
  useUpsertCategorySeo, 
  useDeleteCategorySeo,
  CategorySeo,
} from "@/hooks/useCategorySeo";
import { categoryHeroConfig, SLUG_TO_TYPE } from "@/config/categoryHeroConfig";
import { PROPERTY_TYPE_LABELS } from "@/types/property";

// All category slugs
const CATEGORY_SLUGS = Object.keys(categoryHeroConfig);

interface CategoryRow {
  slug: string;
  label: string;
  dbEntry: CategorySeo | null;
  defaultConfig: typeof categoryHeroConfig[string];
}

export default function AdminCategorySeoPage() {
  const [selectedCityId, setSelectedCityId] = useState<string>("halmstad");
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [resetCategory, setResetCategory] = useState<CategoryRow | null>(null);
  
  // Form state
  const [formSeoTitle, setFormSeoTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  
  // Fetch cities
  const { data: cities = [] } = useQuery({
    queryKey: ["cities-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  
  // Fetch category SEO entries for selected city
  const { data: categorySeoList = [], isLoading } = useCategorySeoList(selectedCityId);
  
  const upsertMutation = useUpsertCategorySeo();
  const deleteMutation = useDeleteCategorySeo();
  
  // Get current city name for preview
  const currentCityName = cities.find(c => c.id === selectedCityId)?.name || "Stad";
  
  // Build category rows with DB data merged with defaults
  const categoryRows: CategoryRow[] = useMemo(() => {
    return CATEGORY_SLUGS.map(slug => {
      const propertyType = SLUG_TO_TYPE[slug];
      const label = propertyType ? PROPERTY_TYPE_LABELS[propertyType] : slug;
      const dbEntry = categorySeoList.find(e => e.category_slug === slug) || null;
      const defaultConfig = categoryHeroConfig[slug];
      
      return { slug, label, dbEntry, defaultConfig };
    });
  }, [categorySeoList]);
  
  // Open edit dialog
  const handleEdit = (row: CategoryRow) => {
    setEditingCategory(row);
    // Pre-fill form with DB values or defaults
    if (row.dbEntry) {
      setFormSeoTitle(row.dbEntry.seo_title || "");
      setFormSubtitle(row.dbEntry.subtitle || "");
      setFormDescription(row.dbEntry.description || "");
    } else {
      setFormSeoTitle(row.defaultConfig.seoTitle);
      setFormSubtitle(row.defaultConfig.subtitle);
      setFormDescription(row.defaultConfig.description);
    }
  };
  
  // Save changes
  const handleSave = async () => {
    if (!editingCategory) return;
    
    await upsertMutation.mutateAsync({
      city_id: selectedCityId,
      category_slug: editingCategory.slug,
      seo_title: formSeoTitle || null,
      subtitle: formSubtitle || null,
      description: formDescription || null,
    });
    
    setEditingCategory(null);
  };
  
  // Reset to default
  const handleReset = async () => {
    if (!resetCategory) return;
    
    await deleteMutation.mutateAsync({
      cityId: selectedCityId,
      categorySlug: resetCategory.slug,
    });
    
    setResetCategory(null);
  };
  
  // Helper to get display value (DB or default)
  const getDisplayValue = (row: CategoryRow, field: "seoTitle" | "subtitle" | "description") => {
    if (row.dbEntry) {
      const dbField = field === "seoTitle" ? "seo_title" : field;
      return row.dbEntry[dbField as keyof CategorySeo] as string || "";
    }
    return row.defaultConfig[field];
  };
  
  // Replace {cityName} placeholder for preview
  const replaceCity = (text: string) => text.replace("{cityName}", currentCityName);
  
  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Kategori-SEO</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hantera H1-rubriker, underrubriker och SEO-beskrivningar per kategori och stad
            </p>
          </div>
          
          <Select value={selectedCityId} onValueChange={setSelectedCityId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Välj stad" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(city => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Info box */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>
              Använd <code className="px-1 py-0.5 bg-muted rounded text-foreground">{"{cityName}"}</code> som 
              placeholder för stadsnamnet. Det ersätts automatiskt med "{currentCityName}" på publika sidor.
            </p>
          </div>
        </div>
        
        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Kategori</TableHead>
                <TableHead>H1-titel</TableHead>
                <TableHead className="hidden md:table-cell">Subtitle</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Laddar...
                  </TableCell>
                </TableRow>
              ) : (
                categoryRows.map(row => (
                  <TableRow key={row.slug}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {replaceCity(getDisplayValue(row, "seoTitle"))}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                      {replaceCity(getDisplayValue(row, "subtitle"))}
                    </TableCell>
                    <TableCell>
                      {row.dbEntry ? (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Anpassad
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Standard</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {row.dbEntry && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setResetCategory(row)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Redigera SEO för {editingCategory?.label}
            </DialogTitle>
            <DialogDescription>
              Anpassa H1-rubrik, underrubrik och SEO-beskrivning för {currentCityName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seo-title">H1-titel (SEO-titel)</Label>
              <Input
                id="seo-title"
                value={formSeoTitle}
                onChange={(e) => setFormSeoTitle(e.target.value)}
                placeholder="Lediga kontor i {cityName}"
              />
              <p className="text-xs text-muted-foreground">
                Förhandsvisning: <span className="font-medium">{replaceCity(formSeoTitle)}</span>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subtitle">Underrubrik</Label>
              <Input
                id="subtitle"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="Kontorslokaler att hyra i {cityName}."
              />
              <p className="text-xs text-muted-foreground">
                Förhandsvisning: <span className="font-medium">{replaceCity(formSubtitle)}</span>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">SEO-beskrivning</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
                placeholder="Här hittar du lediga kontor..."
              />
              <p className="text-xs text-muted-foreground">
                Används som meta description och dold SEO-text på sidan.
              </p>
            </div>
            
            {/* Default values reference */}
            {editingCategory && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Standardvärden:</p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><span className="font-medium">H1:</span> {editingCategory.defaultConfig.seoTitle}</p>
                  <p><span className="font-medium">Subtitle:</span> {editingCategory.defaultConfig.subtitle}</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Sparar..." : "Spara"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Confirmation Dialog */}
      <AlertDialog open={!!resetCategory} onOpenChange={(open) => !open && setResetCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Återställ till standard?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta tar bort den anpassade texten för {resetCategory?.label} i {currentCityName} och 
              återgår till standardtexten från konfigurationen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Återställ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
