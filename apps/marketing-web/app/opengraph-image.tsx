import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(160deg, #0e5a40 0%, #157a5b 55%, #1d9670 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              background: "#ffffff",
              transform: "skewX(-10deg)",
            }}
          />
          <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Anviora
          </span>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            maxWidth: 980,
          }}
        >
          Digital Product Passports for Indian Exporters
        </div>
        <div style={{ marginTop: 24, fontSize: 27, color: "rgba(255,255,255,0.82)", maxWidth: 900 }}>
          Battery Passports, certificate tracking, and 10-second QR verification —
          one dataset for India and EU regulators.
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 24px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.28)",
            fontSize: 24,
            fontWeight: 600,
            alignSelf: "flex-start",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#fca5a5",
            }}
          />
          EU Battery Passport — mandatory 18 Feb 2027
        </div>
      </div>
    ),
    { ...size },
  );
}
