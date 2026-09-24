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
          border: "1px solid #6fe6f4",
          borderRadius: "50%",
          background: "#05080d",
          color: "#6fe6f4",
          fontFamily: "monospace",
          fontSize: "17px",
          fontWeight: "bold",
        }}
      >
        O
      </div>
    ),
    { ...size },
  );
}
