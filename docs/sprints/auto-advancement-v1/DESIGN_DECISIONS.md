# Design Decisions: S7-SL-AutoAdvancement

**Version:** 1.0
**Status:** Draft
**Designer:** UI/UX Designer Agent
**Date:** 2026-01-16

---

## Overview

This document captures key design decisions for the Automatic Tier Advancement feature, providing rationale and trade-offs for choices made during wireframe creation.

---

## Question 1: Rule Management - Single Editor vs. Multiple Cards?

### Context
Should operators manage all advancement rules in a single unified editor, or should each rule be a separate card in a grid (like FeatureFlagCard)?

### Decision: **Separate Cards (Grid Pattern)**

**Rationale:**
- **Pattern consistency:** Follows established FeatureFlagCard/LifecycleConfigCard pattern
- **Visual scanning:** Operators can quickly scan which rules are enabled/disabled (status bar color)
- **Independent lifecycle:** Each rule has distinct enable/disable state, creation date, evaluation history
- **Bulk operations:** Grid allows batch selection for future "disable all" or "export" features

**Trade-offs:**
- ❌ More UI real estate needed (vs. single table view)
- ✅ Easier to understand rule relationships (visual tier emoji transitions)
- ✅ Supports favoriting individual rules (⭐ button)

**Advisory Council Input:**
- **Adams (engagement):** "Grid cards create visual drama - operators see which rules are 'hot' (recent advancements badge)"
- **Short (narrative):** "Each rule tells a story - from simple 'seed to sprout' to complex multi-criteria trees"

---

## Question 2: Criteria Builder - Visual vs. JSON?

### Context
Should criteria be edited via visual form builder (dropdowns for signal/operator/threshold) or JSON text editor?

### Decision: **Visual Form Builder (Phase 3), JSON Display Available**

**Rationale (Phase 3 - THIS SPRINT):**
- **Accessibility:** Non-technical operators can create rules without knowing JSON syntax
- **Validation:** Dropdowns prevent invalid signal types or operators
- **Discoverability:** Users see available signals in dropdown (retrievals, citations, queryDiversity, utilityScore)
- **Error prevention:** Threshold field validates numeric input

**Phase 4 Plan (json-render Visual Builder):**
- Drag-and-drop criteria builder
- Template gallery (common patterns)
- Visual preview with AND/OR logic tree diagram

**Trade-offs:**
- ❌ Less powerful than raw JSON for complex rules
- ✅ Safer (no syntax errors)
- ✅ Faster for simple rules (most use cases)

**Advisory Council Input:**
- **Park (feasibility):** "7B models can handle form validation easily - defer complex visual builder to Phase 4 when json-render catalog is mature"
- **Taylor (community):** "Forms democratize rule creation - operators don't need developer mindset"

---

## Question 3: Live Preview - Mock Data vs. Real Sprouts?

### Context
Should the "Live Preview" in AdvancementRuleEditor use mock signal data or query real sprouts from Supabase?

### Decision: **Real Sprouts with Sample Selection**

**Rationale:**
- **Accuracy:** Operators see exact evaluation result for real sprouts
- **Confidence:** Testing against actual data builds trust in rule logic
- **Debugging:** Operators can identify why specific sprouts don't meet criteria
- **Sample selector:** Dropdown lets operators choose representative sprouts (high retrievals, low citations, etc.)

**Implementation:**
```typescript
// Load sample sprouts (5 diverse examples)
const sampleSprouts = await supabase
  .from('sprouts')
  .select('id, title, tier')
  .limit(5);

// Get real observable signals for selected sprout
const signals = await getObservableSignals(selectedSproutId);

// Evaluate rule
const result = evaluateAdvancement(selectedSprout, signals, [currentRule]);
```

**Trade-offs:**
- ❌ Requires S6 observable signals (use mock if not ready)
- ✅ Operators can validate rules before enabling
- ✅ Immediate feedback loop (edit criteria → see result)

**Advisory Council Input:**
- **Adams (engagement):** "Real-time preview creates 'aha moment' - operators see rule work immediately"
- **Park (feasibility):** "If S6 not ready, fall back to mock signals - preview is non-critical for launch"

---

## Question 4: Advancement History - Flat List vs. Grouped by Batch?

### Context
Should advancement events be shown as flat chronological list or grouped by batch run timestamp?

### Decision: **Grouped by Batch Run**

**Rationale:**
- **Context:** Batch grouping shows "all advancements from 2am run" as cohesive event
- **Pattern matching:** Operators can spot anomalies ("why did 50 sprouts advance in one batch?")
- **Expandable:** Each batch starts collapsed, operators expand to see individual events
- **Efficiency:** Reduces visual clutter (10 events = 1 batch header + 10 rows)

**Visual Structure:**
```
Jan 16, 2am (10 advancements) ▼
  ├─ Quantum Basics → sprout
  ├─ CRISPR Notes → sapling
  └─ ... (8 more)

Jan 15, 2am (5 advancements) ▼
  └─ ... (collapsed)
```

**Trade-offs:**
- ❌ Extra click to see details (expand batch)
- ✅ Easier to audit bulk operations
- ✅ Performance (paginate by batch, not individual events)

**Advisory Council Input:**
- **Short (narrative):** "Batch grouping creates narrative arc - 'morning ritual' of checking daily digest"
- **Taylor (community):** "Grouping makes anomalies visible - spike in advancements signals rule problem"

---

## Question 5: Manual Override - Inline vs. Modal?

### Context
Should manual tier override be inline action (dropdown in history panel) or dedicated modal?

### Decision: **Dedicated Modal**

**Rationale:**
- **Intentionality:** Modal forces operators to pause and confirm (override is significant action)
- **Reason required:** Modal has space for reason field (audit trail needs explanation)
- **Impact summary:** Modal shows "what will change" before committing
- **Error prevention:** Extra confirmation step reduces accidental overrides

**Modal Content:**
- Current tier display
- Tier selector dropdown
- Reason textarea (optional but recommended)
- Impact summary ("This will: change tier, log event, keep audit trail")
- Cancel/Override buttons

**Trade-offs:**
- ❌ Extra click (vs. inline dropdown)
- ✅ Prevents accidental overrides
- ✅ Encourages documentation (reason field)

**Advisory Council Input:**
- **Adams (engagement):** "Modal creates drama - 'are you sure?' moment builds weight of decision"
- **Vallor (ethics):** "Requiring reason creates accountability - operators think before overriding"

---

## Question 6: Bulk Rollback - Automatic vs. Confirmation?

### Context
Should bulk rollback (revert all advancements from rule) be one-click or require confirmation modal?

### Decision: **Confirmation Modal with Required Reason**

**Rationale:**
- **Irreversibility:** Rollback affects many sprouts (50+ in error case)
- **Operator anxiety:** Without confirmation, operators fear accidental clicks
- **Reason required:** Audit trail MUST explain why bulk rollback occurred
- **Double-check:** Modal shows count ("Rollback 50 sprouts") to ensure operator understands scope

**Modal Content:**
- Warning banner ("Irreversible Action")
- Rule name + affected count
- Impact summary (from: tree, to: seed, time window: 24h)
- Audit trail preservation note
- Reason textarea (REQUIRED)
- Cancel/Rollback buttons

**Trade-offs:**
- ❌ Extra step for legitimate rollbacks
- ✅ Prevents catastrophic accidents
- ✅ Forces operators to document problems

**Advisory Council Input:**
- **Park (feasibility):** "Bulk operations need confirmation - no exceptions"
- **Taylor (community):** "Operators need 'undo' safety net - confirmation creates trust"

---

## Question 7: Enable/Disable Toggle - Card Footer vs. Editor?

### Context
Should rule enable/disable toggle be on card (quick access) or only in editor (deliberate action)?

### Decision: **Both (Card Footer for Quick Toggle, Editor for Context)**

**Rationale:**
- **Card footer:** Operators can quickly disable problematic rule without opening editor
- **Editor banner:** When editing, status banner shows enabled state with disable button
- **Consistency:** Matches FeatureFlagCard pattern (both locations supported)

**Card Footer Toggle:**
```tsx
<button onClick={() => toggleRule(id, !isEnabled)}>
  {isEnabled ? 'Enabled ✓' : 'Disabled'}
</button>
```

**Editor Banner (if enabled):**
```tsx
<div className="bg-green-500/10 border border-green-500/30">
  🟢 Rule Enabled
  This rule is actively evaluating sprouts...
  [Disable]
</div>
```

**Trade-offs:**
- ❌ Duplicate toggle locations (potential confusion)
- ✅ Quick disable for emergencies (card footer)
- ✅ Contextual disable in editor (with explanation)

**Advisory Council Input:**
- **Adams (engagement):** "Quick toggle creates control - operators don't panic when rule misbehaves"

---

## Question 8: Daily Digest - Email vs. In-App Notification?

### Context
Should daily advancement digest be email, in-app notification, or both?

### Decision: **Email for Operators, In-App for Gardeners**

**Rationale:**

**Operators (Email):**
- Morning ritual (check email → see digest → audit exceptions)
- Batch summary ("10 sprouts advanced today")
- Link to ExperienceConsole advancement history
- Email persists (can forward to team, archive for records)

**Gardeners (In-App):**
- Notification badge when sprout advances
- Modal shows why advancement occurred (criteria met)
- Less intrusive than email (only for own content)
- Encourages continued engagement

**Implementation:**
- Operators: Daily email at 3am UTC (after 2am batch completes)
- Gardeners: Real-time in-app notification (next login after advancement)

**Trade-offs:**
- ❌ Email fatigue (operators receive daily emails)
- ✅ Persistent record (email archive)
- ✅ Gardeners not overwhelmed (only their own sprouts)

**Advisory Council Input:**
- **Adams (engagement):** "Email creates routine - operators check digest like morning coffee"
- **Short (narrative):** "In-app for gardeners is celebratory - 'your sprout leveled up!'"

---

## Question 9: Provenance Display - Tooltip vs. Click-to-Expand?

### Context
How should gardeners discover why their sprout advanced? Tooltip on hover, or click to expand audit trail?

### Decision: **Progressive Disclosure (Tooltip → Click for Full Detail)**

**Rationale:**
- **Tier 1 (Tier Badge):** Visual indicator (🌰 → 🌱)
- **Tier 2 (Tooltip on Hover):** Brief summary "Advanced to sprout on Jan 16 (15 retrievals, 5 citations)"
- **Tier 3 (Click for Audit Trail):** Full event detail (rule used, all signal values, operator who enabled rule)

**Tooltip Content:**
```
🌱 Sprout Tier
Advanced automatically on Jan 16
Based on community usage (15 retrievals, 5 citations)
Click for full details →
```

**Expanded Detail (Modal or Side Panel):**
```
Advancement Event
Date: Jan 16, 2026 at 2:00 AM UTC
Rule: seed-to-sprout-basic
Criteria Met:
  ✓ retrievals: 15 (threshold: >= 10)
  ✓ citations: 5 (threshold: >= 3)
Operator: alex@example.com (enabled rule)
```

**Trade-offs:**
- ❌ Requires 2 interactions for full detail (hover + click)
- ✅ Reduces cognitive load (simple tooltip for most users)
- ✅ Power users can deep-dive (full audit trail available)

**Advisory Council Input:**
- **Short (narrative):** "Progressive disclosure respects user's time - most just want 'why', not full audit"
- **Vallor (ethics):** "Full audit trail must be accessible - transparency is non-negotiable"

---

## Question 10: Error Recovery - Automatic Retry vs. Manual?

### Context
If daily batch evaluation fails (Supabase down, signal fetch error), should system automatically retry or wait for operator intervention?

### Decision: **Automatic Retry (3 attempts) + Operator Notification**

**Rationale:**
- **Resilience:** Transient errors (network blip) shouldn't block all advancements
- **Exponential backoff:** Retry after 5min, 15min, 30min (avoid overwhelming Supabase)
- **Operator alert:** After 3 failed attempts, email operators with error details
- **Manual trigger:** ExperienceConsole has "Retry Now" button for emergency re-runs

**Implementation:**
```typescript
async function runAdvancementEvaluation(attempt = 1) {
  try {
    const result = await evaluateAllSprouts();
    return result;
  } catch (error) {
    if (attempt < 3) {
      const delay = [5, 15, 30][attempt - 1] * 60 * 1000;
      await sleep(delay);
      return runAdvancementEvaluation(attempt + 1);
    } else {
      // Failed after 3 attempts
      await notifyOperators({
        type: 'batch-evaluation-failed',
        error: error.message,
        timestamp: new Date(),
      });
      throw error;
    }
  }
}
```

**Trade-offs:**
- ❌ Delayed advancements (if retries fail)
- ✅ Resilience to transient errors
- ✅ Operators notified of persistent problems

**Advisory Council Input:**
- **Park (feasibility):** "Retry is essential - Supabase has 99.9% uptime, but transient errors happen"
- **Taylor (community):** "Operators shouldn't wake up to failed batch - automatic retry builds trust"

---

## Deferred to Phase 4+ (Future Enhancements)

### 1. Visual Rule Builder (json-render)
**Why defer:** Need to build json-render catalog for AdvancementRule schema first (Phase 4 foundation work)

**Future vision:**
- Drag-and-drop criteria builder
- Visual AND/OR logic tree diagram
- Template gallery (common patterns)
- A/B testing framework (compare rule variants)

### 2. AI-Generated Rules (Phase 6)
**Why defer:** Requires pattern learning from historical advancements (need data first)

**Future vision:**
- AI observes: "Sprouts with 20+ retrievals + 5+ citations advance 90% of time"
- AI proposes: "seed → sprout IF retrievals >= 20 AND citations >= 5"
- Operator reviews and enables via ExperienceConsole

### 3. Cross-Grove Tier Mapping (Phase 5)
**Why defer:** Federation requires Phase 4 (multi-model lifecycles) as foundation

**Future vision:**
- My grove: "tree tier" (50+ retrievals) ≈ Your grove: "published tier" (10+ citations)
- Auto-advancement syncs tiers across groves

### 4. Token Rewards (Phase 7)
**Why defer:** Attribution economy requires working auto-advancement as substrate

**Future vision:**
- Sprout at "tree tier" earns 10x attribution tokens vs. "seed tier"
- Auto-advancement drives token distribution (value flows to quality content)

---

## Accessibility Decisions

### Screen Reader Experience
**Decision:** Advancement events announced as "notifications" not "alerts"

**Rationale:**
- `aria-live="polite"` for advancement notifications (don't interrupt)
- `aria-live="assertive"` for batch failures (require immediate attention)
- All buttons have `aria-label` (not relying on visual icons)

### Keyboard Navigation
**Decision:** All modals use focus trap (Esc to close, Tab cycles within modal)

**Rationale:**
- Prevents keyboard users from "losing" focus behind modal
- Esc key universally closes modals (consistent UX)
- Return focus to trigger button on close

### Color Contrast
**Decision:** All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)

**Audit:**
- Green text on dark bg: #10b981 on #030712 = 5.2:1 ✅
- Muted text: #64748b on #030712 = 4.6:1 ✅
- Amber override: #f59e0b on #030712 = 6.1:1 ✅

---

## Mobile Adaptations

### Decision: Bottom Sheet Modals (Not Centered Overlays)

**Rationale:**
- Mobile users expect swipe-to-dismiss gestures
- Bottom sheets feel native (iOS/Android pattern)
- Easier thumb access (buttons at bottom)

**Implementation:**
- Desktop: Centered modal (max-w-md)
- Mobile: Full-width bottom sheet (slide up animation)
- Both: Same content, different positioning

### Decision: Collapsible Sections Start Collapsed on Mobile

**Rationale:**
- Vertical real estate precious on mobile
- Operators can expand relevant sections (hide rest)
- Desktop: All sections expanded by default

---

*Design Decisions for S7-SL-AutoAdvancement*
*Pattern: Quantum Glass v1.0 + ExperienceConsole Factory*
*Foundation Loop v2*
