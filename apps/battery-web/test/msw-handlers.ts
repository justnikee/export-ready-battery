import { http, HttpResponse } from "msw";

// Fixtures shaped like the real Go responses (see
// services/battery-api/internal/models/models.go and
// internal/handlers/dashboard_handlers.go) so a future shape change to
// either side shows up as a failing contract test rather than a silent
// runtime mismatch.

export const dashboardStatsFixture = {
  total_passports: 120,
  total_batches: 8,
  quota_used: 12,
  quota_limit: 100,
  quota_balance: 88,
  passports_this_week: 15,
  batches_by_status: { ACTIVE: 5, DRAFT: 3 },
};

export const batchesChartDataFixture = {
  batches: [
    {
      id: "batch-1",
      created_at: "2026-05-01T00:00:00Z",
      status: "DRAFT",
      total_passports: 40,
    },
    {
      id: "batch-2",
      created_at: "2026-06-01T00:00:00Z",
      status: "DRAFT",
      total_passports: 80,
    },
  ],
  count: 2,
};

export const recentBatchesFixture = {
  batches: [
    {
      id: "batch-2",
      name: "June Production Run",
      created_at: "2026-06-01T00:00:00Z",
      total_units: 80,
      status: "DRAFT",
      market_region: "EU",
    },
  ],
  count: 1,
};

/** P-08: combined first-paint payload (stats + chart + recent). */
export const dashboardBootstrapFixture = {
  stats: dashboardStatsFixture,
  chart_batches: batchesChartDataFixture.batches,
  recent_batches: recentBatchesFixture.batches,
  stale_draft_batch_count: 0,
  chart_limit: 200,
  recent_limit: 5,
};

export const scanFeedFixture = {
  scans: [],
  count: 0,
};

export const handlers = [
  http.get("*/dashboard/bootstrap", () =>
    HttpResponse.json(dashboardBootstrapFixture),
  ),
  // Keep fine-grained endpoints for other pages / legacy callers
  http.get("*/dashboard/stats", () => HttpResponse.json(dashboardStatsFixture)),
  http.get("*/batches/chart-data", () =>
    HttpResponse.json(batchesChartDataFixture),
  ),
  http.get("*/batches/recent", () => HttpResponse.json(recentBatchesFixture)),
  http.get("*/scans/feed", () => HttpResponse.json(scanFeedFixture)),
];
