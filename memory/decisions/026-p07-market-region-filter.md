# ADR 026: Server-side batch market_region list filter (P-07)

## Status
Accepted — 2026-08-05

## Context
`useEuActiveBatches` fetched `GET /batches?limit=200&status=ACTIVE` then filtered `EU|GLOBAL` in the browser. If a tenant had more than 200 active batches (or many INDIA-first rows), EU batches could be missing from the compliance hub.

## Decision
1. `ListBatchesFiltered` accepts optional `marketRegions []string` — SQL  
   `COALESCE(market_region,'GLOBAL') = ANY($regions)` when non-empty.
2. Handler parses `?market_region=EU` or `?market_region=EU,GLOBAL` (case-insensitive, validated).
3. Frontend calls  
   `/batches?limit=200&status=ACTIVE&market_region=EU,GLOBAL`  
   and uses the response as-is (no client filter).

## Consequences
- `total` reflects the filtered set.
- Pagination still max 200; very large EU fleets may need further paging later.
