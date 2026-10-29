// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PostBodyView from "./PostBodyView";

afterEach(cleanup);

const SECTIONS = [
  {
    heading: "Flight log",
    paragraphs: ["The first entry."],
    bullets: ["one", "two"],
    code: { lang: "ts", snippet: "const x: number = 1;" },
  },
];

describe("<PostBodyView>", () => {
  it("renders paragraphs, the pull quote and section furniture", () => {
    render(
      <PostBodyView
        body={["Lead paragraph."]}
        quote={"The punchline of the post."}
        sections={SECTIONS}
      />
    );

    expect(screen.getByText("Lead paragraph.")).toBeTruthy();
    expect(screen.getByText("The punchline of the post.")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Flight log" })).toBeTruthy();
    expect(screen.getByText("const x: number = 1;")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a lightbox when an inline image is clicked and closes it", () => {
    render(<PostBodyView body={["![Console screenshot](/uploads/console.png)"]} />);

    const caption = screen.getByText("Console screenshot");
    expect(caption.tagName).toBe("FIGCAPTION");

    fireEvent.click(caption.closest("figure")!);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toBe("Console screenshot");
    // Inline figure image plus the lightbox copy, both labelled by alt text.
    const images = screen.getAllByRole("img", { name: "Console screenshot" });
    expect(images).toHaveLength(2);
    const lightboxImage = images.find((image) => dialog.contains(image)) as HTMLImageElement;
    expect(lightboxImage.src).toContain("/uploads/console.png");

    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows body text without image markup", () => {
    render(<PostBodyView body={["Just words this time."]} />);
    expect(screen.getByText("Just words this time.")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
