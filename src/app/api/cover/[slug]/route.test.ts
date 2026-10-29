import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/postsStore", () => ({
  getPostRow: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  query: vi.fn().mockResolvedValue([{ n: "3" }]),
}));

import { getPostRow } from "@/lib/postsStore";
import { query } from "@/lib/db";

const getPostRowMock = vi.mocked(getPostRow);
const queryMock = vi.mocked(query);

function get(slug: string, search = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/cover/${slug}${search}`);
}

async function call(slug: string, search = ""): Promise<Response> {
  return GET(get(slug, search), { params: Promise.resolve({ slug }) });
}

beforeEach(() => {
  getPostRowMock.mockReset();
  getPostRowMock.mockResolvedValue(undefined);
  queryMock.mockClear();
  queryMock.mockResolvedValue([{ n: "3" }]);
});

describe("GET /api/cover/[slug]", () => {
  it("serves SVG without touching the database for an editor preview", async () => {
    const res = await call("preview", "?accent=%23ff0000&variant=1");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    expect(await res.text()).toContain("<svg");
    expect(getPostRowMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("renders stored accent, variant and title for a saved post", async () => {
    getPostRowMock.mockResolvedValue({
      slug: "my-post",
      title: "Signals from the Outer Rim",
      date: "2026-01-01",
      excerpt: "",
      minutes: 4,
      body: [],
      sections: [],
      quote: null,
      tags: [],
      cover_src: "",
      cover_alt: "",
      cover_accent: "#00ff00",
      cover_variant: 2,
      published: true,
      created_at: new Date(),
      updated_at: new Date(),
    } as never);

    const svg = await (await call("my-post")).text();
    expect(getPostRowMock).toHaveBeenCalledWith("my-post");
    expect(svg).toContain("#00ff00");
    // The label is burned in as a two-word capitalised category from the title.
    expect(svg).toContain("SIGNALS FROM");
    // Cover label is numbered from the post's position in the library.
    expect(queryMock).toHaveBeenCalled();
    expect(svg).toContain("BP-LOG 03");
  });

  it("still serves defaults when the database is unreachable", async () => {
    getPostRowMock.mockRejectedValue(new Error("pool gone"));
    queryMock.mockRejectedValue(new Error("pool gone"));

    const res = await call("some-post");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<svg");
  });
});
