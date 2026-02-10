# Marketing Layout Centralization

## Goal
Centralize all marketing page sections to a consistent `max-w-6xl` layout, with a centered hero and left-aligned sections, and fix broken section alignment.

## Tasks
- [x] Audit marketing layout components and list alignment/width issues. -> Verify: all affected sections identified.
- [x] Update shared marketing layout containers (header/footer) to `max-w-6xl` and centered alignment. -> Verify: header/footer align with page content width.
- [x] Update landing sections to use consistent `max-w-6xl` containers and hybrid alignment (hero centered, sections left). -> Verify: home sections align to unified center width.
- [x] Fix broken section layouts (offset lists/cards) to align within the centralized grid. -> Verify: no unintended horizontal offsets.
- [x] Update other marketing pages to match the `max-w-6xl` container standard. -> Verify: about/careers/contact pages align with new width.
- [x] Run frontend lint and TypeScript checks. -> Verify: `npm --prefix frontend run lint` and `npx tsc -p frontend/tsconfig.json --noEmit` pass.

## Done When
- [ ] Marketing pages use consistent `max-w-6xl` central containers.
- [ ] Hero is centered; other sections remain left-aligned within the center column.
- [ ] No visual offsets or broken alignment in home sections.
- [ ] Lint and TypeScript checks are green.
