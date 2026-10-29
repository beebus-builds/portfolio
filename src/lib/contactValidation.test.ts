import { describe, expect, it } from "vitest";
import { validateContact } from "./contactValidation";

/**
 * The error strings are a contract shared by the /api/contact route and the
 * /contact server action — the route asserts on them in its own tests.
 */
function error(raw: { name?: unknown; email?: unknown; message?: unknown }): string {
  const result = validateContact(raw);
  if (result.ok) throw new Error("expected validation to fail");
  return result.error;
}

describe("validateContact", () => {
  it("trims and lowercases a valid signal", () => {
    const result = validateContact({ name: "  Ada  ", email: " Ada@Example.COM ", message: "  Hello out there!  " });
    expect(result).toEqual({
      ok: true,
      value: { name: "Ada", email: "ada@example.com", message: "Hello out there!" },
    });
  });

  it("demands all three fields", () => {
    expect(validateContact({ name: "Ada", email: "a@b.co", message: "" }).ok).toBe(false);
    expect(validateContact({ name: "Ada", email: "", message: "A long enough message." }).ok).toBe(false);
    expect(validateContact({ name: "Ada", email: "a@b.co", message: "A long enough message." }).ok).toBe(true);
  });

  it("keeps the contract error strings exact", () => {
    expect(error({})).toBe("Name, email and message are required");
    expect(error({ name: "Ada", email: "nope", message: "A long enough message." })).toBe("Invalid email address");
    expect(error({ name: "x".repeat(101), email: "a@b.co", message: "A long enough message." })).toBe(
      "Name or message is too long"
    );
    expect(error({ name: "Ada", email: "a@b.co", message: "short" })).toBe(
      "Message should be at least 10 characters"
    );
  });

  it("rejects addresses that only look plausible", () => {
    for (const email of ["a@b", "a b@c.co", "a@b.c o", "@b.co", "a@.co"]) {
      expect(validateContact({ name: "Ada", email, message: "A long enough message." }).ok).toBe(false);
    }
  });
});
