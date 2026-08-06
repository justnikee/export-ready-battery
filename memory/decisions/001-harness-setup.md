# ADR 001: Workspace Harness Setup (Graphify & Obsidian Memory Vault)

- **Status**: Accepted
- **Date**: 2026-07-20
- **Authors**: Antigravity Engineering Team

## Context & Problem Statement
As ExportReady-Battery grows across multiple web apps, Go microservices, and regulatory compliance domains, maintaining architectural context, state machine rules, and structural dependencies across agent sessions requires systematic knowledge graph indexing and persistent long-term memory.

## Decision
We have established a dual-layered workspace harness:
1. **Graphify Knowledge Graph**: AST-based code structure graph indexing (`graphify-out/graph.json`) enabling precise symbol queries (`graphify query`) and call path tracing (`graphify path`).
2. **Obsidian Memory Vault (`memory/`)**: Persistent Markdown vault containing:
   - `INDEX.md`: Master index of subsystems, core models, and data flows.
   - `rules.md`: Project constraints, state machine requirements, and 3-file repository pattern rules.
   - `decisions/`: Architectural Decision Records (ADRs) tracking key technical design choices.
   - `sessions/`: Sprint logs and session updates.

## Consequences
- **Positive**:
  - Agents can instantly query code graph relationships before executing broad search queries or large file reads.
  - Consistent enforcement of repository pattern rules, state machine integrity, and DB-to-UI typing alignment across sessions.
- **Rules Introduced**:
  - Read `memory/INDEX.md` and `memory/rules.md` at session start.
  - Record major architectural decisions in `memory/decisions/` upon completion.
