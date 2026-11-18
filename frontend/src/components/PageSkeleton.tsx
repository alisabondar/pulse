import { Skeleton } from "@/components/ui/skeleton";

/** The page area while it loads: a title, the summary cards, and a list, like the real pages. */
export function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} data-testid="card-skeleton" className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** The whole app while it starts: the navigation rail, the app bar, and the page. */
export function AppSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading the dashboard"
      aria-busy="true"
      className="flex min-h-screen bg-background"
    >
      <div
        data-testid="rail-skeleton"
        className="flex w-20 shrink-0 flex-col items-center gap-6 bg-rail py-5"
      >
        <Skeleton className="size-12 rounded-2xl" />
        <div className="flex flex-col items-center gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-14 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div data-testid="header-skeleton" className="flex h-20 items-center gap-4 px-6 lg:px-8">
          <Skeleton className="h-12 w-full max-w-xl rounded-full" />
          <Skeleton className="ml-auto size-8 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-40 shrink-0" />
        </div>
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <ContentSkeleton />
        </div>
      </div>
    </div>
  );
}
