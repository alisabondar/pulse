import { PenLine } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";

import { api } from "@/api";
import { queryKeys, useApiQuery } from "@/api/queries";
import { useCurrentUser, usePermission } from "@/auth/context";
import { hasCareTeam } from "@/auth/roles";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ComponentProps } from "react";
import { type Visit, useTodayVisits } from "@/home/useTodayVisits";
import { ListError } from "@/patients/ListStates";

import { AccessHistoryTab } from "./AccessHistoryTab";
import { AllergiesConditionsTab } from "./AllergiesConditionsTab";
import { ChartHeader } from "./ChartHeader";
import { ContactTab } from "./ContactTab";
import { NotesTab } from "./NotesTab";
import { OverviewTab } from "./OverviewTab";
import { TodayStrip } from "./TodayStrip";
import { VitalsTab } from "./VitalsTab";

/**
 * The Today strip stays put while the chart below it changes, and each chart starts fresh
 * (on its first tab, with nothing half-typed) because it is keyed by patient.
 */
export function PatientChart() {
  const { patientId = "" } = useParams();
  const { me } = useCurrentUser();
  const worksVisits = usePermission("SCHEDULE_VISITS");
  const today = useTodayVisits(hasCareTeam(me.role) ? "my" : "all", { enabled: worksVisits });
  const visits = today.data?.items ?? [];
  const visit = visits.find((v) => v.patient.id === patientId);
  return (
    <div className="space-y-4">
      {worksVisits && <TodayStrip visits={visits} currentId={patientId} />}
      <Chart key={patientId} patientId={patientId} visit={visit} />
    </div>
  );
}

function Chart({ patientId, visit }: { patientId: string; visit: Visit | undefined }) {
  const clinical = usePermission("VIEW_CLINICAL");
  const canSeeAccess = usePermission("VIEW_PATIENT_ACCESS_LOG");
  const canWriteNotes = usePermission("WRITE_NOTES_AND_VITALS");
  // Front desk has no clinical overview, so their chart opens on Contact.
  const [tab, setTab] = useState(clinical ? "overview" : "contact");
  // Set by the New note button, read once by the Notes tab as it opens.
  const [composeOnOpen, setComposeOnOpen] = useState(false);
  const detail = useApiQuery(queryKeys.patients.detail(patientId), (signal) =>
    api.GET("/api/v1/patients/{patient_id}", {
      params: { path: { patient_id: patientId } },
      signal,
    }),
  );

  if (detail.error) {
    return (
      <ListError error={detail.error} what="this chart" onRetry={() => void detail.refetch()} />
    );
  }
  if (!detail.data) {
    return (
      <div role="status" aria-label="Loading chart" className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  const patient = detail.data;

  return (
    <div className="space-y-5">
      <ChartHeader patient={patient} showAllergies={clinical} visit={visit} />
      <Tabs
        value={tab}
        onValueChange={(next) => {
          setComposeOnOpen(false);
          setTab(next);
        }}
      >
        <TabsList
          variant="line"
          className="w-full justify-start gap-2 border-b group-data-horizontal/tabs:h-12"
        >
          {clinical && <ChartTab value="overview">Overview</ChartTab>}
          <ChartTab value="contact">Contact</ChartTab>
          {clinical && <ChartTab value="notes">Notes</ChartTab>}
          {clinical && <ChartTab value="vitals">Vitals</ChartTab>}
          {clinical && <ChartTab value="allergies">Allergies & conditions</ChartTab>}
          {canSeeAccess && <ChartTab value="access">Access history</ChartTab>}
        </TabsList>
        {clinical && (
          <TabsContent value="overview" className="pt-5">
            <OverviewTab
              patientId={patient.id}
              onOpenTab={(next) => {
                setComposeOnOpen(false);
                setTab(next);
              }}
            />
          </TabsContent>
        )}
        <TabsContent value="contact" className="pt-4">
          <ContactTab patient={patient} />
        </TabsContent>
        {clinical && (
          <>
            <TabsContent value="notes" className="pt-4">
              <NotesTab patientId={patient.id} startComposing={composeOnOpen} />
            </TabsContent>
            <TabsContent value="vitals" className="pt-4">
              <VitalsTab patientId={patient.id} />
            </TabsContent>
            <TabsContent value="allergies" className="pt-4">
              <AllergiesConditionsTab patientId={patient.id} />
            </TabsContent>
          </>
        )}
        {canSeeAccess && (
          <TabsContent value="access" className="pt-4">
            <AccessHistoryTab patientId={patient.id} />
          </TabsContent>
        )}
      </Tabs>
      {canWriteNotes && clinical && tab !== "notes" && (
        // M3 extended FAB: the most common action on a chart, in thumb reach on an iPad.
        <button
          type="button"
          onClick={() => {
            setComposeOnOpen(true);
            setTab("notes");
          }}
          className="fixed right-8 bottom-8 z-30 inline-flex h-14 items-center gap-3 rounded-2xl bg-fab px-5 text-[15px] font-medium text-fab-foreground shadow-[0_4px_8px_3px_rgb(0_0_0/0.15),0_1px_3px_rgb(0_0_0/0.3)] transition-shadow hover:shadow-[0_6px_10px_4px_rgb(0_0_0/0.15),0_2px_3px_rgb(0_0_0/0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <PenLine className="size-5" aria-hidden />
          New note
        </button>
      )}
    </div>
  );
}

/** An M3 primary tab: the selected one in the primary colour over a rounded indicator. */
function ChartTab(props: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      {...props}
      className="h-12 flex-none px-4 text-[14px] font-medium text-muted-foreground after:rounded-t-full after:bg-primary group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-[3px] data-[state=active]:text-primary"
    />
  );
}
