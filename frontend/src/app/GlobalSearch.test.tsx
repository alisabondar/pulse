import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";

import { makePage, makePatient } from "@/test/factories";
import { server } from "@/test/msw/server";
import { renderApp } from "@/test/render";

const box = () => screen.findByRole("combobox", { name: "Find a patient" });

/** Answers the app bar's search with these patients, recording each request body. */
function searchFinds(patients: ReturnType<typeof makePatient>[], total = patients.length) {
  const bodies: unknown[] = [];
  server.use(
    http.post("/api/v1/patients/search", async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(makePage(patients, { total, page_size: 6 }));
    }),
  );
  return bodies;
}

describe("app bar search", () => {
  it("finds patients by last name and opens a chart with the keyboard", async () => {
    const user = userEvent.setup();
    const bodies = searchFinds([
      makePatient({ first_name: "Daniel" }),
      makePatient({ first_name: "Ama", status: "inactive" }),
    ]);
    renderApp("/");

    await user.type(await box(), "osei");
    expect(await screen.findByRole("option", { name: /Osei, Ama/ })).toHaveTextContent("Inactive");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(await screen.findByRole("region", { name: "Patient" })).toBeVisible();
    expect(bodies.at(-1)).toEqual({ last_name: "osei" });
    expect(await box()).toHaveValue("");
  });

  it("says what it needs before searching, and when nothing matches", async () => {
    const user = userEvent.setup();
    searchFinds([]);
    renderApp("/");

    await user.type(await box(), "os");
    expect(screen.getByRole("status")).toHaveTextContent("Type at least 3 letters");

    await user.type(await box(), "zz");
    expect(await screen.findByText("No patients found")).toBeVisible();
  });

  it("hands the text to the Patients page when there are more results than fit", async () => {
    const user = userEvent.setup();
    searchFinds(
      Array.from({ length: 6 }, () => makePatient()),
      40,
    );
    renderApp("/");

    await user.type(await box(), "osei");
    await user.click(await screen.findByRole("option", { name: /See all 40 results/ }));

    expect(await screen.findByRole("heading", { name: "Patients" })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Search patients" })).toHaveValue("osei");
    // One search box per screen: the Patients page has its own.
    expect(screen.queryByRole("combobox", { name: "Find a patient" })).toBeNull();
  });

  it("focuses on “/” from anywhere, and Escape clears it", async () => {
    const user = userEvent.setup();
    renderApp("/");
    const search = await box();

    await user.keyboard("/");
    expect(search).toHaveFocus();
    await user.keyboard("abc{Escape}");
    expect(search).toHaveValue("");
  });
});
