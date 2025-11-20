import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-muted/50 mb-2" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted/50" />
      </div>
      <DashboardSkeleton />
    </div>
  );
}
