"use client";

/**
 * GlowDots (Static Dot Grid)
 * ──────────────────────────
 * High-performance, CSS-based static dot grid.
 * Uses a square pattern and a reverse radial mask to keep the center clean
 * for readability while displaying dots on the left and right sides.
 */
export default function GlowDots() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(5, 98, 239, 0.15) 1.2px, transparent 1.2px)",
        backgroundSize: "24px 24px",
        backgroundPosition: "center center",
        maskImage:
          "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, #000 80%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, #000 80%)",
      }}
    />
  );
}
