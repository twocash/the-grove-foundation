# Architecture Decision Records: S4-SL-TierProgression

## ADR-001: UI-Layer Tier Mapping

**Status:** Accepted

**Context:**
The existing schema has an 8-stage botanical lifecycle (`SproutStage`), but users need a simpler 5-tier mental model for understanding sprout maturity.

**Decision:**
Create a UI-layer mapping from 8 stages to 5 tiers. Keep the detailed stages in storage, present simplified tiers in UI.

**Rationale:**
- Preserves full lifecycle precision in data
- Provides simple user-facing model
- Mapping is declarative and easily adjustable
- No schema migration required

**Consequences:**
- TierBadge component handles mapping
- All tier logic lives in `stageTierMap.ts`
- Future tier changes only require config updates

**Alternatives Considered:**
1. **Replace stages with tiers in schema** - Rejected: loses lifecycle granularity
2. **Show all 8 stages** - Rejected: too complex for users
3. **Create separate tier field** - Rejected: redundant data

---

## ADR-002: Emoji-First Badge Design

**Status:** Accepted

**Context:**
Need visual indicators for tiers. Options: custom SVG icons, Unicode emoji, or text labels.

**Decision:**
Use Unicode emoji (🌰🌱🌿🌳🌲) as primary tier indicators.

**Rationale:**
- Native OS rendering (no asset loading)
- Universal semantic meaning
- Fast implementation
- Accessible (with aria-labels)
- Easy to change later

**Consequences:**
- Cross-platform rendering varies slightly
- Animation more limited than SVG
- Clear path to SVG upgrade in Phase 5

**Alternatives Considered:**
1. **Custom SVG icons** - Deferred to Phase 5 (Living Glass migration)
2. **Text-only badges** - Rejected: less visual impact
3. **Icon library (Lucide)** - Rejected: no botanical icons available

---

## ADR-003: Optional promotedAt Field

**Status:** Accepted

**Context:**
Need to track when a sprout was promoted to sapling tier for provenance.

**Decision:**
Add `promotedAt?: string` as optional field to Sprout interface.

**Rationale:**
- Optional field = no migration needed
- ISO string format = consistent with other timestamps
- Only set on explicit promotion
- Supports future timeline features

**Consequences:**
- Existing sprouts won't have this field
- UI must handle undefined case
- Can derive "promoted X days ago" in future

**Alternatives Considered:**
1. **Add to stage history array** - Deferred: full history is Phase 2
2. **Required field with null** - Rejected: migration burden
3. **Separate events table** - Rejected: overengineering for MVP

---

## ADR-004: Fail-Soft Promotion Error Handling

**Status:** Accepted

**Context:**
Promotion involves two operations: RAG upload and stage update. Need to handle partial failures.

**Decision:**
If RAG upload succeeds but stage update fails, show warning but don't fail the operation.

**Rationale:**
- Content safety is priority (RAG upload succeeded)
- User can retry tier update
- Preserves user trust
- Avoids confusing "failed but actually saved" state

**Consequences:**
- Need warning toast variant
- Stage may be temporarily out of sync
- User has retry path

**Implementation:**
```typescript
try {
  await ragUpload();
  try {
    updateSprout({ stage: 'established' });
  } catch {
    toast.warning('Content saved, but tier update failed. Please try again.');
  }
} catch {
  toast.error('Failed to promote content');
}
```

**Alternatives Considered:**
1. **Rollback RAG on stage failure** - Rejected: complex, loses user work
2. **Atomic transaction** - Not possible: different storage layers
3. **Fail entire operation** - Rejected: loses saved content

---

## ADR-005: Quantum Glass Token Usage

**Status:** Accepted

**Context:**
TierBadge needs styling that integrates with current design system.

**Decision:**
Use existing Quantum Glass tokens (`--glass-*`, `--card-*`) for TierBadge styling.

**Rationale:**
- Consistent with existing components
- No new token namespace needed
- Easier Living Glass migration later
- Uses established color semantics

**Consequences:**
- Badge inherits current theme
- Must use existing token values
- Phase 5 migration documented

**Token Usage:**
| Element | Token |
|---------|-------|
| Label text | `--glass-text-secondary` |
| Active glow | `--neon-green` |
| Pending state | opacity + grayscale |

**Alternatives Considered:**
1. **New `--tier-*` namespace** - Rejected: unnecessary proliferation
2. **Hardcoded colors** - Rejected: violates DEX
3. **Living Glass tokens** - Deferred to Phase 5

---

## ADR-006: 300ms Subtle Animation

**Status:** Accepted

**Context:**
Need visual feedback when tier changes, but must respect professional context.

**Decision:**
Use 300ms glow animation on tier advancement, with reduced-motion support.

**Rationale:**
- Subtle enough for professional use
- Fast enough to not interrupt workflow
- Respects accessibility preferences
- Provides satisfying feedback

**Consequences:**
- Uses CSS animation (not JS)
- Framer Motion for consistency
- Media query for reduced motion

**Specification:**
```css
@keyframes tier-advance {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
  100% { filter: brightness(1); }
}
duration: 300ms
timing: ease-out
```

**Alternatives Considered:**
1. **Celebration confetti** - Rejected: too playful for professional context
2. **No animation** - Rejected: misses opportunity for satisfaction
3. **Longer animation (1s)** - Rejected: too slow, interrupts flow

---

## ADR-007: Default Tier for Legacy Sprouts

**Status:** Accepted

**Context:**
Existing sprouts captured before S4 don't have explicit stage/tier. Need backward-compatible default.

**Decision:**
Map missing/undefined stage to 'sprout' tier (display as 🌱).

**Rationale:**
- 'sprout' is semantically accurate (captured, not promoted)
- Matches historical behavior expectation
- Read-time migration, not write-time
- No database migration needed

**Consequences:**
- Legacy sprouts show as 🌱
- Promotion still works (updates to 'established')
- Consistent visual experience

**Implementation:**
```typescript
export function stageToTier(stage?: SproutStage): SproutTier {
  if (!stage) return 'sprout'; // Legacy default
  return STAGE_TO_TIER[stage] ?? 'sprout';
}
```

**Alternatives Considered:**
1. **Migrate all sprouts** - Rejected: unnecessary database churn
2. **Default to 'seed'** - Rejected: captured sprouts aren't seeds
3. **Show "unknown" tier** - Rejected: confusing to users

---

## Decision Summary

| ADR | Decision | Impact |
|-----|----------|--------|
| 001 | UI-layer tier mapping | Decouples display from storage |
| 002 | Emoji-first badges | Fast MVP, clear upgrade path |
| 003 | Optional promotedAt | No migration needed |
| 004 | Fail-soft promotion | Content safety prioritized |
| 005 | Quantum Glass tokens | Design system consistency |
| 006 | 300ms animation | Subtle feedback |
| 007 | Legacy default = sprout | Backward compatible |

---

*ADRs created by Foundation Loop v2*
*Sprint: S4-SL-TierProgression*
