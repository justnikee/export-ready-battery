"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-md">
        <ErrorState
          message={
            error.message || "Something went wrong loading this page."
          }
          onRetry={reset}
        />
      </div>
    </div>
  );
}
