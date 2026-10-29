import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage, type ContactFormState } from "./action";

vi.mock("@/lib/contact", () => ({
  saveMessage: vi.fn().mockResolvedValue(undefined),
}));

import { saveMessage } from "@/lib/contact";

const saveMessageMock = vi.mocked(saveMessage);

const IDLE: ContactFormState = { status: "idle", error: null };

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  saveMessageMock.mockClear();
  saveMessageMock.mockResolvedValue(undefined);
});

describe("sendMessage action", () => {
  it("saves valid signals and reports sent", async () => {
    const state = await sendMessage(IDLE, form({ name: "Ada", email: " Ada@Example.com ", message: "Hello out there!" }));
    expect(state).toEqual({ status: "sent", error: null });
    expect(saveMessageMock).toHaveBeenCalledWith("Ada", "ada@example.com", "Hello out there!");
  });

  it("swallows the honeypot silently", async () => {
    const state = await sendMessage(
      IDLE,
      form({ name: "bot", email: "bot@spam.io", message: "buy my widgets now please", company: "Acme SEO Ltd" })
    );
    // Pretends success so the bot learns nothing.
    expect(state).toEqual({ status: "sent", error: null });
    expect(saveMessageMock).not.toHaveBeenCalled();
  });

  it("surfaces the contract error strings", async () => {
    const missing = await sendMessage(IDLE, form({ name: "", email: "", message: "" }));
    expect(missing).toEqual({ status: "error", error: "Name, email and message are required" });

    const badEmail = await sendMessage(IDLE, form({ name: "Ada", email: "nope", message: "A long enough message." }));
    expect(badEmail).toEqual({ status: "error", error: "Invalid email address" });
    expect(saveMessageMock).not.toHaveBeenCalled();
  });

  it("turns a failed write into a soft error", async () => {
    saveMessageMock.mockRejectedValue(new Error("neon is down"));
    const state = await sendMessage(IDLE, form({ name: "Ada", email: "ada@example.com", message: "Hello out there!" }));
    expect(state).toEqual({ status: "error", error: "The channel could not receive that message." });
  });
});
