import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";

function decode(value: string | null, fallback: string) {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value).slice(0, 120);
  } catch {
    return fallback;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = decode(searchParams.get("title"), "BUILD THE UNSEEN.");
  const subtitle = decode(searchParams.get("subtitle"), "An orbital developer station by Bibash Poudel.");
  const rawAccent = searchParams.get("accent") || "#6fe6f4";
  const accent = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(rawAccent) ? rawAccent : "#6fe6f4";

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
          backgroundColor: "#05080d",
          backgroundImage: `radial-gradient(circle at 76% 52%, ${accent}33, transparent 28%), linear-gradient(135deg, #07111a, #05080d 64%)`,
          color: "#eef7fa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "46px", height: "46px", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${accent}`, borderRadius: "50%", color: accent, fontSize: "22px" }}>O</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "5px" }}>PROJECT ORBITAL</div>
              <div style={{ fontSize: "17px", color: "#8496a2", fontFamily: "monospace" }}>BP-07 / CREATIVE DEVELOPER</div>
            </div>
          </div>
          <div style={{ padding: "10px 20px", border: `1px solid ${accent}`, borderRadius: "999px", color: accent, fontFamily: "monospace", fontSize: "16px", letterSpacing: "3px" }}>LIVE SYSTEM</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ color: accent, fontFamily: "monospace", fontSize: "19px", letterSpacing: "4px" }}>PERSONAL DEVELOPER STATION</div>
          <div style={{ maxWidth: "1000px", fontSize: "78px", fontWeight: 800, letterSpacing: "-4px", lineHeight: 0.95 }}>{title}</div>
          <div style={{ maxWidth: "860px", color: "#9aaab4", fontSize: "26px" }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#4c606d", fontFamily: "monospace", fontSize: "17px", letterSpacing: "2px" }}>
          <span>27.7172° N / 85.4360° E</span>
          <span>MISSIONS / SKILLS / SIGNAL</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
