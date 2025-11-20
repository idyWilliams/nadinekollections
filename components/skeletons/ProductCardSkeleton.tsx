import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}
