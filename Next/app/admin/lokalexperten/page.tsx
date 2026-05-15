'use client'
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAllGuidesAdmin,
  GUIDE_CATEGORIES,
  GUIDE_CATEGORY_LABELS,
  calculateReadingTime,
  slugifyGuideTitle,
  type Guide,
} from "@/lib/localexpert";

interface FormState {
  title: string;
  slug: string;
  city: string;
  area: string;
  categories: string[];
  excerpt: string;
  content: string;
  seo_title: string;
  seo_description: string;
  image: string;
  published: boolean;
  featured: boolean;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  city: "halmstad",
  area: "",
  categories: ["kontor"],
  excerpt: "",
  content: "",
  seo_title: "",
  seo_description: "",
  image: "",
  published: false,
  featured: false,
  sort_order: 0,
};

export default function AdminLocalExpertPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Guide | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["localexpert", "admin", "all"],
    queryFn: fetchAllGuidesAdmin,
  });

  const readingTime = useMemo(
    () => calculateReadingTime(form.content),
    [form.content]
  );

  const isOpen = creating || !!editing;

  // When opening editor, populate form
  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        slug: editing.slug,
        city: editing.city,
        area: editing.area || "",
        categories:
          editing.categories && editing.categories.length > 0
            ? editing.categories
            : editing.category
              ? [editing.category]
              : ["kontor"],
        excerpt: editing.excerpt || "",
        content: editing.content || "",
        seo_title: editing.seo_title || "",
        seo_description: editing.seo_description || "",
        image: editing.image || "",
        published: editing.published,
        featured: editing.featured,
        sort_order: editing.sort_order,
      });
      setSlugTouched(true);
    } else if (creating) {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
    }
  }, [editing, creating]);

  // Auto-generate slug from title when slug not manually edited
  useEffect(() => {
    if (!slugTouched && form.title) {
      setForm((prev) => ({ ...prev, slug: slugifyGuideTitle(form.title) }));
    }
  }, [form.title, slugTouched]);

  const close = () => {
    setEditing(null);
    setCreating(false);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
  };

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugifyGuideTitle(form.title),
        city: form.city.trim() || "halmstad",
        area: form.area.trim() || null,
        category: form.categories[0] || null,
        categories: form.categories,
        excerpt: form.excerpt.trim() || null,
        content: form.content || null,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        image: form.image.trim() || null,
        published: form.published,
        featured: form.featured,
        sort_order: Number(form.sort_order) || 0,
        reading_time: calculateReadingTime(form.content),
      };

      if (editing) {
        const { error } = await supabase
          .from("guides")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guides").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localexpert"] });
      toast({ title: editing ? "Guide uppdaterad" : "Guide skapad" });
      close();
    },
    onError: (err: any) => {
      toast({
        title: "Något gick fel",
        description: err?.message || "Kunde inte spara guiden.",
        variant: "destructive",
      });
    },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("guides")
        .update({ published: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["localexpert"] }),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("guides")
        .update({ featured: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["localexpert"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localexpert"] });
      toast({ title: "Guide borttagen" });
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast({
        title: "Kunde inte ta bort",
        description: err?.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Lokalexperten</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hantera guider och lokalt innehåll för Lokalexperten-sektionen.
            </p>
          </div>
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ny guide
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">Stad</TableHead>
                <TableHead className="hidden lg:table-cell">Område</TableHead>
                <TableHead className="hidden lg:table-cell">Kategori</TableHead>
                <TableHead className="hidden lg:table-cell">Min</TableHead>
                <TableHead>Publicerad</TableHead>
                <TableHead>Utvald</TableHead>
                <TableHead className="hidden md:table-cell">Sortering</TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Laddar...
                  </TableCell>
                </TableRow>
              ) : guides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Inga guider ännu. Skapa den första med "Ny guide".
                  </TableCell>
                </TableRow>
              ) : (
                guides.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium max-w-[260px] truncate">
                      {g.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[180px] truncate">
                      {g.slug}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {g.city}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {g.area || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {g.category || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {g.reading_time ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={g.published}
                        onCheckedChange={(v) =>
                          togglePublishedMutation.mutate({ id: g.id, value: v })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={g.featured}
                        onCheckedChange={(v) =>
                          toggleFeaturedMutation.mutate({ id: g.id, value: v })
                        }
                      />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {g.sort_order}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(g)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(g.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Redigera guide" : "Ny guide"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm({ ...form, slug: e.target.value });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Stad</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Område</Label>
                <Input
                  id="area"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="t.ex. Centrum, Flygstaden"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategorier</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {GUIDE_CATEGORIES.map((c) => {
                    const active = form.categories.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            categories: active
                              ? form.categories.filter((x) => x !== c)
                              : [...form.categories, c],
                          })
                        }
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {GUIDE_CATEGORY_LABELS[c]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (kort sammanfattning)</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Innehåll (markdown)</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={14}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Beräknad lästid: {readingTime} min
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Bild-URL</Label>
              <Input
                id="image"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO-titel</Label>
                <Input
                  id="seo_title"
                  value={form.seo_title}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sortering</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO-beskrivning</Label>
              <Textarea
                id="seo_description"
                value={form.seo_description}
                onChange={(e) =>
                  setForm({ ...form, seo_description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={form.published}
                  onCheckedChange={(v) => setForm({ ...form, published: v })}
                />
                <Label htmlFor="published">Publicerad</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={form.featured}
                  onCheckedChange={(v) => setForm({ ...form, featured: v })}
                />
                <Label htmlFor="featured">Utvald</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Avbryt
            </Button>
            <Button
              onClick={() => upsertMutation.mutate()}
              disabled={
                upsertMutation.isPending ||
                !form.title.trim() ||
                !form.slug.trim()
              }
            >
              {upsertMutation.isPending ? "Sparar..." : "Spara"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort guide?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta går inte att ångra. Guiden tas bort permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
