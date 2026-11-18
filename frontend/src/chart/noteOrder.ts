import type { components } from "@/api/schema";

type Note = components["schemas"]["NoteOut"];

/** Drafts first (they still need finishing), then the newest visit first. */
export function byDraftThenNewest(a: Note, b: Note): number {
  if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
  return b.encounter_at.localeCompare(a.encounter_at);
}
