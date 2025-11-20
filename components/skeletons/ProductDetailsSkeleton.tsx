import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image Skeleton */}
        <div className="aspect-square w-full overflow-hidden rounded-xl bg-surface">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Details Skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-10 w-3/4" />
          </div>
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-4 pt-6">
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
