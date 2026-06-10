"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="w-full max-w-md bg-red-500/10 border border-red-500/20 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-500">
              Something went wrong
            </h2>
            <p className="text-sm text-red-500 mt-2">
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={reset}
              className="mt-4 inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
