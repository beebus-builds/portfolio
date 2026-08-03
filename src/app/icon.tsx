import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #0a0a1a, #0f0f2a)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(74, 240, 255, 0.3)",
        }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 16, color: "#4af0ff", fontWeight: "bold" }}>
          ~$
        </span>
      </div>
    ),
    { ...size },
  );
}
