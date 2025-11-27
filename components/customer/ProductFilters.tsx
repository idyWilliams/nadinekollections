"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileFilterSheet } from "@/components/customer/MobileFilterSheet";

interface ProductFiltersProps {
  categoryName: string;
  totalItems: number;
  activeCategory: string;
  activeType?: string;
}

export function ProductFilters({
  categoryName,
  totalItems,
  activeCategory,
  activeType,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isShoesFilter = activeType === "shoes";

  const FilterContent = () => (
    <>
      <div>
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

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-6">
        <Button
          variant="outline"
          className="w-full flex items-center justify-between"
          onClick={() => setIsOpen(true)}
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Sort
          </span>
        </Button>
      </div>

      {/* Mobile Sheet */}
      <MobileFilterSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <FilterContent />
      </MobileFilterSheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 space-y-8 sticky top-24 h-fit bg-background z-10">
        <FilterContent />
      </aside>
    </>
  );
}
