import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, vi } from "vite-plus/test";

import { personaStore } from "@/api/persona";

import { server } from "./msw/server";

configure({ asyncUtilTimeout: 3000 });

// jsdom has no matchMedia; the toaster reads it to follow the system theme. Report light.
vi.stubGlobal("matchMedia", (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
}));

// jsdom has no ResizeObserver; Radix uses it to place tooltips and popovers, which tests only
// need to exist, not to measure.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

// jsdom doesn't scroll; the Today strip scrolls the open chart's chip into view.
Element.prototype.scrollIntoView = () => {};

// Started on load, before test files import the API client, so it captures the mocked fetch.
// Any request without a handler fails the test, so no test silently hits a real network.
server.listen({ onUnhandledFrame: "error" });
afterEach(() => {
  server.resetHandlers();
  personaStore.set(null);
  cleanup();
});
afterAll(() => server.close());
