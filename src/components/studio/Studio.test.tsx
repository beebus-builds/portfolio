// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }) }));
// The WebGL scene is out of scope here; this test covers the no-WebGL fallback.
vi.mock("next/dynamic", () => ({ default: () => () => null }));

import Studio from "./Studio";

beforeEach(() => {
  // jsdom has no canvas: report "no WebGL" quietly so the flat fallback renders.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Studio", () => {
  it("keeps the homepage to the room only", () => {
    render(<Studio />);

    expect(screen.getByText(/Bibash is at the desk/)).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    // The only control in the room chrome is the lights toggle.
    expect(screen.queryAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Toggle the room lights" })).toBeTruthy();
    expect(screen.queryByText(/Now playing/)).toBeNull();
    expect(screen.queryByText(/Coffee/)).toBeNull();

    // Without WebGL the dock is still the way through the portfolio.
    const nav = screen.getByRole("navigation", { name: "Portfolio pages" });
    expect(nav.querySelectorAll("a").length).toBe(9); // 8 rooms + 1 summary + lights button is not a link
    expect(screen.getByText("Projects").closest("a")?.getAttribute("href")).toBe("/projects");
    expect(screen.getByText("Summary").closest("a")?.getAttribute("href")).toBe("/summary");
  });
});
