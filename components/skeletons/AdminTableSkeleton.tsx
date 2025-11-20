import { Skeleton } from "@/components/ui/skeleton";

export function AdminTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border border-border-light bg-surface">
        <div className="border-b border-border-light p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-border-light p-4 last:border-0">
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-12 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
