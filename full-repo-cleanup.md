# Full Repo Cleanup

## Goal
Resolve repo-wide TypeScript errors and UX/A11y audit failures, then re-run validation scripts until clean.

## Tasks
- [ ] Remove stale build artifacts that break type checking → Verify: `npx tsc --noEmit` no longer references `.next/types/validator.ts`.
- [ ] Align `frontend/lib/types.ts` with backend models and update mismatched usages → Verify: dashboard/batch pages compile.
- [ ] Fix null/optional handling and missing properties across reported TS errors → Verify: `npx tsc --noEmit` passes.
- [ ] Remove banned purple usages and update affected UI tokens → Verify: UX audit no longer flags purple.
- [ ] Fix accessibility/UX audit errors (skip links, labels, keyboard handlers, email templates lang) → Verify: `accessibility_checker.py` and `ux_audit.py` errors resolved.
- [ ] Re-run `npm run lint`, `npx tsc --noEmit`, `ux_audit.py`, `accessibility_checker.py` → Verify: all pass.

## Done When
- [ ] TypeScript passes cleanly.
- [ ] UX/A11y audit scripts show no errors.
