import { AdminTableSkeleton } from "@/components/skeletons/AdminTableSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-muted/50" />
        <div className="h-10 w-32 animate-pulse rounded bg-muted/50" />
      </div>
      <AdminTableSkeleton />
    </div>
  );
}
