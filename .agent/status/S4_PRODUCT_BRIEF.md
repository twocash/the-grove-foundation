# Product Brief: S4-SL-TierProgression

**Sprint ID:** S4-SL-TierProgression
**Epic:** Sprout Lifecycle v1
**Priority:** P0 (MVP-critical for lifecycle completion)
**Author:** Product Manager
**Date:** 2026-01-15
**Status:** Awaiting UX Chief Review

---

## Executive Summary

Transform the botanical lifecycle from conceptual metaphor to functional user experience. When users promote a sprout to their Knowledge Commons via "Add to Field," the sprout should visibly advance from `sprout` (🌱) to `sapling` (🌿), completing the first tier progression in the Grove ecosystem.

**The One-Line Goal:** Make the "Explore → Research → Promote" loop feel complete.

---

## Problem Statement

### Current State
- Users capture inspirations that become sprouts
- Research pipeline executes successfully
- Sprout Finishing Room displays rich provenance
- "Add to Field" (US-D005) writes content to RAG

### The Gap
After promotion, nothing visible changes. The sprout remains a sprout forever. Users have no sense of:
- What happened to their promoted content
- Whether the promotion was meaningful
- How knowledge matures in their garden

### User Expectation
> "Explore → Inspiration! → Sprout → Results → **Grow More** or **Move to Garden as 'sapling'**"

The "sapling" transition is missing entirely.

---

## Solution Overview

### Phase 0 Scope (This Sprint)

| Component | Change |
|-----------|--------|
| **TierBadge** | New component displaying emoji tier indicators |
| **GardenTray** | Add badge to each sprout card (bottom-left) |
| **Finishing Room Header** | Add prominent badge next to sprout title |
| **Promotion Action** | Update sprout stage to `established` after RAG write |
| **Visual Feedback** | 300ms subtle transition on tier change |

### Explicitly Out of Scope

| Feature | Reason | Future Phase |
|---------|--------|--------------|
| Auto-advancement (tree/grove) | Requires usage signals | Phase 2 |
| Tier filtering in GardenTray | Adds complexity | Phase 1 |
| Custom tier icons | Emoji-first approach | Phase 5 |
| Multiple sprout selection | Different epic | N/A |
| Refinement loop (agent requeue) | Backend dependency | Path 1 |

---

## Technical Implementation

### Schema Status (No Changes Required)

The existing `SproutStage` type already supports our needs:

```typescript
export type SproutStage =
  | 'tender'      // Initial capture
  | 'rooting'     // Research queued
  | 'branching'   // Research executing
  | 'hardened'    // Research complete (ready for review)
  | 'grafted'     // User added notes/tags
  | 'established' // ← PROMOTED TO RAG (this is "sapling")
  | 'dormant'     // Archived
  | 'withered';   // Failed/expired
```

### Stage-to-Tier Mapping (UI Layer)

| SproutStage | User-Facing Tier | Badge |
|-------------|------------------|-------|
| tender, rooting, branching | sprout | 🌱 |
| hardened, grafted | sprout | 🌱 |
| established | sapling | 🌿 |
| (future: high retrieval) | tree | 🌳 |
| (future: community cited) | grove | 🌲 |

### The Fix (Identified Code Gap)

**File:** `src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx`

```typescript
// Current (broken):
const handlePromote = async (content: string, selectedItems: string[]) => {
  const response = await fetch('/api/knowledge/upload', {...});
  toast.success('Content promoted to Knowledge Commons');
  // ❌ Stage not updated
};

// Fixed:
const handlePromote = async (content: string, selectedItems: string[]) => {
  const response = await fetch('/api/knowledge/upload', {...});
  updateSprout(sprout.id, { stage: 'established' }); // ✅ ADD THIS
  toast.success('Content promoted to Knowledge Commons');
};
```

---

## Component Specification

### TierBadge Component

```typescript
interface TierBadgeProps {
  tier: 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}
```

| Size | Use Case | Emoji Size | Label |
|------|----------|------------|-------|
| sm | GardenTray cards | 14px | Hidden |
| md | Finishing Room header | 18px | Optional |
| lg | Detail views (future) | 24px | Visible |

### Design Tokens (Quantum Glass)

```css
--tier-seed: var(--neon-cyan);      /* #00FFE5 */
--tier-sprout: var(--neon-green);   /* #00FF88 */
--tier-sapling: var(--neon-green);  /* #00FF88 - brighter */
--tier-tree: var(--neon-gold);      /* Future */
--tier-grove: var(--neon-violet);   /* Future */
```

### Animation Specification

| Trigger | Animation | Duration |
|---------|-----------|----------|
| Promotion success | Badge pulse + glow | 300ms |
| Hover | Tooltip fade-in | 150ms |
| Initial render | None (no entrance anim) |

---

## User Stories (High-Level)

| ID | Story | Priority |
|----|-------|----------|
| US-G001 | As an Explorer, I see a tier badge on my sprout cards in GardenTray | P0 |
| US-G002 | As an Explorer, I see a larger tier badge in the Finishing Room header | P0 |
| US-G003 | As an Explorer, when I promote a sprout, its tier changes to sapling | P0 |
| US-G004 | As an Explorer, I see a subtle animation when tier changes | P1 |
| US-G005 | As an Explorer, I can hover on a badge to learn what the tier means | P1 |
| US-G006 | As an Explorer, promoted sprouts show "before/after" preview in action panel | P2 |

---

## Success Metrics

### Functional Success
- [ ] Tier badge visible in GardenTray
- [ ] Tier badge visible in Finishing Room
- [ ] Promotion updates stage to `established`
- [ ] Badge updates without page refresh

### User Understanding (Qualitative)
- Users can explain what "sapling" means after promotion
- Users expect tree/grove tiers in future

### Technical Health
- No increase in localStorage size (stage field already exists)
- No new API calls required
- Component renders in < 16ms

---

## Implementation Timeline

| Week | Deliverable |
|------|-------------|
| 1 | TierBadge component + Storybook isolation |
| 2 | GardenTray integration + snapshot tests |
| 3 | Finishing Room header enhancement |
| 4 | Promotion wiring + stage update |
| 5 | Animation polish + tooltip education |

---

## DEX Alignment (For UX Chief Review)

### Declarative Sovereignty
**Verified:** Tier advancement is user-initiated. Only explicit "Add to Field" action triggers sprout → sapling promotion. No automatic advancement in Phase 0.

**Future consideration:** Tree/grove auto-advancement (based on retrieval signals) should be opt-in or at minimum transparent via notification.

### Capability Agnosticism
**Verified:** Tier system is model-independent. The TierBadge component displays state, not model capabilities. Works whether content was generated by Gemini, Claude, or local models.

### Provenance as Infrastructure
**Verified:** The existing `SproutProvenance` structure captures how the sprout was created. Tier progression adds WHEN it was promoted, complementing the provenance story.

**Enhancement opportunity:** Add `promotedAt: string` timestamp to sprout when stage becomes `established`.

### Organic Scalability
**Verified:** The 5-tier system (seed → sprout → sapling → tree → grove) scales to future phases without redesign:
- Phase 1: Auto-advancement logic
- Phase 2: Tier-based filtering
- Phase 3: Community grove designation
- Phase 5: Custom tier icons

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Sprout schema | ✅ Ready | `stage` field exists |
| localStorage persistence | ✅ Ready | `useSproutStorage` handles it |
| RAG write API | ✅ Ready | Already called by promotion |
| GardenTray component | ✅ Ready | Just needs badge addition |
| Finishing Room modal | ✅ Ready | Header slot available |

**No backend changes required.**

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users don't notice tier change | Low engagement | Animation + tooltip education |
| Emoji rendering inconsistent | Visual bugs | Fallback to text labels |
| Stage update fails silently | Broken loop | Add error boundary + retry |

---

## Open Questions for UX Chief

1. **Timestamp addition:** Should we add `promotedAt` to sprout schema, or is current `stage` sufficient for Phase 0?

2. **Error state:** If RAG write succeeds but stage update fails, what's the UX? (Suggest: Show error, allow retry)

3. **Backward compatibility:** Existing sprouts without explicit stage should map to 'hardened' (reviewed but not promoted). Confirm?

---

## Approval Checklist

- [ ] **Product Manager:** Brief complete, scope defined
- [ ] **UI/UX Designer:** Design spec delivered ✅
- [ ] **UX Chief:** DEX alignment verified
- [ ] **User Story Refinery:** Gherkin acceptance criteria
- [ ] **Foundation Loop:** Execution artifacts generated

---

## Appendix: Design Artifacts

**Designer Deliverables:**
- `docs/sprints/sprout-tier-progression-v1/DESIGN_SPEC.md` (830 lines)
- `docs/sprints/sprout-tier-progression-v1/DESIGN_DECISIONS.md` (1,582 lines)

**Key Decisions from Designer:**
1. Emoji badges over custom SVG (universality, a11y)
2. Quantum Glass tokens (current system, not Living Glass v2)
3. Subtle 300ms animation (not celebration)
4. No filtering in Phase 0
5. Progressive tooltips for tier education
6. Before/after preview in promotion checklist
7. Future-proof component API

---

*Product Brief prepared by Product Manager*
*Sprint: S4-SL-TierProgression | Epic: Sprout Lifecycle v1*
