# Deep Research Plan: Battery Codebase Analysis

## Objective
Conduct comprehensive deep research on `services/battery-api` (Go backend) and `apps/battery-web` (Next.js frontend) to identify:
1. Code quality issues
2. Bugs and potential bugs
3. Missing features / incomplete implementations
4. Unused / dead code
5. Extra / redundant / unnecessary things

## Route: C (File-Only Research)
No external search. All analysis based on source code files only.

## Dimensions (10+)

1. **battery-api Architecture & Code Quality** — Go code structure, package organization, error handling, logging, concurrency patterns, code duplication
2. **battery-web Architecture & Code Quality** — React/Next.js structure, component organization, state management, TypeScript strictness, performance patterns
3. **Security Issues** — Auth patterns, input validation, SQL injection risks, XSS risks, secret handling, middleware gaps
4. **Bugs & Anti-patterns** — Logic errors, race conditions, nil pointer risks, error swallowing, resource leaks, incorrect HTTP status codes
5. **Database & Schema Issues** — Migration quality, missing indexes, schema inconsistencies, down migration completeness
6. **API Design & Consistency** — REST conventions, OpenAPI alignment, handler consistency, DTO patterns, response standardization
7. **Frontend Bugs & Issues** — React hooks misuse, memory leaks, race conditions, form validation gaps, API integration bugs
8. **Unused / Dead Code** — Unreferenced functions, unused imports, dead components, orphaned files, unreachable code
9. **Missing Features / Incomplete Implementations** — TODO comments, stubbed functions, placeholder UI, unimplemented handlers
10. **Extra / Redundant Things** — Duplicate logic, unnecessary abstractions, over-engineering, redundant dependencies, unused packages
11. **Test Quality & Coverage** — Test completeness, mock quality, assertion patterns, missing test cases
12. **Configuration & DevOps** — Environment handling, build configs, dependency management, deployment concerns

## Execution
- Phase F: File inventory (done)
- Phase 3-F: 4 parallel deep-dive agents, one per dimension cluster
- Phase 4: Cross-verification by orchestrator
- Phase 6: Insight extraction
- Phase 7: Report writing via report-writing skill → docx

## Output Directory
`D:/ExportReady-Battery/Battery DPP/research/`
