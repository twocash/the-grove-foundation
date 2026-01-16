# Design Wireframes: S7-SL-AutoAdvancement

**Version:** 1.0
**Status:** Draft
**Designer:** UI/UX Designer Agent
**Reviewed by:** UX Chief (pending)
**Sprint:** S7-SL-AutoAdvancement
**EPIC:** Knowledge as Observable System (Phase 3 of 7)

---

## Design Intent

### What Experience Are We Creating?

**Core feeling:** **Trust through transparency.**

Operators should feel **in control** of automatic tier advancement:
- Clear visibility into which rules are active
- Full audit trail showing "why" each advancement occurred
- Confidence to override incorrect advancements without guilt
- Empowerment to refine rules based on observed patterns

Gardeners should feel **validated** when sprouts advance:
- Advancement feels earned (based on community use)
- Criteria are transparent (not mysterious algorithm)
- Progress is visible (clear path to next tier)

**Narrative voice:** "Quality emerges from usage" - Not robotic rule execution, but natural growth observed through community interaction.

---

## Pattern Alignment

### Existing Patterns Used

| Pattern | Source | Application |
|---------|--------|-------------|
| **GroveCard Grid** | FeatureFlagCard.tsx | AdvancementRuleCard follows same structure (status bar → icon/title → content → footer) |
| **Inspector Panel** | FeatureFlagEditor.tsx | AdvancementRuleEditor follows same layout (sections with headers, collapsible areas) |
| **Changelog/Audit** | SystemPromptEditor.tsx | AdvancementHistoryPanel follows changelog pattern (grouped by timestamp, expandable rows) |
| **JSONB Meta+Payload** | All v1.0 configs | advancement_rules table uses same pattern as feature-flag, lifecycle-config |
| **Quantum Glass Tokens** | Foundation v1.0 | --neon-green, --glass-void, Inter font (NOT Living Glass v2) |

### New Patterns Proposed

**None.** All UI components extend existing v1.0 patterns. The only new pattern is the **Criteria Builder** (interactive form for threshold editing), but it follows standard form patterns from SystemPromptEditor.

---

## Wireframes

### Component 1: AdvancementRuleCard (Grid View)

#### Purpose
Display an advancement rule in the ExperienceConsole grid view, showing tier transition, criteria summary, and enable/disable status.

#### Pattern Reference
Follows **FeatureFlagCard** structure exactly:
- 1px status bar (green = enabled, gray = disabled)
- Icon/title section
- Description text
- Visual preview (tier emoji transition)
- Footer badges (criteria count, lifecycle model)
- Footer toggle (enable/disable)

#### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████ (status)  │ ← 1px, green/gray
├─────────────────────────────────────────────────────────────┤
│  ⭐ (favorite)                                              │
│  ┌──────┐                                                   │
│  │ ⬆️   │  Seed to Sprout (Basic)                           │
│  │      │  seed-to-sprout-basic                             │
│  └──────┘                                                   │
│                                                              │
│  Auto-advance sprouts when community usage meets thresholds │
│                                                              │
│  🌰 ────────→ 🌱                (tier transition visual)    │
│                                                              │
│  ┌───────────────┐  ┌────────────────┐                     │
│  │ 2 criteria    │  │ Botanical      │                     │
│  └───────────────┘  └────────────────┘                     │
│                                                              │
│  [Enabled ✓]                  [Last evaluated: 2h ago]      │
└─────────────────────────────────────────────────────────────┘
```

#### States

**1. Enabled Rule (Active)**
```tsx
// Status bar
className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-green-500"

// Icon background
className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20"

// Footer toggle
<div className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
  Enabled ✓
</div>

// Last evaluated timestamp (right side footer)
<div className="text-xs text-[var(--glass-text-muted)]">
  Last evaluated: 2h ago
</div>
```

**2. Disabled Rule (Inactive)**
```tsx
// Status bar
className="bg-gray-500"

// Icon background
className="bg-slate-500/20"

// Footer toggle
<div className="px-2 py-1 rounded-lg bg-slate-500/20 text-slate-400 text-xs font-medium">
  Disabled
</div>

// Last evaluated timestamp
<div className="text-xs text-[var(--glass-text-muted)]">
  Last evaluated: never
</div>
```

**3. Recently Triggered (Highlight)**
```tsx
// Status bar (pulsing animation)
className="bg-green-500 animate-pulse"

// Footer badge with count
<div className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
  Advanced 5 sprouts today
</div>
```

#### Component Breakdown

```tsx
// File: src/bedrock/components/experience/AdvancementRuleCard.tsx

interface AdvancementRuleCardProps {
  rule: AdvancementRuleObject;
  lifecycleModel?: LifecycleModel; // For tier emoji lookup
  recentAdvancements?: number; // Count from last 24h
  onToggle?: (ruleId: string, enabled: boolean) => void;
  onFavorite?: (ruleId: string) => void;
}

export function AdvancementRuleCard({ rule, lifecycleModel, recentAdvancements, onToggle, onFavorite }: AdvancementRuleCardProps) {
  const { payload, meta } = rule;
  const isEnabled = payload.isEnabled;

  // Get tier emojis from lifecycle config
  const fromTierEmoji = lifecycleModel?.tiers.find(t => t.id === payload.fromTier)?.emoji || '❓';
  const toTierEmoji = lifecycleModel?.tiers.find(t => t.id === payload.toTier)?.emoji || '❓';

  // Status color
  const statusColor = isEnabled ? 'bg-green-500' : 'bg-gray-500';
  const iconBg = isEnabled ? 'bg-green-500/20' : 'bg-slate-500/20';

  return (
    <div className="relative rounded-xl bg-[var(--glass-solid)] border border-[var(--glass-border)] overflow-hidden hover:border-[var(--neon-cyan)]/30 transition-colors cursor-pointer">
      {/* Status bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${statusColor}`} />

      {/* Favorite button */}
      <button
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[var(--glass-border)] transition-colors"
        onClick={(e) => { e.stopPropagation(); onFavorite?.(rule.id); }}
      >
        <span className="material-symbols-outlined text-lg text-amber-400">
          {meta.isFavorite ? 'star' : 'star_outline'}
        </span>
      </button>

      <div className="p-4 pt-5">
        {/* Icon and title */}
        <div className="flex items-start gap-3 mb-3 pr-8">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
            <span className="text-2xl">⬆️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
              {meta.title}
            </h3>
            <p className="text-xs text-[var(--glass-text-muted)] font-mono">
              {rule.id}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--glass-text-secondary)] mb-4 line-clamp-2">
          {meta.description || 'No description'}
        </p>

        {/* Tier transition visual */}
        <div className="flex items-center gap-3 mb-4 justify-center py-2">
          <span className="text-3xl">{fromTierEmoji}</span>
          <div className="flex-1 h-px bg-[var(--glass-border)] relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-[var(--glass-solid)]">
              <span className="text-[var(--glass-text-muted)] text-xs">→</span>
            </div>
          </div>
          <span className="text-3xl">{toTierEmoji}</span>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mb-3">
          <div className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
            {payload.criteria.length} criteria
          </div>
          <div className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium">
            {payload.lifecycleModelId}
          </div>
          {recentAdvancements && recentAdvancements > 0 && (
            <div className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              Advanced {recentAdvancements} today
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
          <button
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
              isEnabled
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
            }`}
            onClick={(e) => { e.stopPropagation(); onToggle?.(rule.id, !isEnabled); }}
          >
            {isEnabled ? 'Enabled ✓' : 'Disabled'}
          </button>

          <div className="text-xs text-[var(--glass-text-muted)]">
            {meta.lastEvaluatedAt
              ? `Last evaluated: ${formatRelativeTime(meta.lastEvaluatedAt)}`
              : 'Never evaluated'
            }
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Interaction Notes

**Hover:** Border changes to neon-cyan/30 (follows FeatureFlagCard pattern)

**Click card:** Opens AdvancementRuleEditor in inspector panel

**Click favorite:** Toggles star (local state, persisted to meta.isFavorite)

**Click enable toggle:** Calls onToggle callback, updates payload.isEnabled in Supabase

**Keyboard navigation:**
- Tab to card (focus ring appears)
- Enter/Space to open editor
- Tab to favorite button
- Tab to enable toggle

#### Accessibility Checklist

- [x] Keyboard navigable (tab order: card → favorite → toggle)
- [x] Focus indicators visible (ring-2 ring-[var(--neon-cyan)])
- [x] Screen reader labels:
  - Card: `aria-label="Advancement rule: {title}"`
  - Favorite: `aria-label="Toggle favorite"`
  - Enable toggle: `aria-label="Toggle rule enabled/disabled"`
- [x] Color contrast AA compliant (all text meets 4.5:1 ratio)
- [x] Touch targets 44px minimum (buttons meet spec)

---

### Component 2: AdvancementRuleEditor (Inspector Panel)

#### Purpose
Full-screen editor for creating/editing advancement rules with criteria builder, live preview, and metadata tracking.

#### Pattern Reference
Follows **FeatureFlagEditor** and **SystemPromptEditor** multi-section layout:
- Status banner (if enabled)
- Identity section (name, description, ID)
- Configuration sections (collapsible)
- Live preview
- Metadata footer
- Action buttons

#### Visual Structure

**Overall Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]  Advancement Rule Editor                    [Save] │ ← Header
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🟢 Rule Enabled                                         ││ ← Status banner
│ │ This rule is actively evaluating sprouts during daily   ││   (if enabled)
│ │ batch.                                       [Disable]  ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Identity                                                 ││ ← Section 1
│ │ ───────────────────────────────────────────────────────  ││
│ │ Rule Name                                                ││
│ │ [Seed to Sprout (Basic)                              ]  ││
│ │                                                          ││
│ │ Description                                              ││
│ │ [Auto-advance sprouts when community usage meets...  ]  ││
│ │                                                          ││
│ │ Rule ID: seed-to-sprout-basic (immutable)               ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Tier Transition                                          ││ ← Section 2
│ │ ───────────────────────────────────────────────────────  ││
│ │ From Tier    🌰 [seed      ▼]                           ││
│ │ To Tier      🌱 [sprout    ▼]                           ││
│ │                                                          ││
│ │ Lifecycle Model: [Botanical Growth ▼]                   ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Criteria Builder                                    ▼   ││ ← Section 3
│ │ ───────────────────────────────────────────────────────  ││   (collapsible)
│ │                                                          ││
│ │ All criteria must be met (AND logic):                   ││
│ │                                                          ││
│ │ ┌─────────────────────────────────────────────────────┐││
│ │ │ [retrievals ▼] [>= ▼] [10        ] [×]             │││ ← Criterion row
│ │ └─────────────────────────────────────────────────────┘││
│ │ ┌─────────────────────────────────────────────────────┐││
│ │ │ [citations  ▼] [>= ▼] [3         ] [×]             │││
│ │ └─────────────────────────────────────────────────────┘││
│ │                                                          ││
│ │ [+ Add Criterion]                                        ││
│ │                                                          ││
│ │ Logic Operator: [AND ▼] ⓘ                              ││
│ │   ↳ All criteria must be met                            ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Live Preview                                        ▼   ││ ← Section 4
│ │ ───────────────────────────────────────────────────────  ││   (collapsible)
│ │                                                          ││
│ │ Test rule against sample sprout:                        ││
│ │                                                          ││
│ │ Sprout: "Quantum Basics" (current tier: seed)           ││
│ │ Observable Signals:                                      ││
│ │   • retrievals: 15   ✓ (threshold: >= 10)               ││
│ │   • citations:  5    ✓ (threshold: >= 3)                ││
│ │                                                          ││
│ │ ┌─────────────────────────────────────────────────────┐││
│ │ │ ✅ Would advance to sprout tier                     │││ ← Result
│ │ │                                                      │││
│ │ │ All criteria met (AND logic)                        │││
│ │ └─────────────────────────────────────────────────────┘││
│ │                                                          ││
│ │ [Load Different Sprout]                                 ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Metadata                                                 ││ ← Section 5
│ │ ───────────────────────────────────────────────────────  ││
│ │ Created: Jan 15, 2026 at 3:24 PM                        ││
│ │ Updated: Jan 16, 2026 at 9:15 AM                        ││
│ │ Created By: alex@example.com                            ││
│ │ Last Evaluated: 2 hours ago (2026-01-16 2:00 AM UTC)    ││
│ │ Total Advancements: 15 sprouts                          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Save Changes]       [Duplicate]  [Delete]              ││ ← Footer actions
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### Section 1: Status Banner (Conditional)

**Only shown when rule is enabled:**

```tsx
{isEnabled && (
  <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-green-400 text-lg">
            check_circle
          </span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-green-400 mb-1">
            Rule Enabled
          </h3>
          <p className="text-xs text-[var(--glass-text-secondary)]">
            This rule is actively evaluating sprouts during daily batch runs at 2am UTC.
          </p>
        </div>
      </div>
      <button
        className="px-3 py-1.5 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 text-xs font-medium transition-colors"
        onClick={handleDisable}
      >
        Disable
      </button>
    </div>
  </div>
)}
```

**Disabled state (no banner):**
When rule is disabled, banner is hidden. User can enable via footer toggle or Save button.

#### Section 2: Identity

```tsx
<div className="mb-6 p-4 rounded-xl bg-[var(--glass-void)] border border-[var(--glass-border)]">
  <h2 className="text-sm font-medium text-[var(--glass-text-primary)] mb-4 flex items-center gap-2">
    <span className="material-symbols-outlined text-lg">badge</span>
    Identity
  </h2>

  <div className="space-y-4">
    {/* Rule Name */}
    <div>
      <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
        Rule Name
      </label>
      <input
        type="text"
        className="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder-[var(--glass-text-muted)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors"
        placeholder="e.g., Seed to Sprout (Basic)"
        value={meta.title}
        onChange={(e) => updateMeta({ title: e.target.value })}
      />
    </div>

    {/* Description */}
    <div>
      <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
        Description
      </label>
      <textarea
        className="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder-[var(--glass-text-muted)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors resize-none"
        rows={2}
        placeholder="What does this rule do?"
        value={meta.description}
        onChange={(e) => updateMeta({ description: e.target.value })}
      />
    </div>

    {/* Rule ID (immutable) */}
    <div>
      <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
        Rule ID
      </label>
      <div className="px-3 py-2 rounded-lg bg-[var(--glass-border)] border border-[var(--glass-border)] text-[var(--glass-text-muted)] font-mono text-sm">
        {rule.id}
      </div>
      <p className="text-xs text-[var(--glass-text-muted)] mt-1">
        Immutable identifier (set on creation)
      </p>
    </div>
  </div>
</div>
```

#### Section 3: Tier Transition

```tsx
<div className="mb-6 p-4 rounded-xl bg-[var(--glass-void)] border border-[var(--glass-border)]">
  <h2 className="text-sm font-medium text-[var(--glass-text-primary)] mb-4 flex items-center gap-2">
    <span className="material-symbols-outlined text-lg">trending_up</span>
    Tier Transition
  </h2>

  <div className="space-y-4">
    {/* From Tier */}
    <div>
      <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
        From Tier
      </label>
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {getTierEmoji(payload.fromTier)}
        </span>
        <select
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors"
          value={payload.fromTier}
          onChange={(e) => updatePayload({ fromTier: e.target.value })}
        >
          {lifecycleModel.tiers.map(tier => (
            <option key={tier.id} value={tier.id}>
              {tier.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* To Tier */}
    <div>
      <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
        To Tier
      </label>
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {getTierEmoji(payload.toTier)}
        </span>
        <select
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors"
          value={payload.toTier}
          onChange={(e) => updatePayload({ toTier: e.target.value })}
        >
          {lifecycleModel.tiers.map(tier => (
            <option key={tier.id} value={tier.id}>
              {tier.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Lifecycle Model Reference */}
    <div>
      <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
        Lifecycle Model
      </label>
      <select
        className="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors"
        value={payload.lifecycleModelId}
        onChange={(e) => updatePayload({ lifecycleModelId: e.target.value })}
      >
        {availableModels.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-[var(--glass-text-muted)] mt-1">
        Tier names/emojis come from this lifecycle configuration
      </p>
    </div>
  </div>
</div>
```

#### Section 4: Criteria Builder

```tsx
<div className="mb-6">
  <button
    className="w-full p-4 rounded-xl bg-[var(--glass-void)] border border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/30 transition-colors"
    onClick={() => setIsCriteriaExpanded(!isCriteriaExpanded)}
  >
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium text-[var(--glass-text-primary)] flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">rule</span>
        Criteria Builder
      </h2>
      <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
        {isCriteriaExpanded ? 'expand_less' : 'expand_more'}
      </span>
    </div>
  </button>

  {isCriteriaExpanded && (
    <div className="mt-2 p-4 rounded-xl bg-[var(--glass-void)] border border-[var(--glass-border)]">
      {/* Logic operator header */}
      <div className="mb-4">
        <p className="text-sm text-[var(--glass-text-secondary)] mb-2">
          {payload.logicOperator === 'AND'
            ? 'All criteria must be met:'
            : 'At least one criterion must be met:'}
        </p>
      </div>

      {/* Criteria rows */}
      <div className="space-y-3 mb-4">
        {payload.criteria.map((criterion, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)]"
          >
            {/* Signal type */}
            <select
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-void)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors text-sm"
              value={criterion.signal}
              onChange={(e) => updateCriterion(index, { signal: e.target.value })}
            >
              <option value="retrievals">retrievals</option>
              <option value="citations">citations</option>
              <option value="queryDiversity">queryDiversity</option>
              <option value="utilityScore">utilityScore</option>
            </select>

            {/* Operator */}
            <select
              className="w-20 px-3 py-2 rounded-lg bg-[var(--glass-void)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors text-sm"
              value={criterion.operator}
              onChange={(e) => updateCriterion(index, { operator: e.target.value })}
            >
              <option value=">=">&gt;=</option>
              <option value=">">&gt;</option>
              <option value="==">==</option>
              <option value="<">&lt;</option>
              <option value="<=">&lt;=</option>
            </select>

            {/* Threshold */}
            <input
              type="number"
              className="w-24 px-3 py-2 rounded-lg bg-[var(--glass-void)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors text-sm"
              value={criterion.threshold}
              onChange={(e) => updateCriterion(index, { threshold: parseFloat(e.target.value) })}
              min={0}
              step={criterion.signal === 'queryDiversity' || criterion.signal === 'utilityScore' ? 0.1 : 1}
            />

            {/* Delete button */}
            <button
              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
              onClick={() => removeCriterion(index)}
              aria-label="Remove criterion"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add criterion button */}
      <button
        className="w-full px-4 py-2 rounded-lg border border-dashed border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50 text-[var(--glass-text-muted)] hover:text-[var(--neon-cyan)] transition-colors text-sm font-medium"
        onClick={addCriterion}
      >
        + Add Criterion
      </button>

      {/* Logic operator selector */}
      <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <label className="text-xs text-[var(--glass-text-muted)]">
            Logic Operator:
          </label>
          <select
            className="px-3 py-1.5 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors text-sm"
            value={payload.logicOperator}
            onChange={(e) => updatePayload({ logicOperator: e.target.value })}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          <button
            className="p-1 rounded-lg hover:bg-[var(--glass-border)] transition-colors"
            title="AND: All criteria must be met. OR: At least one criterion must be met."
          >
            <span className="material-symbols-outlined text-[var(--glass-text-muted)] text-sm">
              info
            </span>
          </button>
        </div>
        <p className="text-xs text-[var(--glass-text-muted)] mt-2">
          {payload.logicOperator === 'AND'
            ? '↳ All criteria must be met for advancement'
            : '↳ At least one criterion must be met for advancement'}
        </p>
      </div>
    </div>
  )}
</div>
```

#### Section 5: Live Preview

```tsx
<div className="mb-6">
  <button
    className="w-full p-4 rounded-xl bg-[var(--glass-void)] border border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/30 transition-colors"
    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
  >
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium text-[var(--glass-text-primary)] flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">science</span>
        Live Preview
      </h2>
      <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
        {isPreviewExpanded ? 'expand_less' : 'expand_more'}
      </span>
    </div>
  </button>

  {isPreviewExpanded && (
    <div className="mt-2 p-4 rounded-xl bg-[var(--glass-void)] border border-[var(--glass-border)]">
      <p className="text-sm text-[var(--glass-text-secondary)] mb-4">
        Test rule against sample sprout:
      </p>

      {/* Sample sprout selector */}
      <div className="mb-4">
        <select
          className="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors"
          value={selectedSampleSprout}
          onChange={(e) => setSelectedSampleSprout(e.target.value)}
        >
          {sampleSprouts.map(sprout => (
            <option key={sprout.id} value={sprout.id}>
              {sprout.title} (current tier: {sprout.tier})
            </option>
          ))}
        </select>
      </div>

      {/* Observable signals */}
      <div className="mb-4">
        <p className="text-xs text-[var(--glass-text-muted)] mb-2">
          Observable Signals:
        </p>
        <div className="space-y-2">
          {payload.criteria.map((criterion, index) => {
            const signalValue = sampleSignals[criterion.signal];
            const met = evaluateCriterion(criterion, signalValue);

            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className={met ? 'text-green-400' : 'text-red-400'}>
                  {met ? '✓' : '✗'}
                </span>
                <span className="text-[var(--glass-text-secondary)]">
                  {criterion.signal}: {signalValue}
                </span>
                <span className="text-[var(--glass-text-muted)] text-xs">
                  (threshold: {criterion.operator} {criterion.threshold})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluation result */}
      <div className={`p-4 rounded-lg border ${
        previewResult.shouldAdvance
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <span className={`material-symbols-outlined text-2xl ${
            previewResult.shouldAdvance ? 'text-green-400' : 'text-red-400'
          }`}>
            {previewResult.shouldAdvance ? 'check_circle' : 'cancel'}
          </span>
          <div>
            <p className={`text-sm font-medium mb-1 ${
              previewResult.shouldAdvance ? 'text-green-400' : 'text-red-400'
            }`}>
              {previewResult.shouldAdvance
                ? `Would advance to ${payload.toTier} tier`
                : `Would NOT advance (criteria not met)`}
            </p>
            <p className="text-xs text-[var(--glass-text-muted)]">
              {previewResult.shouldAdvance
                ? `All criteria met (${payload.logicOperator} logic)`
                : `Missing required criteria (${payload.logicOperator} logic)`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
```

#### Section 6: Metadata

```tsx
<div className="mb-6 p-4 rounded-xl bg-[var(--glass-void)] border border-[var(--glass-border)]">
  <h2 className="text-sm font-medium text-[var(--glass-text-primary)] mb-4 flex items-center gap-2">
    <span className="material-symbols-outlined text-lg">info</span>
    Metadata
  </h2>

  <div className="space-y-2 text-sm">
    <div className="flex items-center justify-between">
      <span className="text-[var(--glass-text-muted)]">Created:</span>
      <span className="text-[var(--glass-text-secondary)]">
        {formatDateTime(meta.createdAt)}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-[var(--glass-text-muted)]">Updated:</span>
      <span className="text-[var(--glass-text-secondary)]">
        {formatDateTime(meta.updatedAt)}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-[var(--glass-text-muted)]">Created By:</span>
      <span className="text-[var(--glass-text-secondary)]">
        {meta.createdBy}
      </span>
    </div>
    {meta.lastEvaluatedAt && (
      <div className="flex items-center justify-between">
        <span className="text-[var(--glass-text-muted)]">Last Evaluated:</span>
        <span className="text-[var(--glass-text-secondary)]">
          {formatRelativeTime(meta.lastEvaluatedAt)} ({formatDateTime(meta.lastEvaluatedAt)})
        </span>
      </div>
    )}
    {meta.totalAdvancements !== undefined && (
      <div className="flex items-center justify-between">
        <span className="text-[var(--glass-text-muted)]">Total Advancements:</span>
        <span className="text-[var(--glass-text-secondary)]">
          {meta.totalAdvancements} sprouts
        </span>
      </div>
    )}
  </div>
</div>
```

#### Section 7: Footer Actions

```tsx
<div className="flex items-center justify-between gap-4">
  <button
    className="px-6 py-2.5 rounded-lg bg-[var(--neon-cyan)] text-[var(--glass-void)] hover:bg-[var(--neon-cyan)]/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    onClick={handleSave}
    disabled={!hasChanges || isSaving}
  >
    {isSaving ? 'Saving...' : 'Save Changes'}
  </button>

  <div className="flex items-center gap-2">
    <button
      className="px-4 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] hover:border-[var(--neon-cyan)]/50 transition-colors"
      onClick={handleDuplicate}
    >
      Duplicate
    </button>
    <button
      className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
      onClick={handleDelete}
    >
      Delete
    </button>
  </div>
</div>
```

#### Interaction Notes

**Collapsible sections:** Criteria Builder and Live Preview start collapsed on mobile, expanded on desktop

**Live preview:** Updates in real-time as user edits criteria (debounced 300ms)

**Validation:**
- fromTier and toTier must be different
- At least 1 criterion required
- Threshold must be positive number
- Signal types validated against lifecycle config

**Save behavior:**
- Disabled if no changes
- Shows loading state during save
- Toast notification on success/error

#### Accessibility Checklist

- [x] Keyboard navigable (tab through all form fields)
- [x] Focus indicators visible on all inputs
- [x] Screen reader labels on all form fields
- [x] Error messages announced to screen readers
- [x] Color contrast AA compliant
- [x] Touch targets 44px minimum

---

### Component 3: AdvancementHistoryPanel (Audit Trail)

#### Purpose
Display chronological list of all auto-advancements with full provenance (rule used, signals met, operator overrides).

#### Pattern Reference
Follows **SystemPromptEditor changelog pattern**:
- Grouped by batch run (timestamp)
- Expandable rows for detail view
- Filter/search controls
- Override annotations

#### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Advancement History                                          │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Filter: [Last 7 Days ▼] [All Rules ▼] [Search sprout...]││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Jan 16, 2026 at 2:00 AM UTC (Batch Run)               ▼││ ← Batch group
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ├─ 🌱 Quantum Basics → sprout                               │ ← Event row
│ │  Rule: seed-to-sprout-basic                              │   (expandable)
│ │  retrievals: 15 (>= 10) ✓  citations: 5 (>= 3) ✓         │
│ │                                                           │
│ ├─ 🌿 CRISPR Notes → sapling                               │
│ │  Rule: sprout-to-sapling-advanced                        │
│ │  retrievals: 25 (>= 20) ✓  queryDiversity: 0.8 (>= 0.7) ✓│
│ │                                                           │
│ └─ 🌳 Dark Matter → tree [REVERTED]                        │ ← Override
│    Rule: sapling-to-tree-citation                          │   annotation
│    citations: 25 (>= 20) ✓                                 │
│    ⚠️ Manually reverted by alex@example.com                │
│    Reason: Low utility score despite citations             │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Jan 15, 2026 at 2:00 AM UTC (Batch Run)               ▼││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ├─ 🌱 Research Notes → sprout                               │
│ └─ ... (show more)                                          │
│                                                              │
│ [Load More]                                                  │
└─────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

```tsx
// File: src/bedrock/components/experience/AdvancementHistoryPanel.tsx

interface AdvancementHistoryPanelProps {
  events: AdvancementEvent[];
  onFilter?: (filters: HistoryFilters) => void;
  onLoadMore?: () => void;
}

export function AdvancementHistoryPanel({ events, onFilter, onLoadMore }: AdvancementHistoryPanelProps) {
  const [filters, setFilters] = useState<HistoryFilters>({
    dateRange: 'last-7-days',
    ruleId: 'all',
    searchQuery: '',
  });

  // Group events by batch run
  const groupedEvents = groupByBatchRun(events);

  return (
    <div className="p-4 rounded-xl bg-[var(--glass-void)] border border-[var(--glass-border)]">
      {/* Header */}
      <h2 className="text-sm font-medium text-[var(--glass-text-primary)] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">history</span>
        Advancement History
      </h2>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          className="px-3 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors text-sm"
          value={filters.dateRange}
          onChange={(e) => updateFilters({ dateRange: e.target.value })}
        >
          <option value="last-24h">Last 24 Hours</option>
          <option value="last-7-days">Last 7 Days</option>
          <option value="last-30-days">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>

        <select
          className="px-3 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors text-sm"
          value={filters.ruleId}
          onChange={(e) => updateFilters({ ruleId: e.target.value })}
        >
          <option value="all">All Rules</option>
          {availableRules.map(rule => (
            <option key={rule.id} value={rule.id}>
              {rule.meta.title}
            </option>
          ))}
        </select>

        <div className="flex-1 relative">
          <input
            type="text"
            className="w-full px-3 py-2 pl-10 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder-[var(--glass-text-muted)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors text-sm"
            placeholder="Search sprout..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] text-lg">
            search
          </span>
        </div>
      </div>

      {/* Event groups */}
      <div className="space-y-4">
        {groupedEvents.map(batch => (
          <AdvancementBatchGroup key={batch.timestamp} batch={batch} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          className="w-full mt-4 px-4 py-2 rounded-lg border border-dashed border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50 text-[var(--glass-text-muted)] hover:text-[var(--neon-cyan)] transition-colors text-sm font-medium"
          onClick={onLoadMore}
        >
          Load More
        </button>
      )}
    </div>
  );
}

// Batch group component
function AdvancementBatchGroup({ batch }: { batch: BatchGroup }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      {/* Batch header */}
      <button
        className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/30 transition-colors mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
            schedule
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-[var(--glass-text-primary)]">
              {formatDateTime(batch.timestamp)}
            </p>
            <p className="text-xs text-[var(--glass-text-muted)]">
              {batch.events.length} advancement{batch.events.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
          {isExpanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Event rows */}
      {isExpanded && (
        <div className="space-y-2 ml-4 pl-4 border-l-2 border-[var(--glass-border)]">
          {batch.events.map(event => (
            <AdvancementEventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

// Event row component
function AdvancementEventRow({ event }: { event: AdvancementEvent }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isReverted = event.event_type === 'manual-override' || event.wasReverted;

  return (
    <div
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        isReverted
          ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
          : 'bg-[var(--glass-solid)] border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/30'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Event summary */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">
          {getTierEmoji(event.to_tier)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-[var(--glass-text-primary)] truncate">
              {event.sprout_title}
            </p>
            <span className="text-xs text-[var(--glass-text-muted)]">→</span>
            <span className="text-xs text-[var(--glass-text-secondary)]">
              {event.to_tier}
            </span>
            {isReverted && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">
                REVERTED
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--glass-text-muted)] mb-2">
            Rule: {event.rule_title}
          </p>

          {/* Criteria summary */}
          <div className="flex flex-wrap gap-2">
            {event.criteria_met.map((criterion, index) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                <span className="text-green-400">✓</span>
                <span className="text-[var(--glass-text-secondary)]">
                  {criterion.signal}: {criterion.actual}
                </span>
                <span className="text-[var(--glass-text-muted)]">
                  ({criterion.operator} {criterion.threshold})
                </span>
              </div>
            ))}
          </div>

          {/* Override annotation */}
          {isReverted && (
            <div className="mt-2 pt-2 border-t border-amber-500/30">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-400 text-sm">
                  warning
                </span>
                <div>
                  <p className="text-xs text-amber-400">
                    Manually reverted by {event.operator_email}
                  </p>
                  {event.reason && (
                    <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                      Reason: {event.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
          <p className="text-xs text-[var(--glass-text-muted)] mb-2">
            Signal Values at Evaluation:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(event.signal_values).map(([signal, value]) => (
              <div key={signal} className="flex items-center justify-between text-xs">
                <span className="text-[var(--glass-text-muted)]">
                  {signal}:
                </span>
                <span className="text-[var(--glass-text-secondary)] font-mono">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Interaction Notes

**Click batch header:** Toggles collapse/expand for all events in that batch

**Click event row:** Expands to show full signal values snapshot

**Filtering:** Updates URL query params for deep linking

**Search:** Debounced 300ms, searches sprout title only

**Load more:** Infinite scroll pagination (20 events per page)

#### Accessibility Checklist

- [x] Keyboard navigable (tab through filters, expand/collapse)
- [x] Focus indicators visible
- [x] Screen reader labels:
  - Batch header: `aria-label="Batch run at {timestamp} with {count} advancements"`
  - Event row: `aria-label="Advancement: {sprout} to {tier}"`
- [x] Color contrast AA compliant
- [x] Touch targets 44px minimum

---

### Component 4: Manual Override Modal

#### Purpose
Allow operators to manually change a sprout's tier (override auto-advancement or correct mistakes).

#### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Manual Tier Override                              [×]   ││ ← Modal header
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ Sprout: Dark Matter Theory                                  │
│ Current Tier: 🌳 tree                                       │
│                                                              │
│ Override to:                                                 │
│ [🌿 sapling ▼]                                              │
│                                                              │
│ Reason (optional):                                           │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Low utility score despite high citations             │  │
│ │                                                        │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ This will:                                                   │
│ • Change tier: tree → sapling                               │
│ • Log manual override event                                 │
│ • Keep advancement event for audit trail                    │
│                                                              │
│                    [Cancel]  [Override Tier]                │
└─────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

```tsx
// File: src/bedrock/components/experience/ManualOverrideModal.tsx

interface ManualOverrideModalProps {
  sprout: Sprout;
  currentTier: string;
  availableTiers: TierDefinition[];
  onOverride: (newTier: string, reason?: string) => Promise<void>;
  onClose: () => void;
}

export function ManualOverrideModal({ sprout, currentTier, availableTiers, onOverride, onClose }: ManualOverrideModalProps) {
  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedTier === currentTier) return;

    setIsSubmitting(true);
    try {
      await onOverride(selectedTier, reason);
      onClose();
    } catch (error) {
      console.error('Override failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-[var(--glass-solid)] border border-[var(--glass-border)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
          <h2 className="text-lg font-medium text-[var(--glass-text-primary)]">
            Manual Tier Override
          </h2>
          <button
            className="p-1 rounded-lg hover:bg-[var(--glass-border)] transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Current state */}
          <div>
            <p className="text-sm text-[var(--glass-text-muted)] mb-1">
              Sprout: <span className="text-[var(--glass-text-primary)]">{sprout.title}</span>
            </p>
            <p className="text-sm text-[var(--glass-text-muted)]">
              Current Tier: <span className="text-[var(--glass-text-primary)]">{getTierEmoji(currentTier)} {currentTier}</span>
            </p>
          </div>

          {/* Tier selector */}
          <div>
            <label className="block text-sm text-[var(--glass-text-muted)] mb-2">
              Override to:
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-void)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
            >
              {availableTiers.map(tier => (
                <option key={tier.id} value={tier.id}>
                  {getTierEmoji(tier.id)} {tier.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm text-[var(--glass-text-muted)] mb-2">
              Reason (optional):
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-void)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder-[var(--glass-text-muted)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors resize-none"
              rows={3}
              placeholder="Why is this override necessary?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Impact summary */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-[var(--glass-text-muted)] mb-2">
              This will:
            </p>
            <ul className="space-y-1 text-xs text-[var(--glass-text-secondary)]">
              <li>• Change tier: {currentTier} → {selectedTier}</li>
              <li>• Log manual override event</li>
              <li>• Keep advancement event for audit trail</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--glass-border)]">
          <button
            className="px-4 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] hover:border-[var(--neon-cyan)]/50 transition-colors"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-amber-500 text-[var(--glass-void)] hover:bg-amber-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={selectedTier === currentTier || isSubmitting}
          >
            {isSubmitting ? 'Overriding...' : 'Override Tier'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### Interaction Notes

**Validation:** Override button disabled if new tier = current tier

**Reason field:** Optional but recommended (pre-filled suggestions?)

**Keyboard:** Escape to close, Enter to submit (if valid)

**Focus trap:** Modal captures focus, returns to trigger on close

#### Accessibility Checklist

- [x] Keyboard navigable (tab through fields)
- [x] Focus trap active (Esc to close)
- [x] Screen reader announces modal open
- [x] aria-label on close button
- [x] Color contrast AA compliant
- [x] Touch targets 44px minimum

---

### Component 5: Bulk Rollback Modal

#### Purpose
Allow operators to revert ALL advancements from a specific rule (error recovery).

#### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Bulk Rollback                                       [×] ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ Rule: "seed-to-tree-fast-track"                             │
│ This will revert 50 sprouts:                                │
│                                                              │
│ • From: tree tier                                           │
│ • To: seed tier (original)                                  │
│ • Time window: Last 24 hours                                │
│                                                              │
│ Audit trail will preserve:                                  │
│ • Original advancement events (marked "rolled back")        │
│ • Rollback event (reason, timestamp, operator)             │
│                                                              │
│ Reason:                                                      │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Rule criteria too permissive (retrievals >= 1)        │  │
│ │                                                        │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│                [Cancel]  [Rollback 50 Sprouts]              │
└─────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

```tsx
// File: src/bedrock/components/experience/BulkRollbackModal.tsx

interface BulkRollbackModalProps {
  rule: AdvancementRuleObject;
  affectedCount: number;
  timeWindow: string; // e.g., "Last 24 hours"
  onRollback: (ruleId: string, reason: string) => Promise<void>;
  onClose: () => void;
}

export function BulkRollbackModal({ rule, affectedCount, timeWindow, onRollback, onClose }: BulkRollbackModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for rollback');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRollback(rule.id, reason);
      onClose();
    } catch (error) {
      console.error('Rollback failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-[var(--glass-solid)] border border-[var(--glass-border)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
          <h2 className="text-lg font-medium text-[var(--glass-text-primary)]">
            Bulk Rollback
          </h2>
          <button
            className="p-1 rounded-lg hover:bg-[var(--glass-border)] transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Warning banner */}
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-red-400 text-lg">
                warning
              </span>
              <div>
                <p className="text-sm font-medium text-red-400 mb-1">
                  Irreversible Action
                </p>
                <p className="text-xs text-[var(--glass-text-muted)]">
                  This will revert {affectedCount} sprout{affectedCount !== 1 ? 's' : ''} to their original tier.
                </p>
              </div>
            </div>
          </div>

          {/* Rule info */}
          <div>
            <p className="text-sm text-[var(--glass-text-muted)] mb-2">
              Rule: <span className="text-[var(--glass-text-primary)] font-medium">{rule.meta.title}</span>
            </p>
          </div>

          {/* Impact summary */}
          <div>
            <p className="text-xs text-[var(--glass-text-muted)] mb-2">
              This will revert {affectedCount} sprouts:
            </p>
            <ul className="space-y-1 text-xs text-[var(--glass-text-secondary)] ml-4">
              <li>• From: {rule.payload.toTier} tier</li>
              <li>• To: {rule.payload.fromTier} tier (original)</li>
              <li>• Time window: {timeWindow}</li>
            </ul>
          </div>

          {/* Audit trail preservation */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-[var(--glass-text-muted)] mb-2">
              Audit trail will preserve:
            </p>
            <ul className="space-y-1 text-xs text-[var(--glass-text-secondary)]">
              <li>• Original advancement events (marked "rolled back")</li>
              <li>• Rollback event (reason, timestamp, operator)</li>
            </ul>
          </div>

          {/* Reason (required) */}
          <div>
            <label className="block text-sm text-[var(--glass-text-muted)] mb-2">
              Reason (required):
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-void)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder-[var(--glass-text-muted)] focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)] outline-none transition-colors resize-none"
              rows={3}
              placeholder="Why is this rollback necessary?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--glass-border)]">
          <button
            className="px-4 py-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] hover:border-[var(--neon-cyan)]/50 transition-colors"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? 'Rolling back...' : `Rollback ${affectedCount} Sprouts`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### Interaction Notes

**Validation:** Submit button disabled if reason is empty

**Confirmation:** Consider double-confirmation (type "ROLLBACK" to confirm?)

**Progress:** Show loading state during bulk operation

**Result:** Toast notification with count of rolled-back sprouts

#### Accessibility Checklist

- [x] Keyboard navigable
- [x] Focus trap active
- [x] Screen reader announces warning
- [x] aria-label on close button
- [x] Color contrast AA compliant
- [x] Touch targets 44px minimum

---

## State Variations

### Empty States

#### No Rules Created Yet

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    ⬆️                                        │
│                                                              │
│          No advancement rules yet                            │
│                                                              │
│     Create your first rule to enable automatic tier          │
│     advancement based on observable usage signals.           │
│                                                              │
│               [Create First Rule]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### No Advancement History

```
┌─────────────────────────────────────────────────────────────┐
│ Advancement History                                          │
│                                                              │
│                    📊                                        │
│                                                              │
│          No advancements yet                                 │
│                                                              │
│     Enable a rule and wait for the next batch run at 2am UTC.│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Loading States

#### Rules Loading

```
┌─────────────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████            │ ← Skeleton card
│ ████████████████████████████████████████████████            │
│                                                              │
│ ████████████████████████████████████████████████            │
│ ████████████████████████████████████████████████            │
└─────────────────────────────────────────────────────────────┘
```

#### History Loading

```
┌─────────────────────────────────────────────────────────────┐
│ Advancement History                                          │
│                                                              │
│ Loading recent advancements...                               │
│                                                              │
│ [Spinner animation]                                          │
└─────────────────────────────────────────────────────────────┘
```

### Error States

#### Rule Save Failed

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Save Failed                                              │
│                                                              │
│ Could not save advancement rule. Please try again.           │
│                                                              │
│ [Retry]  [Cancel]                                            │
└─────────────────────────────────────────────────────────────┘
```

#### Batch Evaluation Failed

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Evaluation Error                                         │
│                                                              │
│ Last batch run (Jan 16 2am) failed to complete.             │
│                                                              │
│ Error: Unable to fetch observable signals from Supabase.    │
│                                                              │
│ [View Logs]  [Retry Now]                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Declarative Configuration Points

| Element | Configurable Via | Default | Purpose |
|---------|------------------|---------|---------|
| Status bar colors | `--status-enabled`, `--status-disabled` | green-500, gray-500 | Visual rule status |
| Tier emojis | `lifecycle_configs.payload.models[].tiers[].emoji` | 🌰🌱🌿🌳🌲 | Visual tier identity |
| Batch schedule | `CRON_SCHEDULE` env var | `0 2 * * *` (2am UTC) | When evaluation runs |
| Criteria thresholds | `advancement_rules.payload.criteria[].threshold` | 10, 3, 0.7 | Advancement requirements |
| Logic operator | `advancement_rules.payload.logicOperator` | AND | How criteria combine |
| Rule enable/disable | `advancement_rules.payload.isEnabled` | true | Active/inactive state |
| Toast notifications | `NOTIFICATIONS_ENABLED` env var | true | Email/Slack digests |

---

## Component Registry Integration

```typescript
// File: src/bedrock/config/component-registry.ts

export const EXPERIENCE_TYPE_REGISTRY = {
  'feature-flag': { ... },
  'lifecycle-config': { ... },
  'advancement-rule': {
    label: 'Advancement Rules',
    pluralLabel: 'Advancement Rules',
    card: AdvancementRuleCard,
    editor: AdvancementRuleEditor,
    allowMultipleActive: true, // Multiple rules can be enabled simultaneously
    icon: 'trending_up',
    iconColor: 'text-green-400',
    description: 'Automatic tier advancement based on observable usage signals',
    defaultPayload: {
      fromTier: '',
      toTier: '',
      criteria: [],
      logicOperator: 'AND',
      isEnabled: false,
      lifecycleModelId: '',
    },
    defaultMeta: {
      status: 'draft',
      title: 'New Advancement Rule',
      description: '',
      lastEvaluatedAt: null,
      totalAdvancements: 0,
    },
  },
  // ...
};
```

---

## Hook Integration

```typescript
// File: src/bedrock/hooks/useAdvancementRuleData.ts

export function useAdvancementRuleData() {
  const { data: rules, isLoading, mutate } = useGroveData('advancement-rule');

  const createRule = async (payload: AdvancementRulePayload, meta: Partial<GroveObjectMeta>) => {
    const newRule = await supabase
      .from('advancement_rules')
      .insert({ payload, meta })
      .select()
      .single();

    mutate();
    return newRule;
  };

  const updateRule = async (id: string, updates: Partial<AdvancementRulePayload>) => {
    await supabase
      .from('advancement_rules')
      .update({ payload: updates })
      .eq('id', id);

    mutate();
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await updateRule(id, { isEnabled: enabled });
  };

  const deleteRule = async (id: string) => {
    await supabase
      .from('advancement_rules')
      .delete()
      .eq('id', id);

    mutate();
  };

  return {
    rules,
    isLoading,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
  };
}
```

---

## Design System Standards

### Colors (Quantum Glass v1.0)

```css
/* Status colors */
--status-enabled: #10b981;    /* green-500 */
--status-disabled: #6b7280;   /* gray-500 */
--status-warning: #f59e0b;    /* amber-500 */
--status-error: #ef4444;      /* red-500 */

/* Advancement-specific */
--advancement-success: #10b981;  /* green-500 */
--advancement-override: #f59e0b; /* amber-500 */
--advancement-rollback: #ef4444; /* red-500 */

/* Base tokens (from Quantum Glass) */
--neon-cyan: #06b6d4;
--neon-green: #10b981;
--glass-void: #030712;
--glass-solid: rgba(15, 23, 42, 0.8);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-text-primary: #f8fafc;
--glass-text-secondary: #cbd5e1;
--glass-text-muted: #64748b;
```

### Typography

```css
/* UI text */
font-family: 'Inter', system-ui, sans-serif;

/* Monospace (IDs, signal values) */
font-family: 'JetBrains Mono', monospace;

/* Size scale */
text-xs: 0.75rem;    /* 12px */
text-sm: 0.875rem;   /* 14px */
text-base: 1rem;     /* 16px */
text-lg: 1.125rem;   /* 18px */
```

### Spacing

```css
/* Component padding */
p-4: 1rem;    /* 16px */
p-3: 0.75rem; /* 12px */

/* Gaps */
gap-2: 0.5rem;  /* 8px */
gap-3: 0.75rem; /* 12px */
gap-4: 1rem;    /* 16px */

/* Rounded corners */
rounded-lg: 0.5rem;  /* 8px */
rounded-xl: 0.75rem; /* 12px */
```

### Animations

```css
/* Hover transitions */
transition-colors: transition-property: color, background-color, border-color;
transition-duration: 150ms;

/* Focus ring */
focus:ring-1 ring-[var(--neon-cyan)]

/* Pulse (for recently triggered rules) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## Accessibility Checklist (Overall)

### WCAG AA Compliance

- [x] **Color Contrast:**
  - Text on backgrounds: 4.5:1 minimum
  - Large text (18px+): 3:1 minimum
  - UI components: 3:1 minimum

- [x] **Keyboard Navigation:**
  - All interactive elements focusable (tab order logical)
  - Focus indicators visible (ring-2 ring-[var(--neon-cyan)])
  - No keyboard traps (modals use focus trap with Esc exit)

- [x] **Screen Reader Support:**
  - All buttons/links have aria-labels
  - Form fields have associated labels
  - Error messages announced (aria-live regions)
  - Status changes announced (toast notifications)

- [x] **Touch Targets:**
  - Minimum 44px × 44px for all interactive elements
  - Adequate spacing between targets (8px+ gap)

- [x] **Responsive Design:**
  - Works on mobile (320px+), tablet (768px+), desktop (1024px+)
  - No horizontal scroll
  - Text resizes to 200% without breaking layout

---

## Mobile Adaptations

### Card Grid (Mobile)

```
┌──────────────────────┐
│ ████████████ (status)│
├──────────────────────┤
│ ⭐ ⬆️                │
│ Seed to Sprout       │
│                      │
│ 🌰 ────→ 🌱         │
│                      │
│ [Enabled ✓]         │
└──────────────────────┘
```

- Single column layout (100% width)
- Collapsible sections start collapsed
- Bottom sheet modals (not centered overlays)

### Editor (Mobile)

- Full-screen takeover (no side panel)
- Fixed header with back button
- Criteria builder rows stack vertically
- Save button sticky to bottom

---

*Design Wireframes for S7-SL-AutoAdvancement*
*Pattern: Quantum Glass v1.0 + ExperienceConsole Factory*
*Foundation Loop v2*
