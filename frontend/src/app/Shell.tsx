import { ContentSkeleton } from "@/components/PageSkeleton";
import { Toaster } from "@/components/ui/sonner";
import { CalendarDays, LoaderCircle, ScrollText, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Suspense } from "react";
import { Link, Outlet, useLocation } from "react-router";

import { type Permission, useCurrentUser } from "@/auth/context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { GlobalSearch } from "./GlobalSearch";
import { UserMenu } from "./UserMenu";

/**
 * Each section owns its paths ("Patients" covers the list and charts, not registration) and is
 * shown only to roles with its permission.
 */
const NAV: {
  to: string;
  label: string;
  /** Shown while a persona switch loads this section. */
  icon: typeof Users;
  permission: Permission;
  owns: (path: string) => boolean;
}[] = [
  {
    to: "/",
    label: "My day",
    icon: CalendarDays,
    permission: "SCHEDULE_VISITS",
    owns: (path: string) => path === "/",
  },
  {
    to: "/patients",
    label: "Patients",
    icon: Users,
    permission: "VIEW_DEMOGRAPHICS",
    owns: (path: string) =>
      path === "/patients" || (path.startsWith("/patients/") && !path.startsWith("/patients/new")),
  },
  {
    to: "/patients/new",
    label: "New patient",
    icon: UserPlus,
    permission: "CREATE_PATIENT",
    owns: (path: string) => path.startsWith("/patients/new"),
  },
  {
    to: "/admin/audit",
    label: "Admin",
    icon: ScrollText,
    permission: "VIEW_AUDIT_LOG",
    owns: (path: string) => path.startsWith("/admin"),
  },
];

export function Shell() {
  const { pathname } = useLocation();
  const path = pathname.replace(/(.)\/+$/, "$1");
  const { me, switchingTo } = useCurrentUser();
  const sections = NAV.filter((item) => me.permissions.includes(item.permission));
  return (
    <TooltipProvider delayDuration={300}>
      {/* Bottom centre, M3's snackbar spot, so toasts never sit under the chart's New note button. */}
      <Toaster position="bottom-center" />
      <div className="flex min-h-svh">
        <NavigationRail sections={sections} path={path} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-background px-6 lg:px-8">
            {/* The Patients page has its own, fuller search; one search box per screen. */}
            {me.permissions.includes("VIEW_DEMOGRAPHICS") &&
            !switchingTo &&
            path !== "/patients" ? (
              <GlobalSearch />
            ) : (
              <div className="flex-1" />
            )}
            <UserMenu />
          </header>
          <main className="mx-auto w-full max-w-7xl px-6 pb-24 lg:px-8">
            {switchingTo ? (
              <SwitchingPersona personaName={switchingTo.name} />
            ) : (
              <Suspense fallback={<PageLoading />}>
                <Outlet />
              </Suspense>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * An M3 navigation rail with icons only, so the chart keeps the width on an iPad. Each icon
 * still has its name: a tooltip on hover or focus, and text a screen reader announces.
 */
function NavigationRail({ sections, path }: { sections: typeof NAV; path: string }) {
  return (
    <aside className="sticky top-0 flex h-svh w-20 shrink-0 flex-col items-center gap-6 bg-rail py-5">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <ShieldCheck className="size-6" aria-hidden />
        <span className="sr-only">CipherChart</span>
      </span>
      <nav aria-label="Main">
        <ul className="flex flex-col items-center gap-3">
          {sections.map(({ to, label, icon: Icon, owns }) => {
            const active = owns(path);
            return (
              <li key={to}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "grid h-12 w-14 place-items-center rounded-full text-muted-foreground transition-colors",
                        "hover:bg-foreground/8 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        active &&
                          "bg-rail-indicator text-rail-indicator-foreground hover:bg-rail-indicator",
                      )}
                    >
                      <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                      <span className="sr-only">{label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {label}
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

/** Stands in for the page while a persona switch loads, so nothing from the last one shows. */
function SwitchingPersona({ personaName }: { personaName: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex flex-col items-center justify-center gap-3 py-24 text-center duration-300 animate-in fade-in"
    >
      <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-[15px] font-medium">
        Loading your view <span className="text-muted-foreground">as {personaName}</span>
      </p>
    </div>
  );
}

/** While a page's code downloads on first visit: the page's shape, not a spinner. */
function PageLoading() {
  return (
    <div role="status" aria-label="Loading page">
      <ContentSkeleton />
    </div>
  );
}
