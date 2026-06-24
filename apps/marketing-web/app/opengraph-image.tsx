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
          background: "#09090B",
          color: "#FAFAFA",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#4F46E5",
            }}
          />
          <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Anviora
          </span>
        </div>
        <div style={{ marginTop: 48, fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 960 }}>
          Digital Product Passports for Indian Exporters
        </div>
        <div style={{ marginTop: 24, fontSize: 28, color: "#A1A1AA", maxWidth: 880 }}>
          EU Battery Passports, certificate tracking, and QR-code verification
          — built for manufacturers exporting to Europe.
        </div>
      </div>
    ),
    { ...size },
  );
}
