import { ImageResponse } from "next/og";
import { planets, profile } from "@/lib/profile";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${profile.name} — ${profile.role}`;

export default function OpenGraphImage() {
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
          backgroundColor: "#04050c",
          backgroundImage:
            "radial-gradient(circle at 18% 14%, rgba(167,139,250,0.35), transparent 46%), radial-gradient(circle at 86% 82%, rgba(13,79,107,0.45), transparent 52%)",
          color: "#eaf2f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #6fe6f4",
              borderRadius: "26px",
              color: "#6fe6f4",
              fontSize: "18px",
            }}
          >
            BP
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "5px" }}>{profile.callSign}</div>
            <div style={{ fontSize: "17px", color: "#8ea2b4", fontFamily: "monospace" }}>
              {profile.role.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "72px", fontWeight: 800, letterSpacing: "-3px", lineHeight: 1 }}>
            {profile.name}
          </div>
          <div style={{ maxWidth: "880px", fontSize: "26px", color: "#b9c9d6", lineHeight: 1.4 }}>
            You are the ship. Five planets hold the about page, skills, projects, contact and resume.
          </div>
          <div style={{ display: "flex", gap: "14px", marginTop: "10px" }}>
            {planets.map((planet) => (
              <div
                key={planet.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 18px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "999px",
                  fontSize: "15px",
                  fontFamily: "monospace",
                  letterSpacing: "3px",
                }}
              >
                <div style={{ width: "10px", height: "10px", borderRadius: "5px", background: planet.glowColor }} />
                {planet.label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#5f7280",
            fontSize: "17px",
            fontFamily: "monospace",
            letterSpacing: "2px",
          }}
        >
          <span>{profile.coordinates}</span>
          <span>{profile.location.toUpperCase()}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
