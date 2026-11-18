import { format, parseISO } from "date-fns";

import type { components } from "@/api/schema";
import { cn } from "@/lib/utils";

import { isAbnormal } from "./vitalsFormat";

type Vitals = components["schemas"]["VitalsOut"];

const MAX_POINTS = 8;
// The systolic reading the Vitals tab flags as high, drawn as a reference line.
const HIGH_SYSTOLIC = 140;
const W = 420;
const H = 150;
const PAD = { left: 34, right: 12, top: 12, bottom: 24 };

/**
 * The latest blood pressure, large, and the last few readings as a trend: systolic and
 * diastolic lines against the 140 systolic line the Vitals tab flags at.
 */
export function BpTrend({ readings }: { readings: Vitals[] }) {
  const points = readings
    .filter((v) => v.bp_systolic !== null && v.bp_diastolic !== null)
    .sort((a, b) => a.taken_at.localeCompare(b.taken_at))
    .slice(-MAX_POINTS);
  const latest = points.at(-1);
  if (!latest) {
    return <p className="text-[14px] text-muted-foreground">No blood pressure recorded yet</p>;
  }
  const high =
    isAbnormal("bp_systolic", latest.bp_systolic) ||
    isAbnormal("bp_diastolic", latest.bp_diastolic);
  const values = points.flatMap((p) => [p.bp_systolic!, p.bp_diastolic!]);
  const lo = Math.floor((Math.min(...values, HIGH_SYSTOLIC) - 10) / 10) * 10;
  const hi = Math.ceil((Math.max(...values, HIGH_SYSTOLIC) + 10) / 10) * 10;
  // Spaced by date, so a gap of a year looks like a year.
  const times = points.map((p) => parseISO(p.taken_at).getTime());
  const t0 = times[0] ?? 0;
  const span = (times.at(-1) ?? t0) - t0 || 1;
  const x = (i: number) => PAD.left + (((times[i] ?? t0) - t0) / span) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const line = (key: "bp_systolic" | "bp_diastolic") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[key]!).toFixed(1)}`).join(" ");
  const ticks = [lo, Math.round((lo + hi) / 20) * 10, hi];
  const sameYear = points.every((p) => p.taken_at.slice(0, 4) === latest.taken_at.slice(0, 4));
  const label = (iso: string) => format(parseISO(iso), sameYear ? "MMM d" : "MMM ’yy");
  const last = points.length - 1;

  return (
    <div className="space-y-2">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span
          className={cn(
            "text-[32px] leading-none font-semibold tabular-nums",
            high && "text-severe",
          )}
        >
          {latest.bp_systolic}
          <span className="text-muted-foreground">/{latest.bp_diastolic}</span>
        </span>
        <span className="text-[13px] text-muted-foreground">
          mmHg · {format(parseISO(latest.taken_at), "MMM d, yyyy")}
        </span>
        {high && (
          <span className="rounded-md bg-severe/10 px-1.5 text-[12px] font-medium text-severe">
            High
          </span>
        )}
      </p>
      {points.length === 1 ? (
        <p className="text-[13px] text-muted-foreground">
          The trend appears after the next reading.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={`Blood pressure, last ${points.length} readings: ${points
            .map((p) => `${p.bp_systolic}/${p.bp_diastolic}`)
            .join(", ")}`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                className="stroke-border"
              />
              <text
                x={PAD.left - 8}
                y={y(t) + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[11px]"
              >
                {t}
              </text>
            </g>
          ))}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(HIGH_SYSTOLIC)}
            y2={y(HIGH_SYSTOLIC)}
            strokeDasharray="4 4"
            className="stroke-severe/60"
          />
          <text
            x={W - PAD.right}
            y={y(HIGH_SYSTOLIC) - 5}
            textAnchor="end"
            className="fill-severe text-[11px]"
          >
            High · {HIGH_SYSTOLIC}
          </text>
          <path
            d={line("bp_systolic")}
            fill="none"
            strokeWidth={2.5}
            strokeLinejoin="round"
            className="stroke-primary"
          />
          <path
            d={line("bp_diastolic")}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            className="stroke-primary/45"
          />
          {points.map((p, i) => (
            <g key={p.id}>
              <circle
                cx={x(i)}
                cy={y(p.bp_systolic!)}
                r={i === last ? 4.5 : 3}
                className="fill-primary"
              />
              <circle
                cx={x(i)}
                cy={y(p.bp_diastolic!)}
                r={i === last ? 4 : 2.5}
                className="fill-primary/45"
              />
              {(i === 0 || i === last || points.length <= 5) && (
                <text
                  x={x(i)}
                  y={H - 6}
                  textAnchor={
                    points.length === 1
                      ? "middle"
                      : i === 0
                        ? "start"
                        : i === last
                          ? "end"
                          : "middle"
                  }
                  className="fill-muted-foreground text-[11px]"
                >
                  {label(p.taken_at)}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
      {points.length > 1 && (
        <p className="flex gap-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-primary" aria-hidden /> Systolic
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-primary/45" aria-hidden /> Diastolic
          </span>
        </p>
      )}
    </div>
  );
}
