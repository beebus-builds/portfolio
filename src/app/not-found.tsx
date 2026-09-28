import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        display: "grid",
        placeContent: "center",
        justifyItems: "center",
        gap: "18px",
        minHeight: "100dvh",
        padding: "40px",
        textAlign: "center",
        fontFamily: "var(--font-body)",
      }}
    >
      <p style={{ margin: 0, color: "#6fe6f4", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.3em" }}>
        SIGNAL LOST
      </p>
      <h1 style={{ margin: 0, fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 600, letterSpacing: "-0.02em" }}>
        Nothing orbits this address
      </h1>
      <p style={{ margin: 0, maxWidth: "48ch", color: "#8ea2b4", lineHeight: 1.6 }}>
        The coordinates you followed do not exist in this system. Head back to the ship and pick another
        vector.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "10px",
          padding: "14px 28px",
          borderRadius: "999px",
          background: "#eaf2f8",
          color: "#04050c",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Return to the ship
      </Link>
    </main>
  );
}
