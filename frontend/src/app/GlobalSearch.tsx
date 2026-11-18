import { ArrowRight, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { api } from "@/api";
import { queryKeys, useApiQuery } from "@/api/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDob } from "@/lib/format";
import { cn } from "@/lib/utils";
import { searchHandoff } from "@/patients/searchHandoff";
import { parseSearch } from "@/patients/searchTerms";
import { StatusPill } from "@/patients/StatusPill";
import { DEFAULT_LIST_PARAMS } from "@/patients/usePatientListParams";

const DEBOUNCE_MS = 250;
const RESULTS = 6;
// Everyone's patients: the app bar is for jumping to any chart the role may open.
const PARAMS = { ...DEFAULT_LIST_PARAMS, scope: "all" as const, page_size: RESULTS };

/**
 * The app bar's patient search: type a last name or MRN, pick a result, land on the chart.
 * A combobox, so arrow keys, Enter and Escape work, and "/" focuses it from anywhere.
 * What's typed stays in memory: never in the URL, which is how the rest of the app treats it.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const debounced = useDebouncedValue(text, text ? DEBOUNCE_MS : 0);
  const { hint } = parseSearch(text, "");
  const { terms } = useMemo(() => parseSearch(debounced, ""), [debounced]);
  const results = useApiQuery(
    terms ? queryKeys.patients.search(PARAMS, terms) : ["patients", "search", "idle"],
    (signal) =>
      api.POST("/api/v1/patients/search", { params: { query: PARAMS }, body: terms!, signal }),
    { enabled: open && terms !== null, keepPrevious: true },
  );
  const items = terms && results.data ? results.data.items : [];
  const total = terms && results.data ? results.data.total : 0;
  // Rows: each patient, then "See all results" when there are more than fit.
  const showAll = total > items.length;
  const rows = items.length + (showAll ? 1 : 0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = () => {
    setOpen(false);
    setActive(0);
  };
  const openChart = (id: string) => {
    close();
    setText("");
    input.current?.blur();
    void navigate(`/patients/${id}`);
  };
  const seeAll = () => {
    searchHandoff.set(text);
    close();
    setText("");
    input.current?.blur();
    void navigate("/patients");
  };
  const choose = (index: number) => {
    const item = items[index];
    if (item) openChart(item.id);
    else if (showAll) seeAll();
  };

  const status = !text.trim()
    ? null
    : hint
      ? hint
      : results.isFetching && items.length === 0
        ? "Searching…"
        : terms && results.data && items.length === 0
          ? "No patients found"
          : null;

  return (
    <div
      className="relative w-full min-w-0 max-w-xl flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        ref={input}
        type="text"
        role="combobox"
        aria-label="Find a patient"
        aria-expanded={open && text.trim() !== ""}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && rows > 0 ? `${listId}-${active}` : undefined}
        placeholder="Find a patient by last name or MRN"
        autoComplete="off"
        spellCheck={false}
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setText(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && rows > 0) {
            event.preventDefault();
            setActive((i) => (i + 1) % rows);
          } else if (event.key === "ArrowUp" && rows > 0) {
            event.preventDefault();
            setActive((i) => (i - 1 + rows) % rows);
          } else if (event.key === "Enter" && rows > 0) {
            event.preventDefault();
            choose(active);
          } else if (event.key === "Escape") {
            if (text) setText("");
            else input.current?.blur();
            close();
          }
        }}
        className="h-12 w-full rounded-full bg-muted pr-12 pl-12 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      {text ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            input.current?.focus();
          }}
          className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-foreground/8"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : (
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rounded-md border border-border px-1.5 text-[12px] text-muted-foreground"
        >
          /
        </kbd>
      )}

      {open && text.trim() !== "" && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-3xl bg-popover py-2 shadow-[0_4px_8px_3px_rgb(0_0_0/0.12),0_1px_3px_rgb(0_0_0/0.2)]">
          {status && (
            <p
              role="status"
              className="flex items-center gap-2 px-5 py-3 text-[14px] text-muted-foreground"
            >
              {status === "Searching…" && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              {status}
            </p>
          )}
          <ul id={listId} role="listbox" aria-label="Patients">
            {items.map((p, i) => (
              <li
                key={p.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => openChart(p.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-5 py-2.5",
                  active === i && "bg-secondary text-secondary-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-[13px] font-semibold text-secondary-foreground"
                >
                  {(p.first_name[0] ?? "") + (p.last_name[0] ?? "")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">
                    {p.last_name}, {p.first_name}
                  </span>
                  <span className="block text-[13px] text-muted-foreground tabular-nums">
                    {formatDob(p.dob)} ({p.age}y) · {p.mrn}
                  </span>
                </span>
                {p.status !== "active" && <StatusPill status={p.status} />}
              </li>
            ))}
            {showAll && (
              <li
                id={`${listId}-${items.length}`}
                role="option"
                aria-selected={active === items.length}
                onMouseEnter={() => setActive(items.length)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={seeAll}
                className={cn(
                  "mt-1 flex cursor-pointer items-center justify-between border-t border-border px-5 py-3 text-[14px] font-medium text-primary",
                  active === items.length && "bg-secondary",
                )}
              >
                See all {total.toLocaleString()} results in Patients
                <ArrowRight className="size-4" aria-hidden />
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
