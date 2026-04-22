import { Skeleton } from "@/components/ui/skeleton";

export function PreviewSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Skeleton className="h-11 w-full sm:w-60" />
          <Skeleton className="h-11 w-full sm:flex-1" />
        </div>
      </div>
    </div>
  );
}
