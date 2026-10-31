# Session: 2026-10-31 — marketing claim corrections

**Date:** 2026-10-31
**Agent/tool:** Codex
**User goal:** Review the uncommitted changes and prepare only justified changes for GitHub.

## Context loaded
- [x] CURRENT.md
- [x] rules.md
- [x] backlog.md
- [x] prior session

## What we did
- Isolated substantive marketing and landing copy corrections in a draft branch based on `main`.
- Replaced claims of automatic legal compliance, official filings, verified carbon classes, and Bitcoin anchoring with narrower product descriptions.
- Omitted unreviewed draft Terms and Privacy pages from the PR; removed links to those missing pages until counsel approves policy text.
- Declared the existing marketing PostCSS dependency so production builds can resolve it.

## Decisions
- Keep marketing claims in a draft PR for founder review. Do not merge until regulatory claims, pricing promises, and support commitments are checked.

## Code / files touched
- Marketing pages/components, seven battery-web landing/analytics copy files, marketing package/lockfile.

## Tests / verification
- Marketing TypeScript: passed.
- Marketing production Next build: passed with `NODE_PATH` pointing to the already-installed `@tailwindcss/postcss`; a clean install is expected to resolve from the new lockfile entry.
- Battery-web Vitest: 312 passed.
- Battery-web TypeScript on the `main` base: blocked by two pre-existing read-only `NODE_ENV` assignments in `proxy.test.ts`; unrelated to this copy diff.
- `git diff --check`: passed.

## Open for next session
1. Founder review of copy, price and support claims; legal review of the excluded policy drafts in the original checkout.
2. Retarget/merge only after stacked product PRs and manual demo verification as applicable.
3. Run normal CI on the draft PR and resolve any clean-environment failures.

## Graphify
- [x] N/A (copy and package dependency only; no structural product change)
