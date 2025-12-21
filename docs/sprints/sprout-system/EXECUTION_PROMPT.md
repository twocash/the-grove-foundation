# Execution Prompt — Sprout System Sprint

## Context
The Sprout System transforms the Grove Terminal from a content delivery interface into a content refinement engine. Users can capture valuable LLM responses as "sprouts" with full provenance, view them in a garden modal, and track contribution statistics. This sprint implements MVP functionality using localStorage, with architecture designed for future server-side integration.

## Documentation
All sprint documentation is in `docs/sprints/sprout-system/`:
- `REPO_AUDIT.md` — Repository structure and key locations
- `SPEC.md` — Goals, acceptance criteria, target state
- `ARCHITECTURE.md` — Component relationships and data model
- `DECISIONS.md` — Architectural decision records
- `SPRINTS.md` — Story breakdown with file locations

Component sketches in `docs/sprints/sprout-system/sketches/`:
- `GardenModal.tsx` — Garden modal component
- `StatsModalGardenSection.tsx` — Stats extension
- `useSproutCapture.ts` — Capture hook
- `sproutCommand.ts` — /sprout command

Conceptual documentation:
- `docs/SPROUT_SYSTEM.md` — Academic-focused architecture document

## Repository Intelligence
Before making changes, verify these key locations exist:
- Schema: `src/core/schema/` — Type definitions
- Commands: `components/Terminal/CommandInput/commands/` — Slash commands
- Command Registry: `components/Terminal/CommandInput/CommandRegistry.ts`
- Modals: `components/Terminal/Modals/` — Modal components
- Hooks: `hooks/` — React hooks
- Stats Hook: `hooks/useExplorationStats.ts`
- Stats Modal: `components/Terminal/Modals/StatsModal.tsx`
- Terminal: `components/Terminal.tsx` — Main terminal component

## Execution Order

### Phase 1: Data Model & Storage (Epic 1)
1. Create `src/core/schema/sprout.ts` with Sprout interface per ARCHITECTURE.md
2. Export from `src/core/schema/index.ts`
3. Create `hooks/useSproutStorage.ts` for localStorage CRUD
4. Run `npm run build` — must pass before continuing

### Phase 2: Capture Infrastructure (Epic 2)
1. Extend `CommandContext` in `CommandRegistry.ts`:
   - Add `getLastResponse: () => { text: string; query: string } | null`
   - Add `getSessionContext: () => { personaId, journeyId, hubId, nodeId }`
   - Add `captureSprout: (options?) => boolean`
2. Create `hooks/useSproutCapture.ts` — use sketch as reference
3. Create `components/Terminal/CommandInput/commands/sprout.ts` — use sketch
4. Register in `commands/index.ts`
5. Wire CommandContext in `Terminal.tsx` — pass handlers to command execution
6. Run `npm run build` — must pass before continuing

### Phase 3: Garden Modal (Epic 3)
1. Create `components/Terminal/CommandInput/commands/garden.ts`
2. Register in `commands/index.ts`
3. Create `components/Terminal/Modals/GardenModal.tsx` — use sketch
4. Export from `Modals/index.ts`
5. Add `showGardenModal` state to `Terminal.tsx`
6. Handle 'garden' modal type in command execution
7. Run `npm run build` — must pass before continuing

### Phase 4: Stats Integration (Epic 4)
1. Create `hooks/useSproutStats.ts` — aggregate from storage
2. Import and use in `StatsModal.tsx`
3. Add Garden section to `StatsModal.tsx` — use sketch for layout
4. Optionally extend `useExplorationStats.ts` to include sprout count
5. Run `npm run build` — must pass before continuing

### Phase 5: Documentation (Epic 5)
1. Verify `docs/SPROUT_SYSTEM.md` is in place
2. Update `CLAUDE.md` with sprint completion notes
3. Run final `npm run build`

## Build Verification
Run after each phase:
```bash
npm run build
```
Build must pass before proceeding to next phase.

## Citation Format
When reporting changes, cite as: `path:lineStart-lineEnd`

Example:
- Modified `src/core/schema/sprout.ts:1-45` — Created Sprout interface
- Created `hooks/useSproutCapture.ts` — Implemented capture hook

## Response Format

After each phase:
1. List files modified with line citations
2. Report build status (pass/fail)
3. Note any issues or deviations from plan

After all phases:
1. Summary of all changes
2. Final build status
3. Smoke test checklist results

## Smoke Test Checklist
- [ ] Send a message, receive response
- [ ] Type `/sprout` → Toast "🌱 Sprout planted!" appears
- [ ] Type `/sprout --tag=test` → Sprout has tag
- [ ] Type `/garden` → Modal shows session sprouts
- [ ] Type `/stats` → Garden section visible
- [ ] Refresh page → Sprouts persist in localStorage
- [ ] Check devtools → `grove-sprouts` key exists

## Forbidden Actions
- Do NOT modify server.js or backend code
- Do NOT add new npm dependencies without approval
- Do NOT change existing command behavior
- Do NOT modify narratives.json schema
- Do NOT skip build verification between phases
- Do NOT implement server-side storage (MVP is localStorage only)

## Key Principles
1. **Verbatim preservation** — Sprouts capture exact LLM output, no editing
2. **Full provenance** — Every sprout includes generation context
3. **Zero friction** — /sprout command should feel instant
4. **Forward compatible** — Schema supports future Grove ID integration
5. **Existing patterns** — Follow command/modal/hook patterns in codebase
