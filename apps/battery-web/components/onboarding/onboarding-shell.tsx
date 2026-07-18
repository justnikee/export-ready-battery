"use client";

import { ReactNode } from "react";

interface OnboardingShellProps {
  left: ReactNode;
  children: ReactNode;
}

export function OnboardingShell({ left, children }: OnboardingShellProps) {
  return (
    <div
      className="min-h-screen lg:grid lg:grid-cols-[40%_60%]"
      style={{ background: "#000000" }}
    >
      {/* Left panel — hidden on mobile, exactly 40% on desktop via grid */}
      <div className="hidden lg:flex relative overflow-hidden w-full h-screen sticky top-0">
        {left}
      </div>

      {/* Right panel — full width on mobile, exactly 60% on desktop via grid */}
      <div
        className="flex flex-col min-h-screen overflow-y-auto onboarding-right-panel"
        style={{
          background: "#111111",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
