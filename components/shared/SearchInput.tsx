"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  className?: string;
  placeholder?: string;
  onSearch?: () => void;
  autoFocus?: boolean;
}

export function SearchInput({ className, placeholder = "Search products...", onSearch, autoFocus }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Initialize from URL param directly instead of using effect
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop/all?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/shop/all`);
    }
    if (onSearch) onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10 h-10 bg-background border-transparent focus:bg-surface w-full"
        autoFocus={autoFocus}
      />
    </form>
  );
}
