"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { MobileFilterSheet } from "@/components/customer/MobileFilterSheet";

interface ProductFiltersProps {
  categoryName: string;
  totalItems: number;
  activeCategory: string;
  activeType?: string;
}

// Move FilterContent outside to avoid creating component during render
function FilterContent({
  categoryName,
  totalItems,
  activeCategory,
  isShoesFilter
}: {
  categoryName: string;
  totalItems: number;
  activeCategory: string;
  isShoesFilter: boolean;
}) {
  return (
    <>
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
        <p className="text-text-secondary">{totalItems} products found</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Category</h3>
        <div className="flex flex-col gap-2">
          <a
            href={`/shop/${activeCategory}`}
            className={`text-sm ${
              !isShoesFilter
                ? "font-bold text-primary"
                : "text-text-secondary hover:text-primary"
            }`}
          >
            All {categoryName}
          </a>
          <a
            href={`/shop/${activeCategory}?type=shoes`}
            className={`text-sm ${
              isShoesFilter
                ? "font-bold text-primary"
                : "text-text-secondary hover:text-primary"
            }`}
          >
            Shoes
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Sort By</h3>
        <select className="w-full rounded-md border border-border-light bg-surface p-2 text-sm">
          <option>Newest Arrivals</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-full rounded-md border border-border-light bg-surface p-2 text-sm"
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            className="w-full rounded-md border border-border-light bg-surface p-2 text-sm"
          />
        </div>
      </div>
    </>
  );
}

export function ProductFilters({
  categoryName,
  totalItems,
  activeCategory,
  activeType,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isShoesFilter = activeType === "shoes";

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
          </Button>
        </div>
      </div>

      {/* Mobile Sheet */}
      <MobileFilterSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <FilterContent
          categoryName={categoryName}
          totalItems={totalItems}
          activeCategory={activeCategory}
          isShoesFilter={isShoesFilter}
        />
      </MobileFilterSheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 space-y-8 sticky top-24 h-fit bg-background z-10">
        <FilterContent
          categoryName={categoryName}
          totalItems={totalItems}
          activeCategory={activeCategory}
          isShoesFilter={isShoesFilter}
        />
      </aside>
    </>
  );
}
