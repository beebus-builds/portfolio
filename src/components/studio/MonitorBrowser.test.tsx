// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@react-three/drei", () => ({
  Html: ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
    <div style={style}>{children}</div>
  ),
}));

import MonitorBrowser from "./MonitorBrowser";

afterEach(() => {
  cleanup();
});

describe("MonitorBrowser", () => {
  it("opens on the start page and restores it with Back", () => {
    render(
      <MonitorBrowser
        open
        onClose={vi.fn()}
        onOpenSite={vi.fn()}
        onOpenExternal={vi.fn()}
      />
    );

    const address = screen.getByLabelText("Address bar") as HTMLInputElement;
    expect(address.value).toBe("home");
    expect(screen.getByRole("heading", { name: "start" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /About/ }));
    expect(address.value).toBe("about");
    expect(screen.getByRole("heading", { name: "About" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(address.value).toBe("home");
    expect(screen.getByRole("heading", { name: "start" })).toBeTruthy();
  });

  it("keeps the current page when an address cannot be resolved", () => {
    render(
      <MonitorBrowser
        open
        onClose={vi.fn()}
        onOpenSite={vi.fn()}
        onOpenExternal={vi.fn()}
      />
    );

    const address = screen.getByLabelText("Address bar") as HTMLInputElement;
    fireEvent.change(address, { target: { value: "not-a-place" } });
    fireEvent.keyDown(address, { key: "Enter" });

    expect(screen.getByText("That address didn't resolve.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "start" })).toBeTruthy();
  });
});
