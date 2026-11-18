import type { ReactNode } from "react";

/** A section heading in the accent colour, so structure reads apart from content. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[15px] font-semibold text-brand">{children}</h2>;
}

/** Label/value pairs: small muted uppercase labels over darker, heavier values. */
export function Fields({
  items,
  wide = false,
}: {
  items: { label: string; value: ReactNode }[];
  /** Four across on wider screens, for short values like vitals. */
  wide?: boolean;
}) {
  return (
    <dl
      className={
        wide
          ? "grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4"
          : "grid gap-x-6 gap-y-3 sm:grid-cols-2"
      }
    >
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </dt>
          <dd className="mt-0.5 text-[15px] font-medium text-foreground">
            {value === null || value === undefined || value === false || value === "" ? "—" : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A titled card for one part of a page. */
export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  /** A small control beside the title, e.g. a link to the full view. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="min-w-0 space-y-3 rounded-xl bg-card p-5">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <SectionTitle>{title}</SectionTitle>
        {action}
      </div>
      {children}
    </section>
  );
}
