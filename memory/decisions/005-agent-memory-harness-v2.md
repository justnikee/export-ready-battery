# ADR 005: Agent memory harness v2 (session-useful)

## Status
Accepted — 2026-08-04

## Context
ADR 001 established graphify + `memory/` but the vault was thin (empty sessions, static INDEX, rules missing auth/security) and **gitignored** along with `CLAUDE.md` / `.claude/`, so agents could not rely on shared live state across tools or clones.

## Decision
1. **`memory/CURRENT.md`** is the single live “what now” file agents read first.
2. **`memory/backlog.md`** holds ordered security/perf (and other) work with status.
3. **`memory/rules.md`** holds never-break constraints including platform admin key and tenancy.
4. **`memory/sessions/`** gets a real log per session; template under `memory/templates/session.md`.
5. **`AGENTS.md`** defines start → task → end protocol and doc trust hierarchy.
6. **Track** CLAUDE.md, memory durable files, and `.claude/skills` in git; keep `graphify-out/` and local Claude overrides gitignored.

## Consequences
- Next session can resume S-02 without re-auditing chat history.
- Agents have a clear “done” path for memory updates, not only code.
- Graphify remains local/regenerable; memory is the portable process state.
