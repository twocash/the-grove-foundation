# Product Brief: Bedrock Compact Mode

**Version:** 1.0
**Status:** ✅ APPROVED - Ready for User Review
**Sprint Target:** bedrock-ui-compact-v1
**Author:** UI/UX Designer Agent
**Date:** 2026-01-17

---

## Executive Summary

The Bedrock admin UI currently consumes significant vertical space with its metrics bar and card sizing, making it feel "fat" on smaller screens. This brief proposes two incremental improvements: (1) a user-toggleable metrics bar and (2) tighter component spacing aligned with our "Liquid Glass" direction—a half-step toward a sleeker, more IDE-like aesthetic.

---

## Problem Statement

### User Pain Points
1. **Vertical space consumption**: The metrics bar (~80px) plus filter toolbar (~100px) consumes ~200px before content appears
2. **Visual weight**: StatCard components feel chunky with 48px icon boxes and generous padding
3. **Small screen usability**: On laptop screens (1366px height), the chrome-to-content ratio is unfavorable
4. **No user control**: Operators cannot customize their workspace density

### Evidence
- Screenshot analysis shows 9 metrics cards in Experience Console consuming significant viewport
- Current styling diverges from FOUNDATION_UI.md spec which calls for "information density" and compact spacing
- User feedback indicates desire for "sleeker" aesthetic

---

## Proposed Solution

### Feature 1: Metrics Bar Toggle

**What:** A UI preference toggle to show/hide the metrics bar across all Bedrock consoles.

**How it works:**
1. Toggle appears in the navigation sidebar footer
2. Preference persists to localStorage (no database round-trip)
3. Affects all consoles using the console-factory pattern
4. Default: visible (preserves current behavior)

**User Value:** Operators gain control over their workspace, reclaiming ~80px of vertical space when metrics aren't needed.

### Feature 2: Half-Step Styling (Liquid Glass Direction)

**What:** Tighten StatCard dimensions to feel more IDE-like without breaking layouts.

**Changes:**
| Element | Current | Proposed | Savings |
|---------|---------|----------|---------|
| Card gap | 16px | 12px | -4px |
| Card vertical padding | 16px | 12px | -8px total |
| Icon box | 48×48px | 40×40px | -8px |
| Card height (approx) | ~80px | ~64px | ~16px |

**User Value:** Denser, more professional aesthetic aligned with VS Code/IDE conventions. More content visible per screen.

---

## Scope

### In Scope (v1.0)
- Metrics bar toggle in BedrockUIContext
- Toggle component in nav sidebar footer
- StatCard dimension adjustments
- localStorage preference persistence

### Explicitly Out of Scope
- Full "Liquid Glass" theme redesign (future sprint)
- Font family changes (requires broader design review)
- Responsive auto-hide behavior
- Compact mode toggle for all spacing (future enhancement)

---

## User Flows

### Flow 1: Hide Metrics Bar
1. Operator navigates to any Bedrock console
2. Operator clicks "Hide Stats" toggle in nav footer
3. Metrics bar slides out/disappears
4. Toggle updates to show "Show Stats" state
5. Preference persists across page refresh and console navigation

### Flow 2: Restore Metrics Bar
1. Operator clicks "Show Stats" toggle
2. Metrics bar slides in/appears
3. Toggle returns to default state

---

## Technical Considerations

### Architecture Alignment
- Extends existing `BedrockUIContext` pattern (same as `inspectorOpen`)
- Uses console-factory's existing conditional rendering
- No new database tables or API endpoints
- Follows established localStorage patterns

### Hybrid Cognition Requirements
- **Local (routine):** N/A - Pure UI preference
- **Cloud (pivotal):** N/A - No AI involvement

### Dependencies
- Existing: `BedrockUIContext`, `console-factory.tsx`, `StatCard.tsx`
- No external dependencies

---

## DEX Pillar Verification

| Pillar | Implementation | Evidence |
|--------|---------------|----------|
| **Declarative Sovereignty** | Toggle is user-controlled preference, not hard-coded | localStorage key, no code change needed to customize |
| **Capability Agnosticism** | Pure UI feature, no model dependency | Works identically regardless of backend |
| **Provenance as Infrastructure** | N/A - UI preference only | User owns their preference |
| **Organic Scalability** | Pattern extends to future preferences | Same approach for compact mode, theme toggles |

---

## Advisory Council Input

### Consulted Advisors
- **Park (feasibility):** ✅ Trivial implementation, extends existing patterns
- **Adams (engagement):** Not applicable (admin UI, not user engagement)
- **Short (UI):** IDE-like density aligns with power-user expectations

### Known Tensions
- **Ship fast vs. ship right:** This is a "half-step" - we're not doing the full Liquid Glass theme, just safe incremental tightening
- **Discoverability:** Toggle in nav footer may not be immediately visible, but admin users are power users who explore

---

## Success Metrics

1. **Adoption:** % of operators who use the toggle within first week
2. **Retention:** Do operators keep metrics hidden or restore them?
3. **Qualitative:** Feedback on "sleeker" feel from design review

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Layout breakage from spacing changes | Low | Medium | Changes are 4-8px, proportional |
| User confusion about missing metrics | Low | Low | Clear toggle label, preference persists |
| Regression in existing consoles | Low | Medium | All changes additive or easily reversible |

**Overall Risk: LOW** - All changes are incremental and reversible.

---

## Implementation Estimate

| Phase | Effort | Files |
|-------|--------|-------|
| Metrics Toggle | ~1 hour | 4 files |
| Styling Tweaks | ~30 min | 1 file |
| Testing | ~30 min | Manual verification |
| **Total** | **~2 hours** | **5 files** |

---

## Appendix: UX Concepts

### Current State (Experience Console)
```
┌─────────────────────────────────────────────────────────────────┐
│ Header                                              [+ New]     │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ ~80px
│ │ 24      │ │ 0       │ │ 0       │ │ 0       │ │ 0       │    │ METRICS
│ │ Total   │ │ System  │ │ Feature │ │ Research│ │ Writer  │    │ BAR
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────────────────────────────┤
│ [Search...                    ] [Filters...] [Sort...]         │ ~100px
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Content area starts here...                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed: With Metrics Hidden
```
┌─────────────────────────────────────────────────────────────────┐
│ Header                                              [+ New]     │
├─────────────────────────────────────────────────────────────────┤
│ [Search...                    ] [Filters...] [Sort...]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Content area gains ~80px vertical space                         │
│                                                                 │
│ More objects visible without scrolling                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Toggle Location (Nav Footer)
```
┌──────────────────┐
│ ☰ Bedrock        │
├──────────────────┤
│ 📊 Dashboard     │
│ 🌱 Nursery       │
│ 🌳 Garden        │
│ 🔬 Lens Workshop │
│ 📝 Prompt...     │
│ ⚙️  Experience   │ ← active
│ ...              │
├──────────────────┤
│ 📈 Hide Stats    │ ← Toggle location
└──────────────────┘
```

### StatCard Before/After

**Before (48×48 icon, p-4):**
```
┌──────────────────────────────┐
│  ┌────────┐                  │
│  │  24px  │  24              │  height: ~80px
│  │  icon  │  Total           │
│  └────────┘                  │
└──────────────────────────────┘
```

**After (40×40 icon, py-3):**
```
┌──────────────────────────────┐
│  ┌──────┐  24                │  height: ~64px
│  │ 20px │  Total             │
│  └──────┘                    │
└──────────────────────────────┘
```

---

## Files to Modify

| File | Change Type | Risk |
|------|-------------|------|
| `src/bedrock/context/BedrockUIContext.tsx` | Add state | Low |
| `src/bedrock/patterns/console-factory.tsx` | Add conditional | Low |
| `src/bedrock/components/MetricsToggle.tsx` | NEW FILE | None |
| `src/bedrock/BedrockWorkspace.tsx` | Wire toggle | Low |
| `src/bedrock/primitives/StatCard.tsx` | Adjust spacing | Low |

---

## Review Checklist

- [x] **PM Review:** Does this solve a real user problem? ✅ APPROVED (2026-01-17)
- [x] **UX Chief Review:** DEX pillar compliance verified? ✅ APPROVED (2026-01-17)
- [x] **Drift Detection:** No references to frozen zones (/foundation, /terminal)? ✅ PASS
- [x] **Accessibility:** Toggle has clear label and keyboard support? ✅ PASS (with conditions)
- [x] **Rollback:** Changes easily reversible? ✅ PASS

---

## PM Review Notes (2026-01-17)

**Verdict:** ✅ APPROVED WITH MINOR RECOMMENDATIONS

**Strengths:**
- Well-articulated problem with evidence
- Appropriately scoped "half-step" approach
- Low risk, high ROI (~2 hours for meaningful UX gain)
- Correct Advisory Council consultation

**Conditions:**
1. Confirm this is polish work, not displacing active sprint commitments
2. Simplify success metrics to: "Gather qualitative feedback from 2-3 operators after 1 week"

**Future Enhancements (not blocking):**
- Keyboard shortcut (`Cmd+Shift+M`) for toggle
- Dev-mode console.log for toggle analytics

---

## UX Chief Review Notes (2026-01-17)

**Verdict:** ✅ APPROVED

### DEX Pillar Assessment

| Pillar | Verdict | Notes |
|--------|---------|-------|
| Declarative Sovereignty | ✅ PASS | localStorage preference is user-controlled, declarative |
| Capability Agnosticism | ✅ PASS | Pure UI, zero model dependencies |
| Provenance as Infrastructure | ✅ PASS | N/A - binary preference, no content attribution needed |
| Organic Scalability | ✅ PASS | Pattern enables future preference toggles |

### Drift Detection

**Result:** ✅ ZERO DRIFT DETECTED

All referenced files are in `/src/bedrock/` namespace:
- `BedrockUIContext.tsx` - v1.0 state pattern
- `console-factory.tsx` - v1.0 composition pattern
- `StatCard.tsx` - v1.0 primitive
- No references to frozen `/foundation` or `/terminal` zones

### Substrate Potential

**Rating:** ADEQUATE

The preference pattern could later enable:
- Agent-suggested workspace optimization
- Cross-session preference sync
- Operator preference profiles

### Conditions for Implementation

1. **Focus states** - MetricsToggle should include `focus:ring-2 focus:ring-[var(--neon-cyan)]/50`
2. **Motion preference** - Respect `prefers-reduced-motion` for animations
3. **Pattern consistency** - Future nav footer toggles should follow same pattern

### Architectural Notes

This brief exemplifies good "half-step" design:
- Extends existing patterns (BedrockUIContext) rather than inventing new ones
- Uses localStorage (user owns data) rather than backend storage
- Maintains backwards compatibility (default: visible)
- Creates substrate for future density controls

**Status:** Ready for user review and implementation handoff.

---

*Prepared by UI/UX Designer Agent for Product Pod review.*
*PM Review: Product Manager Agent (2026-01-17)*
*UX Chief Review: User Experience Chief Agent (2026-01-17)*
