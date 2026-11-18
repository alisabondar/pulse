import { format, parseISO } from "date-fns";
import { ArrowRight, Lock } from "lucide-react";

import type { components } from "@/api/schema";
import { Panel } from "@/components/Fields";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { BpTrend } from "./BpTrend";
import { useChartAllergies, useChartConditions, useChartNotes, useChartVitals } from "./chartData";
import { byDraftThenNewest } from "./noteOrder";
import { SummaryCard } from "./SummaryCard";
import { isAbnormal } from "./vitalsFormat";

type Vitals = components["schemas"]["VitalsOut"];
type Tab = "notes" | "vitals" | "allergies";

/**
 * The visit at a glance, on one screen: the AI summary and the latest notes on the left, the
 * blood pressure trend, latest vitals, problems and allergies on the right. Each card can open
 * its full tab.
 */
export function OverviewTab({
  patientId,
  onOpenTab,
}: {
  patientId: string;
  onOpenTab: (tab: Tab) => void;
}) {
  const allergies = useChartAllergies(patientId, true);
  const conditions = useChartConditions(patientId, true);
  const vitals = useChartVitals(patientId, true);
  const notes = useChartNotes(patientId, true);
  const active = <T extends { status: string }>(items: T[] | undefined) =>
    (items ?? []).filter((i) => i.status === "active");

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 gap-4">
        <SummaryCard patientId={patientId} />
        <Panel
          title="Recent notes"
          action={<OpenTab label="All notes" onClick={() => onOpenTab("notes")} />}
        >
          {notes.data ? (
            notes.data.items.length > 0 ? (
              <ul className="divide-y divide-border">
                {[...notes.data.items]
                  .sort(byDraftThenNewest)
                  .slice(0, 3)
                  .map((note) => (
                    <li key={note.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                      <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
                        <span className="font-medium text-foreground">{note.author_name}</span>
                        <span className="tabular-nums">
                          {format(parseISO(note.encounter_at), "MMM d, yyyy")}
                        </span>
                        {note.status === "final" ? (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="size-3" aria-hidden /> Finalized
                          </span>
                        ) : (
                          <span className="rounded-md bg-status-inactive/12 px-1.5 font-medium text-status-inactive">
                            Draft
                          </span>
                        )}
                      </p>
                      <p className="line-clamp-2 text-[15px]">{note.content}</p>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-[14px] text-muted-foreground">No notes yet</p>
            )
          ) : (
            <Skeleton className="h-24 w-full" />
          )}
        </Panel>
      </div>

      <div className="grid min-w-0 gap-4">
        <Panel
          title="Blood pressure"
          action={<OpenTab label="All vitals" onClick={() => onOpenTab("vitals")} />}
        >
          {vitals.data ? (
            <BpTrend readings={vitals.data.items} />
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
          {vitals.data && vitals.data.items.length > 0 && (
            <LatestVitals latest={latestReading(vitals.data.items)} />
          )}
        </Panel>
        <Panel
          title="Active problems"
          action={<OpenTab label="Edit" onClick={() => onOpenTab("allergies")} />}
        >
          <Items
            loading={!conditions.data}
            empty="None recorded"
            items={active(conditions.data?.items).map((c) => ({
              key: c.id,
              main: c.name,
              detail: c.icd10_code,
            }))}
          />
        </Panel>
        <Panel title="Active allergies">
          <Items
            loading={!allergies.data}
            empty="No allergies recorded"
            items={active(allergies.data?.items).map((a) => ({
              key: a.id,
              main: a.substance,
              detail: [a.reaction, a.severity].filter(Boolean).join(" · "),
              severe: a.severity === "severe",
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}

function OpenTab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="-my-1 -mr-2 text-primary">
      {label}
      <ArrowRight aria-hidden />
    </Button>
  );
}

function latestReading(items: Vitals[]): Vitals {
  return items.reduce((a, b) => (a.taken_at >= b.taken_at ? a : b));
}

/** The other vitals from the latest reading, flagged the same way the Vitals tab flags them. */
function LatestVitals({ latest }: { latest: Vitals }) {
  const cells: { label: string; value: string; unit: string; high: boolean }[] = [
    {
      label: "Heart rate",
      value: latest.heart_rate?.toString() ?? "—",
      unit: latest.heart_rate ? "bpm" : "",
      high: isAbnormal("heart_rate", latest.heart_rate),
    },
    {
      label: "Temp",
      value: latest.temperature_c ?? "—",
      unit: latest.temperature_c ? "°C" : "",
      high: isAbnormal("temperature_c", latest.temperature_c),
    },
    {
      label: "SpO₂",
      value: latest.spo2?.toString() ?? "—",
      unit: latest.spo2 ? "%" : "",
      high: isAbnormal("spo2", latest.spo2),
    },
    {
      label: "Weight",
      value: latest.weight_kg ?? "—",
      unit: latest.weight_kg ? "kg" : "",
      high: false,
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3 sm:grid-cols-4">
      {cells.map((c) => (
        <div key={c.label}>
          <dt className="text-[12px] text-muted-foreground">{c.label}</dt>
          <dd
            className={cn(
              "text-[17px] font-semibold tabular-nums",
              c.high && "text-severe",
              c.value === "—" && "font-normal text-muted-foreground",
            )}
          >
            {c.value}
            {c.unit && (
              <span className="ml-0.5 text-[12px] font-normal text-muted-foreground">{c.unit}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Items({
  items,
  empty,
  loading,
}: {
  items: { key: string; main: string; detail: string; severe?: boolean }[];
  empty: string;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-16 w-full" />;
  if (items.length === 0) return <p className="text-[14px] text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.key} className="flex items-baseline justify-between gap-3">
          <span className={cn("text-[15px] font-medium", item.severe && "text-severe")}>
            {item.main}
          </span>
          {item.detail && (
            <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
              {item.detail}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
