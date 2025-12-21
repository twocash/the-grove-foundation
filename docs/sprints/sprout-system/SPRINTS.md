# Sprint Stories — Sprout System

## Epic 1: Data Model & Storage (Foundation)

### Story 1.1: Create Sprout Type Definitions
**File:** Create `src/core/schema/sprout.ts`
**Task:** Define Sprout interface with full provenance chain
**Exports:** `Sprout`, `SproutStorage`, `SproutStatus`
**Commit:** `feat(schema): add Sprout type definitions`

### Story 1.2: Export Sprout Types
**File:** `src/core/schema/index.ts`
**Task:** Add export for sprout types
**Commit:** `feat(schema): export sprout types`

### Story 1.3: Create Sprout Storage Hook
**File:** Create `hooks/useSproutStorage.ts`
**Task:** Implement localStorage CRUD with sessionId generation
**Exports:** `useSproutStorage`
**Commit:** `feat(hooks): add useSproutStorage hook`

---

## Epic 2: Capture Infrastructure (Core)

### Story 2.1: Extend CommandContext Interface
**File:** `components/Terminal/CommandInput/CommandRegistry.ts`
**Lines:** 12-19
**Task:** Add `getLastResponse` and `getSessionContext` to CommandContext
**Commit:** `feat(commands): extend CommandContext for sprout capture`

### Story 2.2: Create Sprout Capture Hook
**File:** Create `hooks/useSproutCapture.ts`
**Task:** Implement capture logic with provenance collection
**Exports:** `useSproutCapture`
**Depends on:** Story 1.3
**Commit:** `feat(hooks): add useSproutCapture hook`

### Story 2.3: Create /sprout Command
**File:** Create `components/Terminal/CommandInput/commands/sprout.ts`
**Task:** Implement sprout command with --tag and --note flags
**Commit:** `feat(commands): add /sprout command`

### Story 2.4: Register /sprout Command
**File:** `components/Terminal/CommandInput/commands/index.ts`
**Task:** Import and register sproutCommand
**Commit:** `feat(commands): register /sprout command`

### Story 2.5: Wire CommandContext in Terminal
**File:** `components/Terminal.tsx`
**Task:** Pass getLastResponse and getSessionContext to command execution
**Commit:** `feat(terminal): wire extended CommandContext`

---

## Epic 3: Garden Modal (Quick View)

### Story 3.1: Create /garden Command
**File:** Create `components/Terminal/CommandInput/commands/garden.ts`
**Task:** Implement garden command to open modal
**Commit:** `feat(commands): add /garden command`

### Story 3.2: Register /garden Command
**File:** `components/Terminal/CommandInput/commands/index.ts`
**Task:** Import and register gardenCommand
**Commit:** `feat(commands): register /garden command`

### Story 3.3: Create GardenModal Component
**File:** Create `components/Terminal/Modals/GardenModal.tsx`
**Task:** Display session sprouts with Grove styling
**Commit:** `feat(modals): add GardenModal component`

### Story 3.4: Export GardenModal
**File:** `components/Terminal/Modals/index.ts`
**Task:** Add GardenModal to exports
**Commit:** `feat(modals): export GardenModal`

### Story 3.5: Wire GardenModal in Terminal
**File:** `components/Terminal.tsx`
**Task:** Add showGardenModal state, handle garden modal display
**Commit:** `feat(terminal): wire GardenModal`

---

## Epic 4: Stats Integration (Feedback Loop)

### Story 4.1: Create Sprout Stats Hook
**File:** Create `hooks/useSproutStats.ts`
**Task:** Aggregate sprout statistics from storage
**Exports:** `useSproutStats`, `SproutStats`
**Commit:** `feat(hooks): add useSproutStats hook`

### Story 4.2: Add Garden Section to StatsModal
**File:** `components/Terminal/Modals/StatsModal.tsx`
**Task:** Add sprout statistics section with lifecycle view
**Commit:** `feat(stats): add Garden section to StatsModal`

### Story 4.3: Extend useExplorationStats
**File:** `hooks/useExplorationStats.ts`
**Task:** Include sprout count in engagement calculation
**Commit:** `feat(stats): include sprouts in exploration stats`

---

## Epic 5: Documentation (Knowledge Transfer)

### Story 5.1: Create Conceptual Flow Document
**File:** Create `docs/SPROUT_SYSTEM.md`
**Task:** Document the Sprout System for academic audience
**Commit:** `docs: add Sprout System conceptual documentation`

### Story 5.2: Update CLAUDE.md
**File:** `CLAUDE.md`
**Task:** Add Sprout System to sprint history
**Commit:** `docs: update CLAUDE.md with Sprout System sprint`

---

## Commit Sequence

```
1. feat(schema): add Sprout type definitions (Epic 1)
2. feat(schema): export sprout types (Epic 1)
3. feat(hooks): add useSproutStorage hook (Epic 1)
4. feat(commands): extend CommandContext for sprout capture (Epic 2)
5. feat(hooks): add useSproutCapture hook (Epic 2)
6. feat(commands): add /sprout command (Epic 2)
7. feat(commands): register /sprout command (Epic 2)
8. feat(terminal): wire extended CommandContext (Epic 2)
9. feat(commands): add /garden command (Epic 3)
10. feat(commands): register /garden command (Epic 3)
11. feat(modals): add GardenModal component (Epic 3)
12. feat(modals): export GardenModal (Epic 3)
13. feat(terminal): wire GardenModal (Epic 3)
14. feat(hooks): add useSproutStats hook (Epic 4)
15. feat(stats): add Garden section to StatsModal (Epic 4)
16. feat(stats): include sprouts in exploration stats (Epic 4)
17. docs: add Sprout System conceptual documentation (Epic 5)
18. docs: update CLAUDE.md with Sprout System sprint (Epic 5)
```

## Build Gates
- After Epic 1: `npm run build` ✓
- After Epic 2: `npm run build` ✓
- After Epic 3: `npm run build` ✓
- After Epic 4: `npm run build` ✓
- After Epic 5: `npm run build` ✓

## Smoke Test Checklist
- [ ] Type `/sprout` after receiving response → Toast appears
- [ ] Type `/sprout --tag=ratchet` → Sprout tagged correctly
- [ ] Type `/garden` → Modal shows session sprouts
- [ ] Type `/stats` → Garden section visible with counts
- [ ] Refresh page → Sprouts persist
- [ ] Check localStorage → `grove-sprouts` key exists
