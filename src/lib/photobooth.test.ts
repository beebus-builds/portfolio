import { describe, expect, it } from "vitest";
import { isImageDataUrl, normaliseCode } from "@/lib/photobooth";

describe("normaliseCode", () => {
  it("uppercases and strips characters that cannot appear in a code", () => {
    expect(normaliseCode(" ab-12_34 ")).toBe("AB1234");
    expect(normaliseCode("ab12cd34")).toBe("AB12CD34");
  });

  it("caps the length so a giant input cannot reach the database", () => {
    expect(normaliseCode("A".repeat(50))).toHaveLength(12);
  });
});

describe("isImageDataUrl", () => {
  const jpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

  it("accepts a base64 image data URL within the size cap", () => {
    expect(isImageDataUrl(jpeg, 1000)).toBe(true);
  });

  it("rejects non-strings and other schemes", () => {
    expect(isImageDataUrl(undefined, 1000)).toBe(false);
    expect(isImageDataUrl("https://example.com/a.jpg", 1000)).toBe(false);
    expect(isImageDataUrl("data:text/plain;base64,SGk=", 1000)).toBe(false);
  });

  it("rejects frames larger than the cap", () => {
    expect(isImageDataUrl(jpeg, jpeg.length - 1)).toBe(false);
  });
});