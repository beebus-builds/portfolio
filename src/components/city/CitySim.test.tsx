// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import CitySim from "./CitySim";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(cleanup);

describe("CitySim", () => {
  it("renders the dashboard, palette and district list", () => {
    render(<CitySim />);
    expect(screen.getByRole("heading", { name: "Build" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mayor's goals" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Districts" })).toBeTruthy();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(3);
  });

  it("builds on an empty plot with the selected building", () => {
    render(<CitySim />);
    expect(screen.getByText(/¤ 320/)).toBeTruthy();
    const plot = screen.getByRole("button", { name: /Empty plot at 1, 2/ });
    fireEvent.click(plot);
    expect(screen.getByText(/Cottage opened for business/)).toBeTruthy();
    expect(screen.queryByText(/¤ 320/)).toBeNull();
  });

  it("does not offer the city hall plot as buildable", () => {
    render(<CitySim />);
    expect(screen.queryByRole("button", { name: /Empty plot at 6, 4/ })).toBeNull();
  });
});
