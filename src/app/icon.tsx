import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#04050c",
          color: "#6fe6f4",
          fontFamily: "monospace",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        BP
      </div>
    ),
    { ...size }
  );
}
