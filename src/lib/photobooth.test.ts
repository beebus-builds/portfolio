import { describe, expect, it } from "vitest";
import { isImageDataUrl, normaliseCode } from "@/lib/photobooth";
import {
  InvalidJsonBodyError,
  PHOTOBOOTH_TOKEN_HEADER,
  RequestBodyTooLargeError,
  readLimitedJson,
  tokenFromHeaders,
} from "@/lib/photoboothProtocol";

describe("normaliseCode", () => {
  it("uppercases and strips characters that cannot appear in a code", () => {
    expect(normaliseCode(" ab-12_34 ")).toBe("AB1234");
    expect(normaliseCode("ab12cd34")).toBe("AB12CD34");
  });

  it("caps the length so a giant input cannot reach the database", () => {
    expect(normaliseCode("A".repeat(50))).toHaveLength(12);
  });
});

describe("tokenFromHeaders", () => {
  it("reads a bounded role capability", () => {
    const headers = new Headers({ [PHOTOBOOTH_TOKEN_HEADER]: "  capability_123  " });
    expect(tokenFromHeaders(headers)).toBe("capability_123");
  });

  it("rejects missing or oversized capabilities", () => {
    expect(tokenFromHeaders(new Headers())).toBeNull();
    expect(tokenFromHeaders(new Headers({ [PHOTOBOOTH_TOKEN_HEADER]: "x".repeat(201) }))).toBeNull();
  });
});

describe("readLimitedJson", () => {
  it("parses a small JSON body", async () => {
    const request = new Request("http://localhost/photobooth", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
      headers: { "content-type": "application/json" },
    });
    await expect(readLimitedJson(request, 100)).resolves.toEqual({ ok: true });
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("http://localhost/photobooth", { method: "POST", body: "not-json" });
    await expect(readLimitedJson(request, 100)).rejects.toBeInstanceOf(InvalidJsonBodyError);
  });

  it("rejects an oversized declared or streamed body", async () => {
    const declared = new Request("http://localhost/photobooth", {
      method: "POST",
      body: "{}",
      headers: { "content-length": "1000" },
    });
    await expect(readLimitedJson(declared, 100)).rejects.toBeInstanceOf(RequestBodyTooLargeError);

    const streamed = new Request("http://localhost/photobooth", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(200) }),
    });
    await expect(readLimitedJson(streamed, 100)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
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