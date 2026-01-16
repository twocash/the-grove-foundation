# Sprint Breakdown: S4-SL-TierProgression

## Overview

| Metric | Value |
|--------|-------|
| **Total Epics** | 5 |
| **Total Stories** | 8 |
| **Estimated Duration** | 3-5 days |
| **P0 Stories** | 5 |
| **P1 Stories** | 3 |

---

## Epic 1: Component Foundation

### Attention Checkpoint

Before starting this epic, verify:
- [ ] SPEC.md Live Status shows Phase 8: Execution
- [ ] Developer has run `/grove-execution-protocol` for contract
- [ ] No blocking issues

---

### Story 1.1: TierBadge Component (US-G001)

**Priority:** P0
**Complexity:** S (< 1 day)

**Task:**
Create reusable TierBadge component with emoji indicators.

**Files to Create:**
- `src/surface/components/TierBadge/TierBadge.types.ts`
- `src/surface/components/TierBadge/TierBadge.config.ts`
- `src/surface/components/TierBadge/stageTierMap.ts`
- `src/surface/components/TierBadge/TierBadge.tsx`
- `src/surface/components/TierBadge/index.ts`

**Tests:**
- Unit: `tests/unit/TierBadge.test.tsx`
- Visual: Snapshot of all tier/size combinations

**Acceptance:**
```gherkin
Scenario: TierBadge renders correct emoji for each tier
  Given the TierBadge component is rendered
  When I pass tier="sapling"
  Then the component displays 🌿

Scenario: TierBadge applies pending state
  Given status="pending"
  Then the emoji appears at 40% opacity with grayscale
```

---

## Epic 2: Schema Extension

### Attention Checkpoint

Before starting this epic, verify:
- [ ] Epic 1 complete
- [ ] TierBadge tests pass
- [ ] Goal alignment confirmed

---

### Story 2.1: Add promotedAt Field

**Priority:** P0
**Complexity:** S (< 30 min)

**Task:**
Add optional `promotedAt?: string` field to Sprout interface.

**Files to Modify:**
- `src/core/schema/sprout.ts` (add field after line 99)

**Tests:**
- Type check: TypeScript compiles
- No runtime tests needed (optional field)

**Acceptance:**
```gherkin
Scenario: promotedAt field accepts ISO string
  Given I update a sprout with promotedAt
  When I set promotedAt to "2026-01-15T12:00:00Z"
  Then the field is stored correctly
```

---

## Epic 3: Promotion Wiring

### Attention Checkpoint

Before starting this epic, verify:
- [ ] Epic 2 complete
- [ ] Schema field added
- [ ] This is the critical path fix

---

### Story 3.1: Wire Promotion to Stage Update (US-G005)

**Priority:** P0 (Critical Path)
**Complexity:** S

**Task:**
Fix handlePromote in ActionPanel to update sprout stage.

**Files to Modify:**
- `src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx`

**Key Change (Lines 47-68):**
```typescript
// After successful RAG upload:
updateSprout(sprout.id, {
  stage: 'established',
  promotedAt: new Date().toISOString(),
});
```

**Tests:**
- Integration: Promotion flow updates stage
- E2E: `tests/e2e/tier-progression.spec.ts`

**Acceptance:**
```gherkin
Scenario: Successful promotion updates sprout stage
  Given I have a sprout with stage "hardened"
  When I click "Promote to Sapling"
  And the RAG upload succeeds
  Then sprout.stage becomes "established"
  And sprout.promotedAt is set
```

---

## Epic 4: UI Integration

### Attention Checkpoint

Before starting this epic, verify:
- [ ] Epics 1-3 complete
- [ ] Promotion wiring tested
- [ ] TierBadge component ready

---

### Story 4.1: GardenTray Tier Badge (US-G002)

**Priority:** P0
**Complexity:** S

**Task:**
Add TierBadge to sprout rows in GardenTray.

**Files to Modify:**
- `src/explore/components/GardenTray/SproutRow.tsx`

**Tests:**
- Visual: Snapshot with tier badge
- E2E: Badge visible in tray

**Acceptance:**
```gherkin
Scenario: GardenTray shows tier badges
  Given I have sprouts with different stages
  When I view the GardenTray
  Then each row displays the correct TierBadge
```

---

### Story 4.2: Finishing Room Header Badge (US-G003)

**Priority:** P0
**Complexity:** S

**Task:**
Replace static 🌱 with dynamic TierBadge in header.

**Files to Modify:**
- `src/surface/components/modals/SproutFinishingRoom/FinishingRoomHeader.tsx`

**Tests:**
- Visual: Header shows correct tier
- E2E: Tier updates after promotion

**Acceptance:**
```gherkin
Scenario: Header reflects current tier
  Given I open a sapling sprout
  When I view the Finishing Room header
  Then I see 🌿 (sapling tier badge)
```

---

### Story 4.3: Provenance Panel Tier Section (US-G004)

**Priority:** P1
**Complexity:** M

**Task:**
Add Lifecycle section to ProvenancePanel.

**Files to Modify:**
- `src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx`

**Tests:**
- Visual: Lifecycle section visible
- Shows promotedAt when available

**Acceptance:**
```gherkin
Scenario: Provenance shows tier history
  Given a sprout was promoted on 2026-01-15
  When I view the Provenance panel
  Then I see "Sapling" tier badge
  And I see "Promoted Jan 15, 2026"
```

---

## Epic 5: Animation & Polish

### Attention Checkpoint

Before starting this epic, verify:
- [ ] All P0 stories complete
- [ ] Core functionality working
- [ ] Tests pass

---

### Story 5.1: Promotion Animation (US-G007)

**Priority:** P1
**Complexity:** S

**Task:**
Add 300ms glow animation on tier change.

**Files to Modify:**
- `src/surface/components/TierBadge/TierBadge.tsx`

**Tests:**
- Accessibility: Respects prefers-reduced-motion
- Visual: Animation triggers on tier change

**Acceptance:**
```gherkin
Scenario: Animation plays on tier advancement
  Given I promote a sprout
  When the tier changes to sapling
  Then the badge pulses for 300ms

Scenario: Animation respects reduced motion
  Given prefers-reduced-motion is enabled
  When the tier changes
  Then no animation plays
```

---

### Story 5.2: Tier Tooltips (US-G008)

**Priority:** P1
**Complexity:** S

**Task:**
Add educational tooltips explaining each tier.

**Files to Modify:**
- `src/surface/components/TierBadge/TierBadge.config.ts`
- `src/surface/components/TierBadge/TierBadge.tsx`

**Tests:**
- Accessibility: Tooltip accessible via keyboard
- Content: Correct explanation per tier

**Acceptance:**
```gherkin
Scenario: Tooltip explains tier meaning
  Given I hover over a sapling badge
  Then I see "Sapling: Promoted to Knowledge Commons"
```

---

## Build Gates

After each epic, run:

```bash
# Type check
npx tsc --noEmit

# Unit tests
npm test

# E2E tests (if applicable)
npx playwright test tests/e2e/tier-*.spec.ts
```

---

## Commit Sequence

| Order | Commit Message | Stories |
|-------|----------------|---------|
| 1 | `feat(tier): create TierBadge component` | US-G001 |
| 2 | `feat(schema): add promotedAt field to Sprout` | Schema |
| 3 | `fix(promote): update sprout stage on promotion` | US-G005 |
| 4 | `feat(tray): add tier badges to GardenTray` | US-G002 |
| 5 | `feat(room): dynamic tier badge in header` | US-G003 |
| 6 | `feat(provenance): add lifecycle section` | US-G004 |
| 7 | `feat(tier): add promotion animation` | US-G007 |
| 8 | `feat(tier): add educational tooltips` | US-G008 |

---

## Summary Table

| Story ID | Title | Priority | Complexity | Epic |
|----------|-------|----------|------------|------|
| US-G001 | TierBadge Component | P0 | S | 1 |
| Schema | promotedAt Field | P0 | S | 2 |
| US-G005 | Promotion Stage Update | P0 | S | 3 |
| US-G002 | GardenTray Badge | P0 | S | 4 |
| US-G003 | Header Badge | P0 | S | 4 |
| US-G004 | Provenance Section | P1 | M | 4 |
| US-G007 | Animation | P1 | S | 5 |
| US-G008 | Tooltips | P1 | S | 5 |

---

*Sprint breakdown created by Foundation Loop v2*
