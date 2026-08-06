# ExportReady — Agent Workspace Guide

Short rules every agent must follow. **Behavioral detail lives in `CLAUDE.md`.**  
**Live project state lives in `memory/`.** Do not invent priorities from old `docs/*` plans.

---

## Session start (every conversation)

Do this **before** coding, in order:

1. Read **`memory/CURRENT.md`** — active focus, blockers, next task.
2. Read **`memory/rules.md`** — hard constraints (auth, lifecycle, repo pattern).
3. Skim **`memory/backlog.md`** if the task touches security, perf, or multi-tenant auth.
4. If continuing prior work, open the latest file in **`memory/sessions/`**.

Skip deep README / master-plan reads unless the user asks for product history.

---

## Before each non-trivial task

| Situation | Do this first |
|-----------|----------------|
| “Where is X / what calls Y?” | `graphify query "…"` then open the cited files |
| Structural / cross-module change | `graphify path A B` + check blast radius |
| Unsure of conventions | `memory/rules.md` + `CLAUDE.md` relevant section |
| Security / tenancy / admin | `memory/backlog.md` + ADR 004 if admin/platform |
| “Is this done?” | `.claude/skills/preflight` then `.claude/skills/verify` if runtime |

**Do not** blanket-grep the monorepo as step 1 when graphify can narrow the path.

---

## Doc hierarchy (what is truth)

| Source | Trust | Use for |
|--------|-------|---------|
| **Code** | Highest | Always verify claims against code |
| **`memory/CURRENT.md` + `rules.md` + ADRs** | High | Live intent, constraints, decisions |
| **`CLAUDE.md`** | High | Commands, architecture, pitfalls, Do-Nots |
| **`docs/*` plans/audits** | Historical | Intent only — re-verify every claim |
| **README** | Mixed | Onboarding; some scripts/paths are stale |

---

## Skills (repo)

| Skill | When |
|-------|------|
| **preflight** | Before commit/push; stop condition for goal loops |
| **verify** | Prove the change works on running services/UI |

User-level skills (check-work, etc.) apply when the user invokes them.

---

## While implementing

1. Prefer smallest diff that fixes the stated task.
2. Backend repo methods → **three files** (impl + interface + mock).
3. Frontend data → `lib/api/*` + `queryKeys` factory only.
4. Auth: never weaken in-memory access token + HttpOnly refresh design.
5. Platform/cross-tenant admin → **`X-Admin-API-Key` / `ADMIN_API_KEY`**, never tenant OWNER JWT.
6. Tenant isolation: every mutation/query by resource id must be scoped by `tenant_id` from context (or platform admin key).
7. Migrations: append-only new numbered pairs; never edit applied migrations.
8. After structural code changes: `graphify update .` (or note it for session end).

---

## Session / task end (required when work lands)

Update memory so the **next** agent is not blind:

| Outcome | Write |
|---------|--------|
| Any meaningful progress | New or append `memory/sessions/YYYY-MM-DD-<slug>.md` |
| Decision / new invariant | ADR in `memory/decisions/NNN-….md` + link in INDEX |
| Priority or status change | `memory/CURRENT.md` + `memory/backlog.md` |
| New hard rule | `memory/rules.md` |
| Structure changed | Graphify update (if not already) |

Session log template: `memory/templates/session.md`.

---

## Stop conditions

- **Done for merge:** `bash scripts/preflight.sh` exits 0 (or scoped gates for the touched package) **and** contract checks in the preflight skill.
- **Done for “it works”:** preflight + runtime verify skill.
- Never call done after “looks right” without tests when handlers/API/auth changed.

---

## Quick map

```
CLAUDE.md              → how to build/test/deploy this repo
memory/CURRENT.md      → what we are doing right now
memory/rules.md        → never-break constraints
memory/backlog.md      → ordered open work (security/perf/…)
memory/decisions/      → why we chose X
memory/sessions/       → what happened last time
graphify-out/          → symbol graph (local; regenerate with graphify)
.claude/skills/        → preflight + verify recipes
```
