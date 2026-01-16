# Specification: S4-SL-TierProgression

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 7: Execution Prompt |
| **Status** | 🟡 In Progress - Creating Artifacts |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-15T12:00:00Z |
| **Next Action** | Create EXECUTION_PROMPT.md |
| **Attention Anchor** | See below |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Tier badges that make the botanical lifecycle visible
- **Success looks like:** User sees sprout → sapling tier change when promoting
- **We are NOT:** Building filtering, auto-advancement, or metrics
- **Current phase:** Creating execution artifacts
- **Next action:** Complete SPRINTS.md and EXECUTION_PROMPT.md

---

## Executive Summary

**Goal:** Make the botanical lifecycle visible and functional in the UI.

**Scope:**
1. Create `TierBadge` component with emoji indicators
2. Display tier badges in GardenTray sprout cards
3. Display tier badge in Finishing Room header
4. Wire "Promote to Sapling" action to update sprout stage
5. Add `promotedAt` timestamp for provenance

**Duration:** 3-5 days estimated

---

## Goals

### Primary Goals

1. **Visual Tier Display** - Users can see which tier each sprout has reached
2. **Promotion Wiring** - "Add to Field" action updates sprout to sapling tier
3. **Provenance Completeness** - Promotion timestamp captured

### Secondary Goals

1. **Educational Tooltips** - Help users understand tier system
2. **Subtle Animation** - Visual feedback on promotion (300ms pulse)

---

## Non-Goals

Explicitly out of scope for this sprint:

| Feature | Deferred To | Rationale |
|---------|-------------|-----------|
| Tier filtering in GardenTray | Phase 1 | Low value at small scale |
| Auto-advancement (tree/grove) | Phase 2 | Requires usage signals |
| Tier metrics dashboard | Phase 2 | Depends on signal infrastructure |
| Custom SVG icons | Phase 5 | Emoji-first for MVP speed |
| Full tier history timeline | Later | Collapsed history is sufficient |

---

## Acceptance Criteria

### AC-1: TierBadge Component

- [ ] Renders correct emoji for each tier (🌰/🌱/🌿/🌳)
- [ ] Supports three sizes (sm: 16px, md: 20px, lg: 24px)
- [ ] Shows optional label text next to emoji
- [ ] Applies pending state styling (40% opacity, grayscale)
- [ ] Applies active state styling (subtle pulse)

### AC-2: GardenTray Integration

- [ ] Each sprout row displays TierBadge
- [ ] Badge positioned right side, before chevron
- [ ] Tier derived from sprout.stage using mapping

### AC-3: Finishing Room Header

- [ ] Header icon is dynamic TierBadge (lg size)
- [ ] Badge reflects current sprout's tier

### AC-4: Promotion Wiring

- [ ] "Add to Field" action sets stage to 'established'
- [ ] Promotion sets `promotedAt` timestamp
- [ ] Toast confirms promotion success
- [ ] Parent component receives updated sprout

### AC-5: Animation

- [ ] 300ms glow animation on tier change
- [ ] Respects prefers-reduced-motion

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Tier display | Pattern 4: Token Namespaces | Use `--card-*` tokens |
| Sprout data | Pattern 7: Object Model | Extend Sprout interface |
| Component | Pattern 6: Surface Architecture | Add to surface/components/ |

## Canonical Source Audit

| Capability Needed | Canonical Home | Action |
|-------------------|----------------|--------|
| Badge styling | `globals.css` `--card-*` tokens | USE |
| Sprout storage | `useSproutStorage` hook | USE |
| Engagement events | `useEngagementBus` | USE |
| Tier display | **NONE** | CREATE `TierBadge` |

---

## Technical Design

### Stage → Tier Mapping

```typescript
// UI-layer mapping (not schema change)
const STAGE_TO_TIER: Record<SproutStage, SproutTier> = {
  'tender': 'seed',
  'rooting': 'seed',
  'branching': 'sprout',
  'hardened': 'sprout',    // Default for legacy
  'grafted': 'sprout',
  'established': 'sapling', // After promotion
  'dormant': 'sprout',      // Archived (retain last tier)
  'withered': 'seed',
};

type SproutTier = 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';
```

### TierBadge Props

```typescript
interface TierBadgeProps {
  tier: SproutTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  status?: 'pending' | 'active' | 'ready';
  tooltip?: string | TierTooltipContent;
  className?: string;
}
```

### Tier Emoji Map

```typescript
const TIER_EMOJI: Record<SproutTier, string> = {
  seed: '🌰',
  sprout: '🌱',
  sapling: '🌿',
  tree: '🌳',
  grove: '🌲',
};
```

---

## DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Tier progression is user-initiated (explicit promotion) |
| **Capability Agnosticism** | Works regardless of which model generated content |
| **Provenance** | `promotedAt` timestamp captures promotion moment |
| **Organic Scalability** | 5-tier system scales to future phases |

---

## Dependencies

### Upstream (Required)

- `src/core/schema/sprout.ts` - Add `promotedAt` field
- `hooks/useSproutStorage.ts` - Already supports updates

### Downstream (Consumers)

- `GardenTray` - Will display TierBadge
- `FinishingRoomHeader` - Will display TierBadge
- `ProvenancePanel` - Will show tier section

---

## Risks

| Risk | Mitigation |
|------|------------|
| Animation performance | Use CSS transforms, not layout changes |
| Emoji rendering | Fall back to text if needed |
| Storage version | Already at v3, no migration needed |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| TierBadge renders correctly | 100% test pass |
| Promotion updates stage | Integration test passes |
| No visual regressions | Baseline snapshots match |

---

*Specification created by Foundation Loop v2*
*Sprint: S4-SL-TierProgression*
