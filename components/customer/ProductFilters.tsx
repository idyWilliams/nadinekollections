"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import { MobileFilterSheet } from "@/components/customer/MobileFilterSheet";
import { createClient } from "@/lib/supabase/client";

interface ProductFiltersProps {
  categoryName: string;
  totalItems: number;
  activeCategory: string;
}

// Replicated category group taxonomy from ProductForm — customer-facing.
const CATEGORY_GROUPS: Record<string, string[]> = {
  Audience: ["Women", "Men", "Kids", "Teens", "Girls", "Boys"],
  "Product Type": [
    "Clothing",
    "Shoes",
    "Wigs",
    "Bags",
    "Handbags",
    "Purses",
    "Watches",
    "Jewelry",
    "Earrings",
    "Bangles",
    "Hosiery",
    "Pantyhose",
    "Scarves",
    "Caps",
    "Jeans",
    "Shirts",
    "Suits",
    "Makeup",
    "Makeup Brushes",
    "Makeup Boxes",
    "Ring Lights",
    "Phone Holders",
    "Cameras",
    "Dashcams",
  ],
  "Shoe Styles": [
    "Pumps",
    "Heels",
    "Flats",
    "Loafers",
    "Palms",
    "Sneakers",
    "Sandals",
    "Boots",
    "Slippers",
  ],
  "Style / Occasion": [
    "Corporate Wear",
    "Leisure Wear",
    "Casual Wear",
    "Formal Wear",
    "School Wear",
  ],
  Niche: ["Aviation", "Aviation Pins"],
};

const ALL_CATEGORIES_FLAT = Object.values(CATEGORY_GROUPS).flat();

interface Brand {
  id: string;
  name: string;
  slug?: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
];

type FilterContentProps = {
  categoryName: string;
  totalItems: number;
  activeCategory: string;
  selectedCategories: Set<string>;
  selectedBrands: Set<string>;
  minPrice: string;
  maxPrice: string;
  sort: string;
  brands: Brand[];
  toggleCategory: (c: string) => void;
  toggleBrand: (id: string) => void;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  setSort: (v: string) => void;
  clearAll: () => void;
  applyFilters: () => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (k: string) => void;
};

function FilterContent(props: FilterContentProps) {
  const {
    categoryName,
    totalItems,
    activeCategory,
    selectedCategories,
    selectedBrands,
    minPrice,
    maxPrice,
    sort,
    brands,
    toggleCategory,
    toggleBrand,
    setMinPrice,
    setMaxPrice,
    setSort,
    clearAll,
    applyFilters,
    expandedSections,
    toggleSection,
  } = props;

  const hasActiveFilters =
    selectedCategories.size > 0 ||
    selectedBrands.size > 0 ||
    minPrice !== "" ||
    maxPrice !== "";

  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
        <p className="text-text-secondary">{totalItems} products found</p>
      </div>

      <div className="flex items-center justify-between md:hidden">
        <div>
          <h1 className="text-xl font-bold">{categoryName}</h1>
          <p className="text-xs text-text-secondary">{totalItems} found</p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-primary font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Sort By</h3>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-md border border-border-light bg-surface p-2 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories - grouped */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Categories</h3>
          {selectedCategories.size > 0 && (
            <span className="text-[11px] text-primary font-medium">
              {selectedCategories.size} selected
            </span>
          )}
        </div>

        <div className="space-y-2">
          {Object.entries(CATEGORY_GROUPS).map(([groupName, options]) => {
            // For a dedicated category page (/shop/women etc), skip the audience
            // group containing the active category already — focus on refinement.
            const isAudience = groupName === "Audience";
            const audienceActive =
              activeCategory &&
              options
                .map((o) => o.toLowerCase())
                .includes(activeCategory.toLowerCase());
            if (isAudience && audienceActive && activeCategory !== "all") {
              return null;
            }

            const isExpanded = expandedSections[groupName] ?? true;

            return (
              <div
                key={groupName}
                className="border border-border-light rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(groupName)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {groupName}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                  )}
                </button>
                {isExpanded && (
                  <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
                    {options.map((cat) => {
                      const checked = selectedCategories.has(cat);
                      return (
                        <label
                          key={cat}
                          className="flex items-center gap-2.5 py-1 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategory(cat)}
                            className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary accent-primary"
                          />
                          <span
                            className={
                              "text-sm transition-colors " +
                              (checked
                                ? "text-text-primary font-medium"
                                : "text-text-secondary group-hover:text-text-primary")
                            }
                          >
                            {cat}
                          </span>
                          {cat === "Pantyhose" && (
                            <span className="ml-auto text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">
                              Best
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Brands</h3>
          {selectedBrands.size > 0 && (
            <span className="text-[11px] text-primary font-medium">
              {selectedBrands.size} selected
            </span>
          )}
        </div>
        <div className="border border-border-light rounded-lg p-3 space-y-1.5 max-h-56 overflow-y-auto">
          {brands.length === 0 ? (
            <p className="text-xs text-text-muted italic py-2 text-center">
              Brand filters coming soon
            </p>
          ) : (
            brands.map((b) => {
              const checked = selectedBrands.has(b.id);
              return (
                <label
                  key={b.id}
                  className="flex items-center gap-2.5 py-1 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBrand(b.id)}
                    className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary accent-primary"
                  />
                  <span
                    className={
                      "text-sm transition-colors " +
                      (checked
                        ? "text-text-primary font-medium"
                        : "text-text-secondary group-hover:text-text-primary")
                    }
                  >
                    {b.name}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Price Range (₦)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-md border border-border-light bg-surface p-2 text-sm"
          />
          <span className="text-text-muted">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-md border border-border-light bg-surface p-2 text-sm"
          />
        </div>
      </div>

      {/* Active Filter Pills (mobile friendly summary) */}
      {hasActiveFilters && (
        <div className="space-y-2 md:hidden">
          <p className="text-xs font-medium text-text-secondary">
            Active filters
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selectedCategories).map((c) => (
              <button
                key={`cat-${c}`}
                onClick={() => toggleCategory(c)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-primary/15 text-primary border border-primary/20"
              >
                {c}
                <X className="h-3 w-3" />
              </button>
            ))}
            {brands
              .filter((b) => selectedBrands.has(b.id))
              .map((b) => (
                <button
                  key={`brand-${b.id}`}
                  onClick={() => toggleBrand(b.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-primary/15 text-primary border border-primary/20"
                >
                  {b.name}
                  <X className="h-3 w-3" />
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Apply / Clear buttons (mobile) */}
      <div className="flex gap-2 md:hidden pt-2">
        <Button variant="outline" className="flex-1" onClick={clearAll}>
          Reset
        </Button>
        <Button className="flex-1" onClick={applyFilters}>
          Show {totalItems > 0 ? `(${totalItems})` : ""} Results
        </Button>
      </div>
    </div>
  );
}

export function ProductFilters({
  categoryName,
  totalItems,
  activeCategory,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);

  // --- Local UI state for checkboxes/inputs (applied on click / blur) ---
  const initialCats = useMemo(() => {
    const raw = searchParams.get("categories");
    return new Set(
      raw
        ? raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    );
  }, [searchParams]);

  const initialBrands = useMemo(() => {
    const raw = searchParams.get("brands");
    return new Set(
      raw
        ? raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    );
  }, [searchParams]);

  const [selectedCategories, setSelectedCategories] =
    useState<Set<string>>(initialCats);
  const [selectedBrands, setSelectedBrands] =
    useState<Set<string>>(initialBrands);
  const [minPrice, setMinPrice] = useState<string>(
    searchParams.get("minPrice") ?? ""
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    searchParams.get("maxPrice") ?? ""
  );
  const [sort, setSort] = useState<string>(
    searchParams.get("sort") ?? "newest"
  );

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    Audience: false,
    "Product Type": true,
    "Shoe Styles": true,
    "Style / Occasion": false,
    Niche: false,
  });

  // Sync local state when URL changes (e.g. user clicks browser back)
  useEffect(() => {
    setSelectedCategories(initialCats);
  }, [initialCats]);
  useEffect(() => {
    setSelectedBrands(initialBrands);
  }, [initialBrands]);

  // Fetch brands
  useEffect(() => {
    let cancelled = false;
    const fetchBrands = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("brands")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .order("name", { ascending: true });
        if (!cancelled && data) setBrands(data as Brand[]);
      } catch (e) {
        // brands table may not exist yet — silent
      }
    };
    void fetchBrands();
    return () => {
      cancelled = true;
    };
  }, []);

  const buildUrl = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("categories");
    params.delete("brands");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("sort");
    // Remove legacy "type=shoes" too to avoid confusion
    params.delete("type");

    if (selectedCategories.size > 0) {
      params.set(
        "categories",
        Array.from(selectedCategories).sort().join(",")
      );
    }
    if (selectedBrands.size > 0) {
      params.set("brands", Array.from(selectedBrands).sort().join(","));
    }
    if (minPrice.trim() !== "") params.set("minPrice", minPrice.trim());
    if (maxPrice.trim() !== "") params.set("maxPrice", maxPrice.trim());
    if (sort && sort !== "newest") params.set("sort", sort);

    const qs = params.toString();
    return `/shop/${activeCategory}${qs ? `?${qs}` : ""}`;
  };

  const applyFilters = () => {
    const url = buildUrl();
    setIsOpen(false);
    router.push(url);
    router.refresh();
  };

  // Instant apply for sort (no need to click button)
  useEffect(() => {
    const current = searchParams.get("sort") ?? "newest";
    if (sort !== current) {
      router.push(buildUrl());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // Instant apply for price range with slight debounce is complex; keep
  // manual-apply for price and checkboxes on mobile, instant on desktop.

  const toggleCategory = (c: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
    // On desktop, apply instantly (not in mobile sheet)
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      queueMicrotask(() => {
        const next = new Set(selectedCategories);
        if (next.has(c)) next.delete(c);
        else next.add(c);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("categories");
        params.delete("type");
        if (next.size > 0)
          params.set("categories", Array.from(next).sort().join(","));
        const qs = params.toString();
        router.push(`/shop/${activeCategory}${qs ? `?${qs}` : ""}`);
      });
    }
  };

  const toggleBrand = (id: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      queueMicrotask(() => {
        const next = new Set(selectedBrands);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("brands");
        if (next.size > 0)
          params.set("brands", Array.from(next).sort().join(","));
        const qs = params.toString();
        router.push(`/shop/${activeCategory}${qs ? `?${qs}` : ""}`);
      });
    }
  };

  // Desktop: apply price on blur
  const applyPriceOnBlur = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    if (minPrice.trim()) params.set("minPrice", minPrice.trim());
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
    const qs = params.toString();
    router.push(`/shop/${activeCategory}${qs ? `?${qs}` : ""}`);
    router.refresh();
  };

  const clearAll = () => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    const params = new URLSearchParams();
    // preserve page if present? no — reset to page 1
    const qs = params.toString();
    setIsOpen(false);
    router.push(`/shop/${activeCategory}${qs ? `?${qs}` : ""}`);
    router.refresh();
  };

  const toggleSection = (k: string) => {
    setExpandedSections((prev) => ({ ...prev, [k]: !(prev[k] ?? true) }));
  };

  const filterContentProps: FilterContentProps = {
    categoryName,
    totalItems,
    activeCategory,
    selectedCategories,
    selectedBrands,
    minPrice,
    maxPrice,
    sort,
    brands,
    toggleCategory,
    toggleBrand,
    setMinPrice,
    setMaxPrice,
    setSort,
    clearAll,
    applyFilters,
    expandedSections,
    toggleSection,
  };

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-border-light hover:bg-surface/80 transition-all"
            onClick={() => setIsOpen(true)}
          >
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters & Sort</span>
            {(selectedCategories.size > 0 ||
              selectedBrands.size > 0 ||
              minPrice ||
              maxPrice) && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-medium">
                {selectedCategories.size +
                  selectedBrands.size +
                  (minPrice || maxPrice ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Sheet */}
      <MobileFilterSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <FilterContent {...filterContentProps} />
      </MobileFilterSheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 flex-shrink-0 space-y-8 sticky top-24 h-fit bg-background z-10">
        <div
          onBlur={(e) => {
            const target = e.target as HTMLInputElement;
            if (
              target.tagName === "INPUT" &&
              (target.placeholder === "Min" || target.placeholder === "Max")
            ) {
              applyPriceOnBlur();
            }
          }}
        >
          <FilterContent {...filterContentProps} />
        </div>
      </aside>
    </>
  );
}
