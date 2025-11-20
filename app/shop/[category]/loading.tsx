import { ProductGridSkeleton } from "@/components/skeletons/ProductGridSkeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Skeleton */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-8">
          <div className="h-8 w-32 animate-pulse rounded bg-muted/50" />
          <div className="space-y-4">
            <div className="h-6 w-24 animate-pulse rounded bg-muted/50" />
            <div className="h-10 w-full animate-pulse rounded bg-muted/50" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="flex-1">
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
