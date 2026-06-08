"use client";

import { ReactNode } from "react";

interface OnboardingShellProps {
  children: ReactNode;
}

export function OnboardingShell({ children }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8 relative z-10">
        {children}
      </div>
    </div>
  );
}
