"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Pulsing block for use inside a `bg-muted` card — the default Skeleton tone
// (bg-muted) would be invisible against a bg-muted parent, so these use
// bg-background instead, same convention as the real cards' own inline
// loaders (ComplianceScoreCard, RegulatoryDeadlines).
function Bar({ className }: { className: string }) {
  return <Skeleton className={`bg-background ${className}`} />;
}

/**
 * Mirrors the DOM structure and exact class names of the loaded
 * battery-dashboard-page.tsx (wrapper, grid, card shapes, chart heights) so
 * swapping skeleton -> real content causes no layout shift. Only leaf
 * content (text, numbers, chart, table rows) becomes pulsing bars.
 */
export function DashboardSkeleton() {
  return (
    <div
      className="min-h-screen bg-sidebar p-6"
      role="status"
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      <div className="w-full mx-auto space-y-6">
        {/* Section 1: Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <Bar className="h-7 w-56" />
            <Bar className="h-4 w-72 mt-2" />
          </div>
          <Bar className="h-9 w-36 shrink-0" />
        </div>

        {/* Two-column layout: left = content, right = status rail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative bg-muted rounded-md p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Bar className="h-3 w-20" />
                    <Bar className="h-5 w-5" />
                  </div>
                  <Bar className="h-8 w-16" />
                  <Bar className="h-3 w-24 mt-2.5" />
                </div>
              ))}
            </div>

            {/* Production Overview */}
            <div className="relative bg-muted rounded-md overflow-visible">
              <div className="px-6 py-4">
                <Bar className="h-5 w-40" />
                <Bar className="h-3 w-56 mt-1.5" />
              </div>
              <div className="px-6 pb-6">
                <Bar className="h-70 w-full" />
              </div>
            </div>

            {/* Recent Batches */}
            <div className="relative bg-muted rounded-md overflow-visible">
              <div className="px-6 py-4 flex items-center justify-between">
                <Bar className="h-5 w-32" />
                <Bar className="h-3 w-16" />
              </div>
              <table className="w-full">
                <thead className="bg-background/60">
                  <tr>
                    {["w-20", "w-14", "w-14", "w-16", "w-4"].map((w, i) => (
                      <th key={i} className="px-4 py-3">
                        <Bar className={`h-2.5 ${w}`} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3">
                        <Bar className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-3">
                        <Bar className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <Bar className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Bar className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Bar className="h-4 w-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column: status rail */}
          <div className="flex flex-col gap-6">
            {/* Compliance chips (or banner/workspace card variant — similar shape/height) */}
            <div className="relative bg-muted rounded-md p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bar className="h-4 w-4" />
                <Bar className="h-4 w-24" />
              </div>
              <div className="flex flex-col gap-2 mb-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Bar className="h-3 w-16" />
                    <Bar className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
              <Bar className="h-3 w-28" />
            </div>

            {/* Compliance score */}
            <div className="relative bg-muted rounded-md p-5">
              <div className="flex items-center justify-between mb-3">
                <Bar className="h-3 w-20" />
                <Bar className="h-4 w-4" />
              </div>
              <Bar className="h-8 w-full" />
            </div>

            {/* Batch Status */}
            <div className="relative bg-muted rounded-md overflow-visible">
              <div className="px-6 py-4">
                <Bar className="h-5 w-28" />
              </div>
              <div className="px-6 pb-6 flex justify-center">
                <Bar className="h-40 w-40 rounded-full" />
              </div>
            </div>

            {/* EPR Obligation */}
            <div className="relative bg-muted rounded-md overflow-visible p-5">
              <div className="flex items-center justify-between mb-3">
                <Bar className="h-3 w-28" />
                <Bar className="h-4 w-4" />
              </div>
              <Bar className="h-3 w-32 mb-2" />
              <Bar className="h-1.5 w-full" />
              <Bar className="h-3 w-24 mt-3" />
            </div>

            {/* Regulatory Deadlines */}
            <div className="relative bg-muted rounded-md overflow-visible">
              <div className="px-6 py-4 flex items-center justify-between">
                <Bar className="h-5 w-40" />
                <Bar className="h-3 w-16" />
              </div>
              <div className="px-6 pb-6">
                <Bar className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}
