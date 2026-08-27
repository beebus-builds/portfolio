import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";

function decode(s: string | null, fallback: string): string {
  if (!s) return fallback;
  try {
    return decodeURIComponent(s).slice(0, 120);
  } catch {
    return fallback;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = decode(searchParams.get("title"), "Bibash Poudel");
  const subtitle = decode(searchParams.get("subtitle"), "DevVerse — Nepal Dev Terminal");
  const type = decode(searchParams.get("type"), "home");
  const accent = searchParams.get("accent") || "#54e6d4";

  const kind =
    type === "blog" ? "blog post" : type === "project" ? "case study" : "portfolio";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#0a0a1a",
          backgroundImage:
            "linear-gradient(135deg, rgba(84,230,212,0.10) 0%, rgba(10,10,26,0) 45%), linear-gradient(315deg, rgba(255,74,240,0.10) 0%, rgba(10,10,26,0) 45%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top row: logo + kind badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                backgroundColor: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0a0a1a",
                fontSize: "26px",
                fontWeight: 800,
              }}
            >
              ▶
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.5px" }}>
                bibash.dev
              </div>
              <div style={{ fontSize: "20px", color: "rgba(255,255,255,0.45)" }}>
                @beebus-builds
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: "20px",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: accent,
              border: `1px solid ${accent}`,
              borderRadius: "999px",
              padding: "10px 22px",
            }}
          >
            {kind}
          </div>
        </div>

        {/* Center: title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "22px",
              color: accent,
              fontFamily: "monospace",
              display: "flex",
            }}
          >
            visitor@devverse:~$
          </div>
          <div
            style={{
              fontSize: "68px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-1.5px",
              maxWidth: "980px",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "26px", color: "rgba(255,255,255,0.55)", maxWidth: "900px" }}>
            {subtitle}
          </div>
        </div>

        {/* Bottom: faux terminal bar + flag */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#ff5f56" }} />
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#27c93f" }} />
          </div>
          <div style={{ fontSize: "22px", color: "rgba(255,255,255,0.4)" }}>🇳🇵 Made in Nepal</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
