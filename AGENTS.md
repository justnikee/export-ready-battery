# Antigravity Workspace Guidelines

## 1. Structural Context & Code Investigation (Graphify)
- BEFORE executing blanket `grep` searches or loading dozens of raw files into your context window, query the local knowledge graph:
  - Run `graphify query "<question>"` to find precise symbol locations and connections.
  - Run `graphify path <source> <target>` to trace call graphs or dependency paths.
- Inspect `graphify-out/graph.json` to evaluate module blast radius before making structural modifications.

## 2. Long-Term Memory & Rules (memory/ Obsidian Vault)
- AT SESSION START: Read `memory/INDEX.md` and `memory/rules.md` to load active project constraints, conventions, and state models.
- AT SESSION END / FEATURE COMPLETION: Create or update Architectural Decision Records (ADRs) inside `memory/decisions/` and update `memory/INDEX.md`.

## 3. Execution & Artifact Verification
- Before submitting complex code diffs, verify changes against existing SQL schemas and TypeScript definitions.
- Keep `memory/rules.md` updated whenever new project conventions or state machine constraints are established.