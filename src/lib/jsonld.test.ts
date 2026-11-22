import { describe, expect, it } from "vitest";
import { personJsonLd } from "./jsonld";
import { profile, techStack } from "@/lib/profile";
import { siteUrl } from "@/lib/site";

describe("personJsonLd", () => {
  it("describes the profile as a schema.org Person", () => {
    const json = personJsonLd();

    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("Person");
    expect(json.name).toBe(profile.name);
    expect(json.url).toBe(siteUrl);
    expect(json.jobTitle).toBe(profile.role);
    expect(json.email).toBe("mailto:poudelbibash044@gmail.com");
    expect(json.knowsAbout).toBe(techStack);
    expect(json.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Sindhuli",
      addressCountry: "NP",
    });
  });

  it("lists only absolute URLs in sameAs", () => {
    const json = personJsonLd();
    const sameAs = json.sameAs as string[];

    expect(sameAs).toContain("https://github.com/beebus-builds");
    expect(sameAs).toContain("https://linkedin.com/in/bibashpoudel");
    // The mailto link is not a profile page.
    expect(sameAs.every((href) => href.startsWith("http"))).toBe(true);
  });
});

