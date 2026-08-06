# ADR 002: Advanced Analytics Temporary Tier Allocation (Growth vs Enterprise)

- **Status**: Accepted
- **Date**: 2026-07-20
- **Authors**: Antigravity Engineering Team

## Context & Problem Statement
In the initial analytics plan, Advanced Analytics features (including Scan/Geo analytics and the DGFT Incentive Money Dashboard) were allocated strictly to the `ENTERPRISE` plan. However, to support early beta validation, these features need to be accessible on the `GROWTH` tier temporarily.

## Decision
We changed the minimum plan requirements for the `FeatureAdvancedAnalytics` entitlement from `PlanEnterprise` to `PlanGrowth`:
1. **Backend (`services/battery-api/internal/services/entitlements.go`)**: Updated `FeatureAdvancedAnalytics` min plan mapping to `PlanGrowth`.
2. **Frontend (`apps/battery-web/lib/entitlements.ts`)**: Updated `advanced_analytics` min plan mapping to `"GROWTH"`.

This immediately unlocks the Money & Incentives and Scan Analytics tabs, along with their backend API endpoints (`/scans/feed`, `/scans/feed/stream`, and `/analytics/dgft-value`), for all tenants on the `GROWTH` plan.

## Consequences
- **Positive**: Tenants on the `GROWTH` plan can view and test the new charts and feeds immediately.
- **Risks**: None. We can easily transition this feature back to the `ENTERPRISE` tier later by modifying the single source of truth plan mapping files.
