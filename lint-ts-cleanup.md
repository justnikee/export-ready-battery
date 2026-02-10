# Lint + TypeScript Cleanup

## Goal
Make frontend lint and TypeScript checks pass without refactors or deletions.

## Tasks
- [ ] Review current lint and tsc failures and map to files to change. -> Verify: `npm --prefix frontend run lint` and `npx tsc -p frontend/tsconfig.json --noEmit` show only known issues.
- [ ] Fix TypeScript errors in `frontend/app/p/[uuid]/page.tsx` and `frontend/components/team/TeamList.tsx`. -> Verify: tsc error list clears for those files.
- [ ] Resolve lint warning in `frontend/components/dashboard/ScanMap.tsx` without altering behavior. -> Verify: lint shows zero warnings.
- [ ] Re-run lint and tsc to confirm green. -> Verify: both commands exit 0.

## Done When
- [ ] Lint returns no warnings or errors.
- [ ] TypeScript check passes with exit code 0.
