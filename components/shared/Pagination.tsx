
"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const searchParams = useSearchParams();

  // Helper to preserve existing search params (like type=shoes)
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link href={createPageUrl(currentPage - 1)}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" disabled>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          // Show first, last, current, and neighbors
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <Link key={page} href={createPageUrl(page)}>
                <Button
                  variant={currentPage === page ? "primary" : "ghost"}
                  size="sm"
                  className={`w-9 h-9 ${currentPage === page ? "pointer-events-none" : ""}`}
                >
                  {page}
                </Button>
              </Link>
            );
          }

          // Show ellipsis
          if (
            page === currentPage - 2 ||
            page === currentPage + 2
          ) {
            return (
              <span key={page} className="text-text-muted px-1">
                ...
              </span>
            );
          }

          return null;
        })}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link href={createPageUrl(currentPage + 1)}>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" disabled>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
