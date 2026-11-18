import { format, parseISO } from "date-fns";
import { useEffect, useRef } from "react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";
import { type Visit } from "@/home/useTodayVisits";

const DOT: Record<Visit["status"], string> = {
  scheduled: "bg-muted-foreground/50",
  checked_in: "bg-primary",
  completed: "bg-status-active",
  no_show: "bg-status-inactive",
  cancelled: "bg-muted-foreground/30",
};
const LABEL: Record<Visit["status"], string> = {
  scheduled: "scheduled",
  checked_in: "checked in",
  completed: "completed",
  no_show: "no-show",
  cancelled: "cancelled",
};

/**
 * Today's visits as a row of chips above the chart, so moving to the next patient is one tap
 * and never a trip back to My day. The open chart's visit is selected.
 */
export function TodayStrip({ visits, currentId }: { visits: Visit[]; currentId: string }) {
  const strip = useRef<HTMLElement>(null);
  // On a narrow screen the strip scrolls; bring the open chart's chip into view.
  useEffect(() => {
    strip.current
      ?.querySelector<HTMLElement>("[aria-current='page']")
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [currentId, visits.length]);
  if (visits.length === 0) return null;
  return (
    <nav ref={strip} aria-label="Today's visits" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex w-max gap-2">
        {visits.map((visit) => {
          const current = visit.patient.id === currentId;
          return (
            <li key={visit.id}>
              <Link
                to={`/patients/${visit.patient.id}`}
                aria-current={current ? "page" : undefined}
                aria-label={`${format(parseISO(visit.scheduled_at), "h:mm a")}, ${visit.patient.last_name}, ${visit.patient.first_name}, ${LABEL[visit.status]}`}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-[13px] whitespace-nowrap transition-colors",
                  "hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  current && "border-transparent bg-secondary text-secondary-foreground",
                  (visit.status === "completed" || visit.status === "cancelled") &&
                    !current &&
                    "text-muted-foreground",
                )}
              >
                <span
                  className={cn("size-2 shrink-0 rounded-full", DOT[visit.status])}
                  aria-hidden
                />
                <span className="font-medium tabular-nums">
                  {format(parseISO(visit.scheduled_at), "h:mm")}
                </span>
                <span className={cn(current && "font-semibold")}>{visit.patient.last_name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
