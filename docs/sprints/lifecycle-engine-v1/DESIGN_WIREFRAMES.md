# Design Wireframes: S5-SL-LifecycleEngine

## Sprint Context
**Sprint:** S5-SL-LifecycleEngine v1  
**Domain:** Bedrock ExperienceConsole  
**Design System:** Quantum Glass (Foundation theme v1.0)  
**Pattern Reference:** FeatureFlagCard/Editor, SystemPromptEditor  

---

## ⚠️ DESIGN SYSTEM STANDARDS

**USE:** Quantum Glass design tokens (--neon-green, --glass-void, Inter font)  
**DO NOT USE:** Living Glass (v2 vision - post-1.0 only)

See: `docs/sprints/sprout-tier-progression-v1/DESIGN_SYSTEM_STANDARDS.md`

---

## Component 1: LifecycleConfigCard

### Purpose
Display a lifecycle configuration model in the ExperienceConsole grid view.

### Pattern Reference
Follows FeatureFlagCard structure: status bar → icon/title → content → footer badges

### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████ (status)  │ ← 1px status bar
├─────────────────────────────────────────────────────────────┤
│  ⭐ (favorite)                                              │
│  ┌──────┐                                                   │
│  │ 🌲   │  Botanical Growth                                 │
│  │      │  botanical                                        │
│  └──────┘                                                   │
│                                                              │
│  Default lifecycle model for sprout tier progression        │
│                                                              │
│  🌰 🌱 🌿 🌳 🌲                    (tier emoji preview)      │
│                                                              │
│  ┌─────────┐  ┌──────────┐                                 │
│  │ 🔒 System│  │ 5 tiers  │                                 │
│  └─────────┘  └──────────┘                                 │
│                                                              │
│  [Active ✓]          [Botanical]                            │
└─────────────────────────────────────────────────────────────┘
```

### States

#### 1. Active System Model
```tsx
// Status bar: green-500
// Icon background: bg-emerald-500/20
// Status badge: bg-green-500/20 text-green-400 "Active ✓"
// Editable badge: bg-slate-500/20 text-slate-400 "🔒 System"
```

#### 2. Draft Custom Model
```tsx
// Status bar: amber-500
// Icon background: bg-blue-500/20
// Status badge: bg-amber-500/20 text-amber-400 "Draft"
// Editable badge: bg-blue-500/20 text-blue-400 "✏️ Custom"
```

#### 3. Archived Model
```tsx
// Status bar: gray-500
// Icon background: bg-slate-500/20
// Status badge: bg-slate-500/20 text-slate-400 "Archived"
```

### Component Breakdown

```tsx
// Top status bar (1px height, full width)
<div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl ${statusColor}" />

// Favorite button (top-right)
<button className="absolute top-3 right-3 p-1 rounded-lg">
  <span className="material-symbols-outlined text-lg">
    {isFavorite ? 'star' : 'star_outline'}
  </span>
</button>

// Icon and title
<div className="flex items-start gap-3 mb-3 pr-8 mt-2">
  <div className="w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}">
    <span className="text-2xl">{model.tiers[model.tiers.length - 1].emoji}</span>
  </div>
  <div className="flex-1 min-w-0">
    <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
      {model.name}
    </h3>
    <p className="text-xs text-[var(--glass-text-muted)] font-mono">
      {model.id}
    </p>
  </div>
</div>

// Description preview
<p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
  {model.description || 'No description'}
</p>

// Tier emoji preview (horizontal strip)
<div className="flex items-center gap-2 mb-3">
  {model.tiers
    .sort((a, b) => a.order - b.order)
    .map(tier => (
      <span 
        key={tier.id} 
        className="text-xl" 
        title={tier.label}
      >
        {tier.emoji}
      </span>
    ))
  }
</div>

// State indicators
<div className="flex flex-wrap items-center gap-2 mb-3">
  {/* Editable badge */}
  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${editableBadge}`}>
    <span className="material-symbols-outlined text-xs">
      {model.isEditable ? 'edit' : 'lock'}
    </span>
    {model.isEditable ? 'Custom' : 'System'}
  </span>

  {/* Tier count */}
  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
    {model.tiers.length} tiers
  </span>
</div>

// Footer (status + category)
<div className="flex items-center justify-between text-xs">
  <span className={`px-2 py-0.5 rounded-full ${statusBadge}`}>
    {status} {isActive ? '✓' : ''}
  </span>
  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
    {getCategoryLabel(model.id)} // e.g., "Botanical", "Academic"
  </span>
</div>
```

### Data Display Rules

1. **Icon:** Use the highest tier emoji (last in order) as the card icon
2. **Status bar color:**
   - Green: Active model
   - Amber: Draft model
   - Gray: Archived model
3. **Tier preview:** Show all tier emojis in order, max 8 tiers (horizontal scroll if >8)
4. **Editable badge:**
   - 🔒 System (gray) for `isEditable: false`
   - ✏️ Custom (blue) for `isEditable: true`

---

## Component 2: LifecycleConfigEditor

### Purpose
Inspector panel for viewing/editing lifecycle configuration models.

### Pattern Reference
Follows FeatureFlagEditor + SystemPromptEditor structure with multi-section layout.

### Visual Structure

```
┌───────────────────────────────────────────────────────────┐
│ ████ Active Lifecycle Model █████████████████████████     │ ← Status banner (if active)
├───────────────────────────────────────────────────────────┤
│ 🌲  Botanical Growth                           [Active ✓] │ ← Header
│     botanical                                              │
├───────────────────────────────────────────────────────────┤
│                                                            │ ↓ Scrollable content
│ ▼ Model Metadata                                          │
│   ┌──────────────────────────────────────────────┐        │
│   │ Name:    [Botanical Growth          ]        │        │
│   │ Desc:    [Default lifecycle model   ]        │        │
│   │ ID:      botanical (immutable)               │        │
│   │ Editable: 🔒 System Model (read-only)        │        │
│   └──────────────────────────────────────────────┘        │
│                                                            │
│ ▼ Tier Definitions                                        │
│   ┌────┬───────┬─────────┬───────┬────────┐              │
│   │    │ Emoji │  Label  │ Order │        │              │
│   ├────┼───────┼─────────┼───────┼────────┤              │
│   │ 🔒 │  🌰   │  Seed   │   0   │  (lock)│              │
│   │ 🔒 │  🌱   │ Sprout  │   1   │  (lock)│              │
│   │ 🔒 │  🌿   │ Sapling │   2   │  (lock)│              │
│   │ 🔒 │  🌳   │  Tree   │   3   │  (lock)│              │
│   │ 🔒 │  🌲   │  Grove  │   4   │  (lock)│              │
│   └────┴───────┴─────────┴───────┴────────┘              │
│                                                            │
│ ▼ Stage-to-Tier Mappings                                  │
│   ┌──────────────────┬──┬────────────────┐               │
│   │ Stage            │→ │ Tier           │               │
│   ├──────────────────┼──┼────────────────┤               │
│   │ tender           │→ │ [Seed       ▼] │               │
│   │ rooting          │→ │ [Seed       ▼] │               │
│   │ sprouting        │→ │ [Sprout     ▼] │               │
│   │ established      │→ │ [Sapling    ▼] │               │
│   │ flourishing      │→ │ [Tree       ▼] │               │
│   │ mature           │→ │ [Grove      ▼] │               │
│   └──────────────────┴──┴────────────────┘               │
│                                                            │
│ ▼ Metadata (collapsed)                                    │
│                                                            │
├───────────────────────────────────────────────────────────┤
│ [Duplicate]  [Delete]                                     │ ← Footer actions
│ [────────── Active Lifecycle Model ──────────]            │
└───────────────────────────────────────────────────────────┘
```

### Section Breakdown

#### 1. Status Banner (Conditional)

**Active Model:**
```tsx
<div className="flex items-center gap-3 px-4 py-3 border-b bg-green-500/10 border-green-500/20">
  {/* Pulsing status dot */}
  <span className="relative flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
  </span>

  <div className="flex-1">
    <span className="text-sm font-medium text-green-300">
      Active Lifecycle Model
    </span>
    <p className="text-xs text-green-400/70">
      Currently powering tier badges and stage progression
    </p>
  </div>

  {/* Actions only if custom model */}
  {model.isEditable && (
    <GlassButton size="sm" variant="ghost">
      Edit
    </GlassButton>
  )}
</div>
```

**Draft Model:**
```tsx
<div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
  <span className="material-symbols-outlined text-amber-400 text-base">edit_note</span>
  <span className="text-sm text-amber-300">
    Draft — Active: "Botanical Growth" (botanical)
  </span>
</div>
```

#### 2. Header

```tsx
<div className="px-4 py-3 border-b border-[var(--glass-border)]">
  <div className="flex items-center gap-3">
    {/* Icon */}
    <span className="text-2xl">
      {model.tiers[model.tiers.length - 1].emoji}
    </span>

    {/* Title and ID */}
    <div className="flex-1 min-w-0">
      <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
        {model.name}
      </h1>
      <code className="font-mono text-sm text-[var(--glass-text-muted)]">
        {model.id}
      </code>
    </div>

    {/* Status indicator */}
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${statusBadge}`}>
      <span className="material-symbols-outlined text-sm">
        {getStatusIcon(status)}
      </span>
      {status}
    </div>
  </div>
</div>
```

#### 3. Model Metadata Section

```tsx
<InspectorSection title="Model Metadata" collapsible defaultCollapsed={false}>
  <div className="space-y-4">
    {/* Name (editable for custom, read-only for system) */}
    <div>
      <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
        Name
      </label>
      {model.isEditable ? (
        <BufferedInput
          value={model.name}
          onChange={(v) => patchModel('name', v)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)]"
          disabled={loading}
        />
      ) : (
        <div className="px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] text-[var(--glass-text-secondary)]">
          {model.name}
        </div>
      )}
    </div>

    {/* Description */}
    <div>
      <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
        Description
      </label>
      {model.isEditable ? (
        <BufferedTextarea
          value={model.description || ''}
          onChange={(v) => patchModel('description', v)}
          rows={2}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)]"
          placeholder="Describe this lifecycle model"
          disabled={loading}
        />
      ) : (
        <p className="text-sm text-[var(--glass-text-secondary)]">
          {model.description || 'No description'}
        </p>
      )}
    </div>

    {/* Model ID (always read-only) */}
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--glass-text-muted)]">Model ID</span>
      <code className="px-2 py-0.5 rounded-full bg-[var(--glass-surface)] text-sm font-mono">
        {model.id}
      </code>
      <span className="text-xs text-[var(--glass-text-muted)]">(immutable)</span>
    </div>

    {/* Editable status badge */}
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-lg border
      ${model.isEditable
        ? 'bg-blue-500/10 border-blue-500/20'
        : 'bg-slate-500/10 border-slate-500/20'
      }
    `}>
      <span className="material-symbols-outlined text-lg">
        {model.isEditable ? 'edit' : 'lock'}
      </span>
      <div>
        <span className={`text-sm font-medium ${
          model.isEditable ? 'text-blue-400' : 'text-slate-400'
        }`}>
          {model.isEditable ? 'Custom Model' : 'System Model'}
        </span>
        <p className={`text-xs ${
          model.isEditable ? 'text-blue-400/70' : 'text-slate-400/70'
        }`}>
          {model.isEditable
            ? 'You can edit tier definitions and mappings'
            : 'Read-only — duplicate to customize'
          }
        </p>
      </div>
    </div>
  </div>
</InspectorSection>
```

#### 4. Tier Definitions Section

**For System Models (Read-Only Table):**
```tsx
<InspectorSection title="Tier Definitions" collapsible defaultCollapsed={false}>
  <div className="space-y-2">
    <p className="text-xs text-[var(--glass-text-muted)]">
      System models cannot be edited. Duplicate to create a custom version.
    </p>

    {/* Read-only table */}
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-[var(--glass-border)] rounded-lg">
        <thead className="bg-[var(--glass-surface)]">
          <tr>
            <th className="px-3 py-2 text-left text-xs text-[var(--glass-text-muted)]">
              Emoji
            </th>
            <th className="px-3 py-2 text-left text-xs text-[var(--glass-text-muted)]">
              Label
            </th>
            <th className="px-3 py-2 text-left text-xs text-[var(--glass-text-muted)]">
              Order
            </th>
          </tr>
        </thead>
        <tbody>
          {model.tiers
            .sort((a, b) => a.order - b.order)
            .map(tier => (
              <tr key={tier.id} className="border-t border-[var(--glass-border)]">
                <td className="px-3 py-2">
                  <span className="text-xl">{tier.emoji}</span>
                </td>
                <td className="px-3 py-2 text-[var(--glass-text-primary)]">
                  {tier.label}
                </td>
                <td className="px-3 py-2 text-[var(--glass-text-secondary)]">
                  {tier.order}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>

    {/* Lock indicator */}
    <div className="flex items-center gap-2 text-xs text-[var(--glass-text-muted)]">
      <span className="material-symbols-outlined text-sm">lock</span>
      <span>System tiers are protected from modification</span>
    </div>
  </div>
</InspectorSection>
```

**For Custom Models (Editable Table):**
```tsx
<InspectorSection title="Tier Definitions" collapsible defaultCollapsed={false}>
  <div className="space-y-3">
    <p className="text-xs text-[var(--glass-text-muted)]">
      Define the tiers used in this lifecycle model. Drag rows to reorder.
    </p>

    {/* Editable table with drag handles */}
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-[var(--glass-border)] rounded-lg">
        <thead className="bg-[var(--glass-surface)]">
          <tr>
            <th className="w-8 px-2 py-2"></th> {/* Drag handle */}
            <th className="px-3 py-2 text-left text-xs text-[var(--glass-text-muted)]">
              Emoji
            </th>
            <th className="px-3 py-2 text-left text-xs text-[var(--glass-text-muted)]">
              Label
            </th>
            <th className="px-3 py-2 text-left text-xs text-[var(--glass-text-muted)]">
              Order
            </th>
            <th className="w-10 px-2 py-2"></th> {/* Actions */}
          </tr>
        </thead>
        <tbody>
          {model.tiers
            .sort((a, b) => a.order - b.order)
            .map(tier => (
              <tr
                key={tier.id}
                className="border-t border-[var(--glass-border)] hover:bg-[var(--glass-surface)]"
                draggable
              >
                {/* Drag handle */}
                <td className="px-2 py-2 cursor-grab active:cursor-grabbing">
                  <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
                    drag_indicator
                  </span>
                </td>

                {/* Emoji picker */}
                <td className="px-3 py-2">
                  <button
                    onClick={() => openEmojiPicker(tier.id)}
                    className="text-xl hover:scale-110 transition-transform"
                  >
                    {tier.emoji}
                  </button>
                </td>

                {/* Editable label */}
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={tier.label}
                    onChange={(e) => updateTierLabel(tier.id, e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-[var(--glass-border)] focus:border-[var(--neon-cyan)] outline-none"
                  />
                </td>

                {/* Order (auto-calculated) */}
                <td className="px-3 py-2 text-[var(--glass-text-secondary)]">
                  {tier.order}
                </td>

                {/* Delete action */}
                <td className="px-2 py-2">
                  <button
                    onClick={() => deleteTier(tier.id)}
                    className="text-red-400 hover:text-red-300"
                    disabled={model.tiers.length <= 2} // Min 2 tiers
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>

    {/* Add tier button */}
    <GlassButton
      variant="ghost"
      size="sm"
      onClick={addTier}
      className="w-full"
      disabled={model.tiers.length >= 10} // Max 10 tiers
    >
      <span className="material-symbols-outlined text-sm mr-1">add_circle</span>
      Add Tier
    </GlassButton>

    {/* Constraints notice */}
    <p className="text-xs text-[var(--glass-text-muted)]">
      Min 2 tiers, max 10 tiers. Order updates automatically when you drag rows.
    </p>
  </div>
</InspectorSection>
```

#### 5. Stage-to-Tier Mappings Section

```tsx
<InspectorSection title="Stage-to-Tier Mappings" collapsible defaultCollapsed={false}>
  <div className="space-y-3">
    <p className="text-xs text-[var(--glass-text-muted)]">
      Map each sprout lifecycle stage to a tier. All stages must be mapped.
    </p>

    {/* Mapping table */}
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-[var(--glass-border)] rounded-lg">
        <thead className="bg-[var(--glass-surface)]">
          <tr>
            <th className="px-3 py-2 text-left text-xs text-[var(--glass-text-muted)]">
              Stage
            </th>
            <th className="w-8 px-2 py-2 text-center text-xs text-[var(--glass-text-muted)]">
              →
            </th>
            <th className="px-3 py-2 text-left text-xs text-[var(--glass-text-muted)]">
              Tier
            </th>
          </tr>
        </thead>
        <tbody>
          {SPROUT_STAGES.map(stage => {
            const mapping = model.mappings.find(m => m.stage === stage.id);
            const tier = model.tiers.find(t => t.id === mapping?.tierId);

            return (
              <tr key={stage.id} className="border-t border-[var(--glass-border)]">
                {/* Stage name */}
                <td className="px-3 py-2 text-[var(--glass-text-primary)]">
                  <div>
                    <span className="font-medium">{stage.label}</span>
                    <p className="text-xs text-[var(--glass-text-muted)]">
                      {stage.description}
                    </p>
                  </div>
                </td>

                {/* Arrow separator */}
                <td className="px-2 py-2 text-center text-[var(--glass-text-muted)]">
                  →
                </td>

                {/* Tier dropdown */}
                <td className="px-3 py-2">
                  <select
                    value={mapping?.tierId || ''}
                    onChange={(e) => updateMapping(stage.id, e.target.value)}
                    className={`
                      w-full px-3 py-1.5 text-sm rounded-lg border
                      bg-[var(--glass-solid)] focus:outline-none
                      ${!mapping?.tierId
                        ? 'border-red-500/50 text-red-400'
                        : 'border-[var(--glass-border)] text-[var(--glass-text-primary)]'
                      }
                    `}
                    disabled={!model.isEditable}
                  >
                    <option value="">Select tier...</option>
                    {model.tiers
                      .sort((a, b) => a.order - b.order)
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.emoji} {t.label}
                        </option>
                      ))
                    }
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Validation warnings */}
    {getUnmappedStages().length > 0 && (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <span className="material-symbols-outlined text-red-400">warning</span>
        <span className="text-sm text-red-300">
          {getUnmappedStages().length} stage{getUnmappedStages().length > 1 ? 's' : ''} not mapped
        </span>
      </div>
    )}
  </div>
</InspectorSection>
```

#### 6. Metadata Section (Collapsed by Default)

```tsx
<InspectorSection title="Metadata" collapsible defaultCollapsed={true}>
  <dl className="space-y-2 text-sm">
    <div className="flex justify-between">
      <dt className="text-[var(--glass-text-muted)]">Model ID</dt>
      <dd className="text-[var(--glass-text-secondary)] font-mono text-xs">
        {model.id}
      </dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-[var(--glass-text-muted)]">Total Tiers</dt>
      <dd className="text-[var(--glass-text-secondary)]">
        {model.tiers.length}
      </dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-[var(--glass-text-muted)]">Total Mappings</dt>
      <dd className="text-[var(--glass-text-secondary)]">
        {model.mappings.length} / {SPROUT_STAGES.length}
      </dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-[var(--glass-text-muted)]">Editable</dt>
      <dd className={`text-sm ${
        model.isEditable ? 'text-blue-400' : 'text-slate-400'
      }`}>
        {model.isEditable ? 'Yes (Custom)' : 'No (System)'}
      </dd>
    </div>
  </dl>
</InspectorSection>
```

#### 7. Footer Actions

**For Active Model:**
```tsx
<div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
  <div className="flex flex-col gap-3">
    {/* Active status button (if saved) */}
    {!hasChanges && (
      <div className="w-full px-4 py-2.5 rounded-lg bg-green-600/90 text-white text-center flex items-center justify-center gap-2 cursor-default">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <span className="font-medium">Active Lifecycle Model</span>
      </div>
    )}

    {/* Save button (if changes pending) */}
    {hasChanges && (
      <GlassButton
        onClick={handleSave}
        variant="primary"
        size="sm"
        disabled={loading || hasValidationErrors}
        className="w-full bg-green-600 hover:bg-green-500"
      >
        {loading ? 'Saving...' : 'Save & Update Active Model'}
      </GlassButton>
    )}

    {/* Secondary actions */}
    <div className="flex items-center justify-center gap-2">
      <GlassButton
        onClick={onDuplicate}
        variant="ghost"
        size="sm"
        disabled={loading}
      >
        <span className="material-symbols-outlined text-lg mr-1">content_copy</span>
        Duplicate
      </GlassButton>
    </div>
  </div>
</div>
```

**For Draft Model:**
```tsx
<div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
  <div className="flex flex-col gap-3">
    {/* Activate button */}
    <GlassButton
      onClick={handleActivate}
      variant="primary"
      size="sm"
      disabled={loading || hasValidationErrors || hasChanges}
      className="w-full bg-green-600 hover:bg-green-500"
      title={hasChanges ? 'Save changes before activating' : 'Make this the active lifecycle model'}
    >
      <span className="material-symbols-outlined text-lg mr-2">
        {activating ? 'hourglass_empty' : 'rocket_launch'}
      </span>
      {activating ? 'Activating...' : 'Activate This Model'}
    </GlassButton>

    {/* Save/Duplicate/Delete row */}
    <div className="flex items-center gap-2">
      <GlassButton
        onClick={onSave}
        variant="primary"
        size="sm"
        disabled={loading || !hasChanges}
        className="flex-1"
      >
        {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
      </GlassButton>
      <GlassButton
        onClick={onDuplicate}
        variant="ghost"
        size="sm"
        disabled={loading}
      >
        <span className="material-symbols-outlined text-lg">content_copy</span>
      </GlassButton>
      <GlassButton
        onClick={onDelete}
        variant="ghost"
        size="sm"
        disabled={loading}
        className="text-red-400 hover:text-red-300"
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </GlassButton>
    </div>
  </div>
</div>
```

**For Archived Model:**
```tsx
<div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
  <div className="flex items-center gap-2">
    <GlassButton
      onClick={onDuplicate}
      variant="ghost"
      size="sm"
      disabled={loading}
      className="flex-1"
      title="Create a new draft from this archived model"
    >
      <span className="material-symbols-outlined text-lg mr-1">content_copy</span>
      Restore as Draft
    </GlassButton>
    <GlassButton
      onClick={onDelete}
      variant="ghost"
      size="sm"
      disabled={loading}
      className="text-red-400 hover:text-red-300"
      title="Delete permanently"
    >
      <span className="material-symbols-outlined text-lg">delete</span>
    </GlassButton>
  </div>
</div>
```

---

## Component 3: Empty State

### When Shown
- No lifecycle configs exist in the database
- Should rarely happen (default botanical model is seeded)

### Visual Structure

```tsx
<div className="flex flex-col items-center justify-center h-full px-8 text-center">
  <span className="material-symbols-outlined text-6xl text-[var(--glass-text-muted)] mb-4">
    eco
  </span>
  <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-2">
    No Lifecycle Configurations Found
  </h2>
  <p className="text-sm text-[var(--glass-text-secondary)] mb-6 max-w-md">
    The default botanical model should have been seeded during initialization.
    This is an unexpected state.
  </p>
  <GlassButton
    variant="primary"
    onClick={seedDefaultModel}
    disabled={seeding}
  >
    <span className="material-symbols-outlined text-lg mr-2">
      {seeding ? 'hourglass_empty' : 'restart_alt'}
    </span>
    {seeding ? 'Seeding...' : 'Seed Default Model'}
  </GlassButton>
</div>
```

---

## Interactive Behaviors

### 1. Emoji Picker (Custom Models Only)

**Trigger:** Click on emoji in tier table  
**UI:** Overlay popover with emoji grid  
**Pattern:** Use existing emoji picker component if available, or create minimal picker with common emojis  

```tsx
// Popover positioned near clicked emoji
<div className="absolute z-50 bg-[var(--glass-panel)] border border-[var(--glass-border)] rounded-lg shadow-xl p-3 w-64">
  <div className="grid grid-cols-8 gap-2">
    {COMMON_EMOJIS.map(emoji => (
      <button
        key={emoji}
        onClick={() => selectEmoji(emoji)}
        className="text-2xl hover:scale-110 transition-transform p-1 rounded hover:bg-[var(--glass-surface)]"
      >
        {emoji}
      </button>
    ))}
  </div>
</div>
```

### 2. Tier Reordering (Drag & Drop)

**Trigger:** Drag row by drag handle  
**Behavior:**
1. Row becomes semi-transparent during drag
2. Other rows shift to make space
3. On drop, `order` values recalculate automatically
4. Changes marked as pending (hasChanges = true)

**Visual Feedback:**
```tsx
// During drag
className="opacity-50 shadow-lg"

// Drop zone indicator
className="border-t-2 border-[var(--neon-cyan)]"
```

### 3. Validation Feedback

**Real-time validation for:**
- All stages mapped (red border on unmapped dropdowns)
- No duplicate tier IDs (show error badge)
- Min 2 tiers, max 10 tiers (disable add/delete buttons)
- Valid emoji characters (show warning icon)

**Cannot save if validation fails** - Save button disabled with tooltip.

### 4. Activation Flow

**When activating a draft model:**
1. Show confirmation modal (if different from current active)
2. On confirm:
   - Current active → archived
   - Selected draft → active
   - Invalidate tier badge cache
   - Show success toast
3. Switch inspector to newly activated model

**Modal:**
```tsx
<ConfirmModal
  title="Activate Lifecycle Model?"
  message={`
    This will:
    • Archive current active model: "${activeModel.name}"
    • Activate "${model.name}" as the new lifecycle model
    • Update all tier badges immediately
  `}
  confirmLabel="Activate"
  confirmVariant="primary"
  onConfirm={handleActivate}
  onCancel={closeModal}
/>
```

---

## Design System Tokens

### Colors

```css
/* Status indicators */
--status-active: #10b981;      /* green-500 */
--status-draft: #f59e0b;       /* amber-500 */
--status-archived: #6b7280;    /* gray-500 */

/* Editable badges */
--editable-custom: #3b82f6;    /* blue-500 */
--editable-system: #64748b;    /* slate-500 */

/* Validation */
--error-bg: rgb(239 68 68 / 0.1);    /* red-500/10 */
--error-border: rgb(239 68 68 / 0.2); /* red-500/20 */
--error-text: #fca5a5;               /* red-300 */
```

### Typography

```css
/* Card title */
font-weight: 500;
font-size: 1rem; /* 16px */
line-height: 1.5;

/* Model ID (mono) */
font-family: 'JetBrains Mono', 'Courier New', monospace;
font-size: 0.75rem; /* 12px */

/* Section labels */
font-size: 0.75rem; /* 12px */
text-transform: uppercase;
letter-spacing: 0.05em;
```

### Spacing

```css
/* Card padding */
padding: 1rem; /* 16px */

/* Section gaps */
gap: 0.75rem; /* 12px */

/* Table cell padding */
padding: 0.5rem 0.75rem; /* 8px 12px */
```

---

## Accessibility

### ARIA Labels

```tsx
// Card
<div role="article" aria-label={`Lifecycle model: ${model.name}`}>

// Emoji picker
<button aria-label={`Change emoji for ${tier.label}`}>

// Dropdown
<select aria-label={`Map ${stage.label} to tier`}>

// Drag handle
<div role="button" aria-label="Drag to reorder tier" tabIndex={0}>
```

### Keyboard Navigation

- **Tab order:** Name → Description → Tier table → Mapping table → Actions
- **Tier table:** Arrow keys navigate cells, Enter to edit
- **Emoji picker:** Arrow keys navigate grid, Enter/Space to select
- **Drag & drop:** Space to grab, Arrow keys to move, Space to drop

### Focus Indicators

```css
/* All interactive elements */
focus:outline-none
focus:ring-2
focus:ring-[var(--neon-cyan)]
focus:ring-offset-2
focus:ring-offset-[var(--glass-void)]
```

---

## Responsive Behavior

### Card Grid (ExperienceConsole)
- **Desktop (≥1024px):** 3-column grid
- **Tablet (768px-1023px):** 2-column grid
- **Mobile (<768px):** 1-column stack

### Editor Panel
- **Desktop:** Fixed 400px width inspector on right
- **Tablet:** Slide-over panel (full height, 80% width)
- **Mobile:** Full-screen modal

### Tables
- **Desktop:** Full table layout
- **Mobile:** Stacked card layout (emoji + label + order as vertical list)

---

## Developer Handoff Notes

### Component Files to Create

```
src/bedrock/consoles/ExperienceConsole/
├── LifecycleConfigCard.tsx          (grid card)
├── LifecycleConfigEditor.tsx        (inspector panel)
├── LifecycleConfig.types.ts         (TypeScript types)
├── LifecycleConfig.config.ts        (constants, stage definitions)
└── useLifecycleConfigData.ts        (data hook for CRUD)
```

### Data Hook API

```typescript
// useLifecycleConfigData.ts
export function useLifecycleConfigData() {
  return {
    // Queries
    models: LifecycleModel[];
    activeModel: LifecycleModel | null;
    loading: boolean;
    error: Error | null;

    // Mutations
    activate: (modelId: string) => Promise<void>;
    update: (modelId: string, ops: PatchOperation[]) => Promise<void>;
    create: (model: Partial<LifecycleModel>) => Promise<LifecycleModel>;
    delete: (modelId: string) => Promise<void>;
    duplicate: (modelId: string) => Promise<LifecycleModel>;
  };
}
```

### Validation Rules

```typescript
// Tier validation
const validateTiers = (tiers: TierDefinition[]) => {
  if (tiers.length < 2) return 'Minimum 2 tiers required';
  if (tiers.length > 10) return 'Maximum 10 tiers allowed';
  
  const ids = tiers.map(t => t.id);
  if (new Set(ids).size !== ids.length) return 'Duplicate tier IDs';
  
  return null; // Valid
};

// Mapping validation
const validateMappings = (mappings: StageTierMapping[], tiers: TierDefinition[]) => {
  const tierIds = new Set(tiers.map(t => t.id));
  const unmapped = SPROUT_STAGES.filter(
    stage => !mappings.find(m => m.stage === stage.id)
  );
  
  if (unmapped.length > 0) {
    return `${unmapped.length} stages not mapped`;
  }
  
  const invalidMappings = mappings.filter(m => !tierIds.has(m.tierId));
  if (invalidMappings.length > 0) {
    return 'Some mappings reference non-existent tiers';
  }
  
  return null; // Valid
};
```

---

## Questions Answered

### 1. Model Switching
**Answer:** Each model is a separate card in the grid. The editor shows ONE model at a time. Users switch between models by clicking different cards. No in-editor model switching needed.

### 2. Tier Addition
**Answer:** For custom models, users can add/remove tiers (min 2, max 10). System models are read-only - users must duplicate to customize.

### 3. Preview
**Answer:** Yes - show live preview in the "Tier Definitions" section. Add a "Preview" subsection that renders `<TierBadge>` components at different sizes (sm/md/lg) using current tier settings.

```tsx
<div className="mt-4 p-3 rounded-lg bg-[var(--glass-surface)]">
  <p className="text-xs text-[var(--glass-text-muted)] mb-2">Preview</p>
  <div className="flex items-center gap-3">
    {model.tiers.map(tier => (
      <TierBadge key={tier.id} tier={tier.id} size="md" />
    ))}
  </div>
</div>
```

### 4. Import/Export
**Answer:** Phase 1: No import/export UI. Admin users can edit `infrastructure/lifecycle.json` directly via GCS console. Phase 2 (future): Add "Export JSON" / "Import JSON" buttons in the Metadata section.

---

*Wireframes for S5-SL-LifecycleEngine*  
*Design System: Quantum Glass v1.0*  
*Ready for UX Chief Review*
