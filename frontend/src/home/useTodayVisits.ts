import { format } from "date-fns";

import { api } from "@/api";
import { queryKeys, useApiQuery } from "@/api/queries";
import type { components } from "@/api/schema";
import { useNow } from "@/hooks/useNow";

type Scope = components["schemas"]["Scope"];
export type Visit = components["schemas"]["ScheduledVisitOut"];

const SCHEDULE_REFRESH_MS = 60_000;

/**
 * Today's visits for a scope. My day and the chart's Today strip share it, so opening a chart
 * from the schedule costs no extra request.
 */
export function useTodayVisits(scope: Scope, { enabled = true }: { enabled?: boolean } = {}) {
  const now = useNow();
  return useApiQuery(
    // Keyed by date, so a page left open past midnight moves on to the new day.
    queryKeys.visits.today(scope, format(now, "yyyy-MM-dd")),
    (signal) => api.GET("/api/v1/visits/today", { params: { query: { scope } }, signal }),
    // Other staff check patients in and out; keep the schedule current.
    { refetchInterval: SCHEDULE_REFRESH_MS, keepPrevious: true, enabled },
  );
}

export const VISIT_STATUS: Record<Visit["status"], { label: string; style: string }> = {
  scheduled: { label: "Scheduled", style: "bg-muted text-muted-foreground" },
  checked_in: { label: "Checked in", style: "bg-primary text-primary-foreground" },
  completed: { label: "Completed", style: "bg-status-active/12 text-status-active" },
  no_show: { label: "No-show", style: "bg-status-inactive/12 text-status-inactive" },
  cancelled: { label: "Cancelled", style: "bg-muted text-muted-foreground line-through" },
};
