"use client";

import React from "react";
import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Filter,
  Search,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  group_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  is_top_level: boolean;
  icon: string | null;
  banner_image: string | null;
  created_at: string;
  updated_at: string;
}

const GROUP_CHOICES = [
  "Audience",
  "Product Type",
  "Shoe Styles",
  "Style / Occasion",
  "Niche",
];

const DEFAULT_GROUP = "Product Type";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const fallbackCategories: Category[] = []; // empty: user must run migration

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    slug: "",
    group_name: DEFAULT_GROUP,
    description: "",
    is_active: true,
    is_top_level: false,
    display_order: 0,
  });

  const supabase = React.useMemo(() => createClient(), []);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("group_name", { ascending: true })
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      setRows((data as Category[]) || []);
    } catch (err: any) {
      console.warn("Could not load categories (table may not exist yet):", err?.message || err);
      toast.error(
        err?.message?.includes("does not exist")
          ? "Categories table missing — run migration 002 SQL in Supabase first"
          : `Couldn't load categories: ${err?.message ?? "unknown error"}`
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      group_name: DEFAULT_GROUP,
      description: "",
      is_active: true,
      is_top_level: false,
      display_order:
        rows.length > 0 ? Math.max(...rows.map((r) => r.display_order), 0) + 1 : 0,
    });
    setEditing(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      group_name: c.group_name,
      description: c.description ?? "",
      is_active: c.is_active,
      is_top_level: c.is_top_level,
      display_order: c.display_order,
    });
    setDialogOpen(true);
  };

  const saveCategory = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error("Category name is required");
      return;
    }
    const slug = form.slug.trim() || slugify(trimmedName);
    if (!slug) {
      toast.error("Slug is required");
      return;
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: trimmedName,
            slug,
            group_name: form.group_name,
            description: form.description.trim() || null,
            is_active: form.is_active,
            is_top_level: form.is_top_level,
            display_order: form.display_order,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success(`Updated category: ${trimmedName}`);
      } else {
        const { error } = await supabase.from("categories").insert([
          {
            name: trimmedName,
            slug,
            group_name: form.group_name,
            description: form.description.trim() || null,
            is_active: form.is_active,
            is_top_level: form.is_top_level,
            display_order: form.display_order,
          },
        ]);
        if (error) throw error;
        toast.success(`Added category: ${trimmedName}`);
      }
      setDialogOpen(false);
      resetForm();
      await load();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.message?.includes("duplicate") || err?.code === "23505"
          ? `Duplicate name or slug: "${trimmedName}" / "${slug}" already exists`
          : `Could not save: ${err?.message ?? "unknown"}`
      );
    }
  };

  const toggleActive = async (c: Category) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !c.is_active })
        .eq("id", c.id);
      if (error) throw error;
      toast.success(
        `${c.name} is now ${!c.is_active ? "ACTIVE" : "INACTIVE"}`
      );
      await load();
    } catch (err: any) {
      toast.error(`Could not toggle: ${err?.message ?? "unknown"}`);
    }
  };

  const moveOrder = async (c: Category, dir: -1 | 1) => {
    // Simple reorder: shift display_order within its group.
    const groupRows = rows
      .filter((r) => r.group_name === c.group_name)
      .sort((a, b) => a.display_order - b.display_order);
    const idx = groupRows.findIndex((r) => r.id === c.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= groupRows.length) return;
    const swap = groupRows[swapIdx];
    try {
      const a = supabase
        .from("categories")
        .update({ display_order: swap.display_order })
        .eq("id", c.id);
      const b = supabase
        .from("categories")
        .update({ display_order: c.display_order })
        .eq("id", swap.id);
      await Promise.all([a, b]);
      toast.success(`Moved ${c.name} ${dir < 0 ? "up" : "down"}`);
      await load();
    } catch (err: any) {
      toast.error(`Could not reorder: ${err?.message ?? "unknown"}`);
    }
  };

  const removeCategory = async (c: Category) => {
    if (
      !window.confirm(
        `Delete "${c.name}"?\n\nThis won't remove the tag from existing products, but it will no longer appear in filters/admin pickers.`
      )
    )
      return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", c.id);
      if (error) throw error;
      toast.success(`Deleted: ${c.name}`);
      await load();
    } catch (err: any) {
      toast.error(`Could not delete: ${err?.message ?? "unknown"}`);
    }
  };

  // Apply filters
  const groupsInData = Array.from(new Set(rows.map((r) => r.group_name))).sort();
  const filtered = rows.filter((r) => {
    const matchesQ =
      query.trim() === ""
        ? true
        : (r.name + " " + (r.description ?? "") + " " + r.slug)
            .toLowerCase()
            .includes(query.trim().toLowerCase());
    const matchesGroup = groupFilter === "all" || r.group_name === groupFilter;
    const matchesActive = !showActiveOnly || r.is_active;
    return matchesQ && matchesGroup && matchesActive;
  });

  // Group filtered into sections
  const grouped = new Map<string, Category[]>();
  for (const r of filtered) {
    if (!grouped.has(r.group_name)) grouped.set(r.group_name, []);
    grouped.get(r.group_name)!.push(r);
  }
  // preserve GROUP_CHOICES order + add any new groups
  const orderedGroups: string[] = [];
  for (const g of GROUP_CHOICES) if (grouped.has(g)) orderedGroups.push(g);
  for (const g of groupsInData) if (!GROUP_CHOICES.includes(g) && grouped.has(g)) orderedGroups.push(g);

  const activeCount = rows.filter((r) => r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Tag className="h-7 w-7 text-primary" />
            Categories
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Build, reorder & toggle the category taxonomy used across product
            admin, customer filters, and homepage / footer navigation.
          </p>
          <p className="text-xs text-text-muted mt-2">
            {rows.length} total · {activeCount} active · {groupsInData.length} groups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="text-sm"
          >
            {loading ? "Loading…" : "Refresh"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Category" : "New Category"}
                </DialogTitle>
                <DialogDescription>
                  Categories become filterable tags in the shop & pickable in
                  ProductForm. Top-level categories appear as /shop/{`<slug>`}
                  landing pages.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Pantyhose"
                      value={form.name}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          name: e.target.value,
                          slug:
                            f.slug && !editing
                              ? f.slug
                              : !editing
                                ? slugify(e.target.value)
                                : f.slug,
                        }));
                      }}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      placeholder="e.g. pantyhose"
                      value={form.slug}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Group</Label>
                    <Select
                      value={form.group_name}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, group_name: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_CHOICES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                        {/* allow any custom group already in data */}
                        {groupsInData
                          .filter((g) => !GROUP_CHOICES.includes(g))
                          .map((g) => (
                            <SelectItem key={`extra-${g}`} value={g}>
                              {g} (custom)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      min={0}
                      value={form.display_order}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          display_order: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <textarea
                    id="description"
                    rows={2}
                    className="flex w-full rounded-md border border-border-light bg-background px-3 py-2 text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Short internal / SEO description..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center justify-between rounded-lg border border-border-light p-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Active</p>
                      <p className="text-[11px] text-text-muted">
                        Show in filters & pickers
                      </p>
                    </div>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, is_active: v }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border-light p-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" /> Top-level
                      </p>
                      <p className="text-[11px] text-text-muted">
                        /shop/<code>{form.slug || "slug"}</code> route
                      </p>
                    </div>
                    <Switch
                      checked={form.is_top_level}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, is_top_level: v }))
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button onClick={saveCategory} className="gap-2">
                  <Save className="h-4 w-4" />
                  {editing ? "Save Changes" : "Create Category"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Browse
          </CardTitle>
          <CardDescription>
            Filter by group or search. Click a category&apos;s pen icon to edit, or
            the arrows to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search name or slug..."
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groupsInData.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm">
            <label className="inline-flex items-center gap-2 text-text-secondary">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Active only
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Grouped category list */}
      {loading ? (
        <div className="py-16 text-center text-text-secondary">
          Loading categories...
        </div>
      ) : rows.length === 0 ? (
        <Card className="bg-amber-50/40 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">
              No categories yet (or the <code>categories</code> table is missing)
            </CardTitle>
            <CardDescription>
              Run migration file{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded">
                supabase/migrations/002_dynamic_categories.sql
              </code>{" "}
              in your Supabase SQL Editor to seed the starter taxonomy. Then
              click &quot;Refresh&quot; above.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : orderedGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-text-secondary">
            No categories match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orderedGroups.map((groupName) => {
            const groupRows = grouped.get(groupName)!;
            return (
              <Card key={groupName}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {groupName}
                        <Badge variant="outline" className="text-xs">
                          {groupRows.length}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Drag-free reordering: use ↑ / ↓ arrows next to each row.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border border-border-light">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 text-xs uppercase tracking-wider text-text-secondary">
                        <tr>
                          <th className="text-left px-4 py-2">Name</th>
                          <th className="text-left px-4 py-2 hidden md:table-cell">
                            Slug
                          </th>
                          <th className="text-center px-4 py-2">Active</th>
                          <th className="text-center px-4 py-2 hidden lg:table-cell">
                            Top-level
                          </th>
                          <th className="text-center px-4 py-2 hidden md:table-cell">
                            Order
                          </th>
                          <th className="text-right px-4 py-2 w-[160px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {groupRows.map((c) => (
                          <tr
                            key={c.id}
                            className={
                              !c.is_active ? "opacity-50 bg-muted/10" : "hover:bg-muted/20"
                            }
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-3">
                                <div className="pt-0.5 text-primary">
                                  <Tag className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">{c.name}</p>
                                  {c.description && (
                                    <p className="text-xs text-text-muted line-clamp-1">
                                      {c.description}
                                    </p>
                                  )}
                                  <div className="md:hidden mt-1 flex items-center gap-2 text-[11px] text-text-muted">
                                    <span>/{c.slug}</span>
                                    <span>·</span>
                                    <span>#{c.display_order}</span>
                                    {c.is_top_level && (
                                      <>
                                        <span>·</span>
                                        <span className="text-amber-600">
                                          ⭐ top-level
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <code className="text-xs bg-muted/40 px-1.5 py-0.5 rounded">
                                /{c.slug}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleActive(c)}
                                title={c.is_active ? "Deactivate" : "Activate"}
                                className="inline-block text-primary hover:opacity-80 transition-opacity"
                              >
                                {c.is_active ? (
                                  <ToggleRight className="h-6 w-6" />
                                ) : (
                                  <ToggleLeft className="h-6 w-6 text-text-muted" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center hidden lg:table-cell">
                              {c.is_top_level ? (
                                <Star className="h-4 w-4 text-amber-500 inline fill-amber-400" />
                              ) : (
                                <span className="text-text-muted text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center hidden md:table-cell">
                              <span className="inline-flex items-center gap-1 tabular-nums text-text-secondary">
                                {c.display_order}
                                <span className="flex flex-col ml-1">
                                  <button
                                    onClick={() => moveOrder(c, -1)}
                                    className="p-0.5 text-text-muted hover:text-primary disabled:opacity-30"
                                    title="Move up"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => moveOrder(c, +1)}
                                    className="p-0.5 text-text-muted hover:text-primary disabled:opacity-30"
                                    title="Move down"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => moveOrder(c, -1)}
                                  className="md:hidden p-1.5 rounded hover:bg-muted text-text-muted hover:text-primary"
                                  title="Move up"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => moveOrder(c, +1)}
                                  className="md:hidden p-1.5 rounded hover:bg-muted text-text-muted hover:text-primary"
                                  title="Move down"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(c)}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCategory(c)}
                                  title="Delete"
                                  className="text-error hover:text-error hover:bg-error/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
