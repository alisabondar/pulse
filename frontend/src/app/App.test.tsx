import { act, screen, within } from "@testing-library/react";
import type { RouteObject } from "react-router";
import { describe, expect, it } from "vite-plus/test";

import { ApiProblem } from "@/api/errors";
import { CurrentUserProvider } from "@/auth/CurrentUserProvider";
import { RouteError } from "@/pages/RouteError";
import { renderApp } from "@/test/render";

import { Shell } from "./Shell";

const nav = () => screen.findByRole("navigation", { name: "Main" });

describe("app shell", () => {
  it("shows the main navigation as icons that each keep their name", async () => {
    renderApp("/");

    const links = within(await nav()).getAllByRole("link");

    // The labels are visually hidden, not removed, so screen readers still announce them.
    expect(links.map((link) => link.textContent)).toEqual(["My day", "Patients", "New patient"]);
    expect(links[0]).toHaveAttribute("aria-current", "page");
  });

  it("names a navigation icon in a tooltip when it has keyboard focus", async () => {
    renderApp("/");
    const patients = within(await nav()).getByRole("link", { name: "Patients" });

    act(() => patients.focus());

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Patients");
  });

  it.each([
    ["/", "My day"],
    ["/patients", "Patients"],
    ["/patients/new", "New patient"],
    ["/patients/11111111-1111-4111-8111-111111111111", "Osei, Daniel"],
  ])("routes %s to its page", async (path, heading) => {
    renderApp(path);

    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });

  it.each([
    ["/patients/11111111-1111-4111-8111-111111111111", "Patients"],
    ["/patients/", "Patients"],
  ])("highlights the right section on %s", async (path, section) => {
    renderApp(path);

    const current = within(await nav())
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page")
      .map((link) => link.textContent);
    expect(current).toEqual([section]);
  });

  it("shows a not-found page with a way home", async () => {
    renderApp("/no/such/page");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to your home page" })).toHaveAttribute("href", "/");
  });

  it("catches errors in a page and shows the request id, never a stack trace", async () => {
    function Broken(): never {
      throw new ApiProblem({
        status: 500,
        code: "INTERNAL_ERROR",
        detail: "Boom",
        requestId: "req-9",
      });
    }
    const routes: RouteObject[] = [
      {
        element: (
          <CurrentUserProvider>
            <Shell />
          </CurrentUserProvider>
        ),
        children: [
          { errorElement: <RouteError />, children: [{ path: "broken", element: <Broken /> }] },
        ],
      },
    ];

    renderApp("/broken", { routes });

    expect(
      await screen.findByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/req-9/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/at Broken|\.tsx:\d+/);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });
});
