# Homepage Redesign Plan

## Goals
- Make the homepage feel like compliance infrastructure, not a SaaS tool.
- Establish authority for compliance officers and manufacturer leadership.
- Signal regulatory literacy to auditors and regulators.
- Shift primary conversion to "Book a Demo" with quiet secondary links.
- Create clear visual hierarchy and breathing room using the "Infra Rhythm" system.

## Design Commitment
DESIGN COMMITMENT: Regulatory Dossier
- Topological choice: Single-column authority layout with a left margin rail and section index, no hero split, no bento grid.
- Risk factor: Oversized typographic statements with minimal decoration and aggressive whitespace.
- Readability conflict: Intentional pauses and sparse sections to slow the reader and increase trust.
- Cliche liquidation: Removed dark mode, removed glowing gradients, removed UI mockups in hero.

## Narrative Flow (Assertion -> Evidence -> Resolution)
1. Hero - Authority block
2. Problem - Legal liability interruption
3. Principles - Structured truths
4. Lifecycle - Technical anchor
5. Regulator view - Comparative clarity
6. Proof artifact - Evidence over UI
7. Compliance flow - System progression
8. Built for - Selective audience
9. Final CTA - Calm resolution

## Section Plan Mapped to Existing Components
1. HeroSection
   - Replace split layout with centered authority block.
   - Remove dashboard mock card and all neon gradients.
   - Add a thin rule and a micro "Regulation coverage" line.
   - Primary CTA becomes "Book a Demo". Secondary links: "Read Documentation" and "See Compliance Model".
2. ProblemSection
   - Left align headline and body to create weight.
   - Move bullets into a narrow column with a hairline rule.
   - Use a subtle red accent only on the word "liability".
3. PrinciplesSection
   - Keep 2x2 grid but restyle as spec blocks with thin borders and zero icons.
   - Neutral background band to separate it from the problem section.
4. LifecycleSection
   - Turn states into a blueprint-like timeline with labels and a quiet caption.
   - Add a single "RECALLED" branch in muted red as the standout anomaly.
5. RegulatorSection
   - Two-column comparison with a vertical divider and no badges.
   - Text only, no icons, no pills.
6. PassportProofSection
   - Keep the single artifact, add a thin header band and a single compliance stamp.
   - Reduce shadows, use a crisp border and minimal radius.
7. ComplianceFlowSection
   - Horizontal flow, increasing typographic weight from left to right.
   - Remove card boxes and use text plus thin rules.
8. AudienceSection
   - Reduce to three audiences, text only, no dots or icons.
9. CTASection
   - Light gray band, no card container.
   - One sentence, one button, one quiet supporting link.

## Visual System
- Background: off-white with a faint paper grain and a subtle grid to create depth without heavy shadows.
- Color: graphite and slate for text, muted blue for primary CTA, restrained green only for success states.
- Geometry: sharp edges, 0 to 2px radius for cards and rules.
- Typography: serif for headings, neutral sans for body. Use a 1.25 to 1.333 scale ratio, 65ch max line length.
- Spacing: 8-point grid, large vertical gaps to enforce the Infra Rhythm cadence.

## Motion and Interaction
- Section reveals on scroll using opacity and translate only.
- CTA micro interaction: slight lift and underline on hover, focus ring visible.
- Diagram line draw for lifecycle section, respects prefers-reduced-motion.
- No glow or neon effects, no heavy shadows.

## Copy and CTA Updates
- Replace "Start Free Trial" with "Book a Demo" everywhere.
- Secondary links: "Read Documentation" and "See Compliance Model".
- Shorten subcopy to one to two lines per section.
- Use fewer adjectives, more legal, declarative phrasing.

## Implementation Steps
1. Update layout and styles in `frontend/components/landing/HeroSection.tsx`.
2. Restyle each section component to match the new layout rules.
3. Adjust `frontend/app/(marketing)/page.tsx` order only if needed.
4. Update CTA copy and links in `frontend/components/landing/cta-section.tsx`.
5. Run a visual pass for hierarchy and spacing consistency.

## Acceptance Checklist
- Primary CTA is "Book a Demo" and visually dominant.
- No dark theme sections remain.
- No bento grids, no hero split, no mesh or neon gradients.
- All sections have a single purpose and clear hierarchy.
- Layout feels like a regulatory document, not a marketing site.
