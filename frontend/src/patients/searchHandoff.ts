/**
 * Carries what was typed in the app bar's search to the Patients page. Search text identifies
 * patients, so it travels in memory only: never in the URL or in history state, which the
 * browser may save to disk for session restore.
 */
let pending: string | null = null;

export const searchHandoff = {
  set(text: string) {
    pending = text;
  },
  /** The handed-over text, once. Cleared after this tick, so StrictMode's double render sees it too. */
  take(): string | null {
    const text = pending;
    if (text !== null) setTimeout(() => (pending = null), 0);
    return text;
  },
};
