import { afterEach, describe, expect, it, vi } from "vitest";
import { buildEmail, notifyNewMessage } from "./notify";

const msg = { name: "Ada <script>", email: "ada@example.com", message: "Hi & hello" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("contact notification email", () => {
  it("escapes visitor input in the HTML and replies to the visitor", () => {
    const email = buildEmail(msg, "me@example.com", "Portfolio <x@y.z>");
    expect(email.html).toContain("Ada &lt;script&gt;");
    expect(email.html).toContain("Hi &amp; hello");
    expect(email.html).not.toContain("<script>");
    expect(email.reply_to).toBe("ada@example.com");
    expect(email.to).toEqual(["me@example.com"]);
  });

  it("does nothing without configuration", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await notifyNewMessage(msg)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends through Resend when configured and never throws", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_NOTIFY_TO", "me@example.com");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await notifyNewMessage(msg)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await notifyNewMessage(msg)).toBe(false);
  });
});
