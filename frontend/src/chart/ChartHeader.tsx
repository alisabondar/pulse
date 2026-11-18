import { format, parseISO } from "date-fns";
import { CalendarClock, Pencil, TriangleAlert } from "lucide-react";
import { Link } from "react-router";

import type { components } from "@/api/schema";
import { usePermission } from "@/auth/context";
import { initials } from "@/auth/roles";
import { Button } from "@/components/ui/button";
import { formatDob } from "@/lib/format";
import { type Visit, VISIT_STATUS } from "@/home/useTodayVisits";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/patients/StatusPill";

import { useChartAllergies } from "./chartData";

type Patient = components["schemas"]["PatientDetail"];

const SEX: Record<string, string> = {
  female: "Female",
  male: "Male",
  nonbinary: "Nonbinary",
  other: "Other",
};

/**
 * The patient banner: who this is, at a glance, and any severe allergy. It stays above every
 * tab, so identity and allergy never scroll out of sight.
 */
export function ChartHeader({
  patient,
  showAllergies,
  visit,
}: {
  patient: Patient;
  showAllergies: boolean;
  /** Today's visit for this patient, when there is one. */
  visit?: Visit | undefined;
}) {
  const allergies = useChartAllergies(patient.id, showAllergies);
  const canEdit = usePermission("EDIT_DEMOGRAPHICS");
  const severe = (allergies.data?.items ?? []).filter(
    (a) => a.status === "active" && a.severity === "severe",
  );
  const facts: [string, string][] = [
    ["Age", `${patient.age}${patient.gender ? ` · ${SEX[patient.gender] ?? "Unknown"}` : ""}`],
    ["DOB", formatDob(patient.dob)],
    ["MRN", patient.mrn],
    ...(patient.blood_type ? [["Blood", patient.blood_type] as [string, string]] : []),
  ];
  return (
    <section aria-label="Patient" className="@container rounded-[28px] bg-card px-6 py-5">
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 @3xl:grid-cols-[auto_1fr_auto]">
        <span
          aria-hidden
          className="grid size-16 place-items-center rounded-full bg-secondary text-[20px] font-semibold text-secondary-foreground"
        >
          {initials(`${patient.first_name} ${patient.last_name}`)}
        </span>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">
              {patient.last_name}, {patient.first_name}
            </h1>
            {patient.status !== "active" && <StatusPill status={patient.status} />}
            {patient.archived && (
              <span className="rounded-lg bg-muted px-2 py-0.5 text-[12px] font-medium">
                Archived
              </span>
            )}
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[14px] tabular-nums">
            {facts.map(([label, value]) => (
              <div key={label} className="flex gap-1.5">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {visit && (
            <p className="flex flex-wrap items-center gap-2 text-[14px]">
              <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
              <span className="font-medium tabular-nums">
                Today {format(parseISO(visit.scheduled_at), "h:mm a")}
              </span>
              {visit.reason && <span className="text-muted-foreground">· {visit.reason}</span>}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[12px] font-medium",
                  VISIT_STATUS[visit.status].style,
                )}
              >
                {VISIT_STATUS[visit.status].label}
              </span>
            </p>
          )}
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 @3xl:col-span-1 @3xl:justify-end">
          {severe.length > 0 && (
            <p
              role="alert"
              aria-label="Severe allergies"
              className="flex items-center gap-2 rounded-lg bg-severe/10 px-3 py-2 text-[14px] font-medium text-severe"
            >
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              Severe allergy: {severe.map((a) => a.substance).join(", ")}
            </p>
          )}
          {canEdit && (
            <Button asChild variant="outline">
              <Link to={`/patients/${patient.id}/edit`}>
                <Pencil aria-hidden />
                Edit details
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
