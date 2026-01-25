# Controller/Preset Architecture: Design Brief

**Author:** UI/UX Designer (Grove Product Pod)
**Date:** January 2026
**Status:** Strategic Design Input
**Sprint:** Controller/Preset Architecture Epic

---

## Executive Summary

This design brief provides UI/UX direction for the Controller/Preset pattern implementation. The design philosophy is **self-evident objects**—configuration that both humans and AI agents can understand without explanation.

**Core Principle:** If a user needs documentation to understand what they're looking at, we've failed.

---

## 1. DEX Pillar Alignment

Every design decision is tied to Trellis First Order Directives:

| Design Element | DEX Pillar | Rationale |
|----------------|------------|-----------|
| Fork Button (not Edit) for system-seed | **Declarative Sovereignty** | Users own their configurations; system-seed is the reference |
| Provenance badges visible on all cards | **Provenance as Infrastructure** | Origin is never hidden; fork lineage is first-class UI |
| Controller shows "what's active" at a glance | **Declarative Sovereignty** | Selection state is explicit, not buried in code |
| Same card pattern for all Preset types | **Organic Scalability** | New Preset types inherit patterns, no new design work |

---

## 2. Existing Patterns to Reuse

**Critical:** NO NEW PATTERNS unless unavoidable. Grove already has established patterns.

### 2.1 Card Pattern (OutputTemplateCard.tsx)

The `OutputTemplateCard` establishes the canonical Preset card pattern:

```
┌──────────────────────────────────────────┐
│ [CATEGORY COLOR BAR - thin horizontal]   │
├──────────────────────────────────────────┤
│ [SOURCE BADGE]              [FAVORITE ★] │
│                                          │
│ [ICON]  Title                            │
│         v1.0  [DEFAULT badge if set]     │
│                                          │
│ Description preview text with            │
│ two-line truncation...                   │
│                                          │
│ [Agent Type]  [Category]  [Citation]     │
│                                          │
│ [Status Badge]        Updated: Jan 2026  │
└──────────────────────────────────────────┘
```

**Existing components to reuse:**
- `OutputTemplateCard.tsx` - Source badge pattern, status colors
- `SystemPromptCard.tsx` - Status bar at top, mode badges
- `ObjectCardProps<T>` interface from `console-factory.types.ts`

### 2.2 Editor Pattern (OutputTemplateEditor.tsx)

The `OutputTemplateEditor` establishes the fork-to-customize pattern:

```
┌──────────────────────────────────────────┐
│ [SYSTEM SEED BANNER - blue]              │
│   🔒 System Template (Read-Only)         │
│   Fork this template to customize        │
│                            [Fork Button] │
├──────────────────────────────────────────┤
│ [HEADER with icon + title + version]     │
├──────────────────────────────────────────┤
│ InspectorSection: Basic Information      │
│   - Name (disabled if system-seed)       │
│   - Description                          │
│   - Agent Type selector                  │
├──────────────────────────────────────────┤
│ InspectorSection: [Type-specific config] │
├──────────────────────────────────────────┤
│ InspectorSection: Provenance             │
│   - Source                               │
│   - Forked From (if applicable)          │
│   - Version                              │
│   - Changelog                            │
├──────────────────────────────────────────┤
│ [FOOTER ACTIONS - sticky]                │
│   Draft: Publish + Save/Delete           │
│   Active: Save + Duplicate/Archive       │
│   System-seed: Fork to Customize         │
└──────────────────────────────────────────┘
```

**Key behaviors already implemented:**
- Lock icon on fields for system-seed templates
- Status banners (Draft/Active/Archived)
- Footer actions vary by status
- Fork creates new object and selects it

### 2.3 Console Factory Pattern

All consoles use `createBedrockConsole()` factory:

```typescript
createBedrockConsole<PayloadType>({
  config: ConsoleConfig,     // Declarative config
  useData: () => {...},      // Data hook
  CardComponent: Card,       // Grid card
  EditorComponent: Editor,   // Inspector panel
  createOptions?: [...]      // Polymorphic create dropdown
})
```

**Existing hook pattern** (`useOutputTemplateData.ts`):
- `objects` - All objects
- `fork(id)` - Fork flow
- `publish(id)` - Draft -> Active
- `archive(id)` - Active -> Archived
- Standard CRUD from `CollectionDataResult<T>`

---

## 3. New Components: Controller Card

The Controller is the **only new UI pattern**. It shows "what's active" with one-click switching.

### 3.1 Controller Card Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ PROMPT CONTROLLER                                        [⚙️]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Active Preset                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ [ICON]  Default Grove Prompt           [SYSTEM] [● Active] │  │
│  │         Balanced, professional tone    [Change ▼]          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Pinned Presets (Quick Switch)                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │ Academic    │ │ Socratic    │ │ Casual      │                │
│  │ ○ Select    │ │ ○ Select    │ │ ○ Select    │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
│                                                                  │
│  [Browse All Presets →]                                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Controller Card Behaviors

| Element | Behavior |
|---------|----------|
| Active Preset row | Shows current selection with full info |
| [Change ▼] button | Opens Preset picker dropdown |
| Pinned Presets | One-click switch (radio selection) |
| [Browse All →] | Navigates to Preset console filtered by type |
| [⚙️] | Opens Controller settings (pin management) |

### 3.3 Controller Card States

**Normal state:**
- Shows active Preset with source badge
- Quick-switch pins visible

**Loading state:**
- Active Preset grayed with spinner
- "Switching..." text

**Error state:**
- Red border
- Error message below active

---

## 4. Preset Discovery: Console View

Presets appear in Experience Console alongside other GroveObjects.

### 4.1 Console Grid View

```
┌──────────────────────────────────────────────────────────────────┐
│ [🔍 Search] [Agent ▼] [Source ▼] [Status ▼]   [+ New Preset ▼]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ [SYSTEM]     │  │ [FORKED]     │  │              │           │
│  │ Default      │  │ My Academic  │  │ Custom       │           │
│  │ Grove        │  │ Style        │  │ Research     │           │
│  │              │  │              │  │              │           │
│  │ Writer       │  │ Writer       │  │ Research     │           │
│  │ ● Active     │  │ ○ Draft      │  │ ● Active     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ [SYSTEM]     │  │ [IMPORTED]   │  │ [FORKED]     │           │
│  │ Socratic     │  │ Legal        │  │ Deep Dive    │           │
│  │ Dialogue     │  │ Deposition   │  │ Research     │           │
│  │              │  │              │  │              │           │
│  │ Writer       │  │ Writer       │  │ Research     │           │
│  │              │  │ ● Active     │  │ ○ Archived   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Filter Chips

| Filter | Options | Default |
|--------|---------|---------|
| Agent Type | Writer, Research, Code, All | All |
| Source | System, Forked, User, Imported, All | All |
| Status | Active, Draft, Archived, All | Active + Draft |

### 4.3 Create Dropdown (Polymorphic)

When user clicks [+ New Preset ▼]:

```
┌─────────────────────────────┐
│ Create New Preset           │
├─────────────────────────────┤
│ [✏️]  Writer Template       │
│       Document generation   │
├─────────────────────────────┤
│ [🔍]  Research Template     │
│       Information gathering │
├─────────────────────────────┤
│ [</>] Code Template         │
│       Code generation       │
└─────────────────────────────┘
```

**Uses existing:** `createOptions` from `BedrockConsoleOptions<T>`

---

## 5. Provenance Indicators: Visual System

Provenance is never hidden. Source badges are consistent across all views.

### 5.1 Source Badge Hierarchy

| Source | Badge | Color | Meaning |
|--------|-------|-------|---------|
| `system-seed` | SYSTEM | Muted gray | Built-in, read-only, fork to customize |
| `forked` | FORKED | Info blue | Created by forking another template |
| `imported` | IMPORTED | Violet | Imported from external source |
| `user-created` | (none) | (none) | Created from scratch - default, no badge |

**Design rationale:** User-created needs no badge because it's the "normal" state. Badges indicate deviation from normal.

### 5.2 Badge Placement

| Context | Placement |
|---------|-----------|
| Card (grid view) | Top-left, inside card below color bar |
| Editor header | Next to title |
| Picker dropdown | After name |
| Controller active row | After title |

### 5.3 Badge Component (Reuse)

From `OutputTemplateCard.tsx`:

```typescript
const SOURCE_CONFIG: Record<OutputTemplateSource, { label: string; color: string; bg: string } | null> = {
  'system-seed': { label: 'SYSTEM', color: 'var(--glass-text-muted)', bg: 'var(--glass-panel)' },
  'forked': { label: 'FORKED', color: 'var(--semantic-info)', bg: 'var(--semantic-info-bg)' },
  'imported': { label: 'IMPORTED', color: 'var(--neon-violet)', bg: 'var(--neon-violet-bg)' },
  'user-created': null, // No badge
};
```

---

## 6. Fork-to-Customize Flow

The fork flow is the primary customization UX. System-seed templates cannot be edited.

### 6.1 Flow Diagram

```
User clicks system-seed Preset
           │
           ▼
┌─────────────────────────────────────────┐
│ Inspector opens with blue banner:       │
│                                         │
│ 🔒 System Template (Read-Only)          │
│ Fork this template to create your own   │
│ customized version                      │
│                           [Fork to      │
│                            Customize]   │
└─────────────────────────────────────────┘
           │
     User clicks Fork
           │
           ▼
┌─────────────────────────────────────────┐
│ New Preset created:                     │
│ - name: "My {original.name}"            │
│ - source: "forked"                      │
│ - forkedFromId: original.id             │
│ - status: "draft"                       │
│ - All fields editable                   │
└─────────────────────────────────────────┘
           │
           ▼
Inspector automatically selects new Preset
User can now edit and Publish
```

### 6.2 Fork Naming Convention

```typescript
function forkPresetName(originalName: string): string {
  return `My ${originalName}`;
}
```

If "My X" already exists, append number: "My X (2)", "My X (3)", etc.

### 6.3 Fork Button Prominence

| Context | Button Style |
|---------|--------------|
| Banner (top of inspector) | Primary, full-width blue |
| Footer (system-seed only) | Primary blue, full-width |
| Inline (never) | N/A - fork is a deliberate action |

---

## 7. Controller Integration in Console

Controllers appear at the top of consoles that manage Presets.

### 7.1 Console Layout with Controller

```
┌──────────────────────────────────────────────────────────────────┐
│ EXPERIENCE CONSOLE                                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ACTIVE CONFIGURATIONS                                       │ │
│  ├──────────────────────┬──────────────────────┬───────────────┤ │
│  │ Prompt Controller    │ Writer Controller    │ Research Ctrl │ │
│  │ ─────────────────    │ ─────────────────    │ ────────────  │ │
│  │ Default Grove        │ Engineering Arch     │ Deep Dive     │ │
│  │ [SYSTEM]             │ [FORKED]             │ [USER]        │ │
│  │                      │                      │               │ │
│  │ [Change ▼]           │ [Change ▼]           │ [Change ▼]    │ │
│  └──────────────────────┴──────────────────────┴───────────────┘ │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  ALL PRESETS                    [🔍] [Agent▼] [Source▼] [+New▼] │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Card 1   │  │ Card 2   │  │ Card 3   │  │ Card 4   │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Controller Section Behaviors

| Action | Result |
|--------|--------|
| Click Controller card | Opens Controller settings in inspector |
| Click [Change ▼] | Opens Preset picker for that controller |
| Select Preset from picker | Updates Controller.activePresetId, closes picker |

### 7.3 Controller State Persistence

Controllers are Field-scoped singletons. When user switches Fields:
- Each Field has its own Controllers
- Selection state is preserved per Field
- No cross-Field inheritance (explicit design choice)

---

## 8. Component Inventory

### 8.1 Existing Components (Reuse)

| Component | Location | Status |
|-----------|----------|--------|
| `OutputTemplateCard` | `ExperienceConsole/OutputTemplateCard.tsx` | **Reference implementation** |
| `OutputTemplateEditor` | `ExperienceConsole/OutputTemplateEditor.tsx` | **Reference implementation** |
| `InspectorSection` | `primitives/BedrockInspector.tsx` | Use as-is |
| `GlassButton` | `primitives/GlassButton.tsx` | Use as-is |
| `BufferedInput` | `primitives/BufferedInput.tsx` | Use as-is |
| `ObjectCardProps<T>` | `patterns/console-factory.types.ts` | Interface |
| `ObjectEditorProps<T>` | `patterns/console-factory.types.ts` | Interface |

### 8.2 New Components (Minimal)

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `ControllerCard` | Shows active Preset + quick-switch | Medium |
| `PresetPicker` | Dropdown for selecting Preset | Medium |
| `ControllerSection` | Layout wrapper for Controller row | Low |

### 8.3 Component Reuse Matrix

| New Component | Reuses From |
|---------------|-------------|
| `ControllerCard` | `OutputTemplateCard` (layout), `GlassButton` (actions) |
| `PresetPicker` | `GroupedChips` (filtering), `GlassCard` (items) |
| `ControllerSection` | `InspectorSection` (collapse), `GlassPanel` (background) |

---

## 9. UX Flow Diagrams

### 9.1 First-Time User: Creating Custom Preset

```
User enters Experience Console
        │
        ▼
Sees "Active Configurations" with system defaults
        │
        ▼
Clicks on a system-seed Preset card
        │
        ▼
Inspector opens with fork banner
        │
        ▼
User clicks "Fork to Customize"
        │
        ▼
New draft Preset created, inspector switches to it
        │
        ▼
User edits fields (name, system prompt, etc.)
        │
        ▼
User clicks "Publish Template"
        │
        ▼
Preset status: draft → active
Controller automatically updates if it was the default
```

### 9.2 Quick-Switch Flow

```
User is in Explore (/explore)
        │
        ▼
Clicks gear icon to open settings panel
        │
        ▼
Sees mini Controller cards for active Presets
        │
        ▼
Clicks [Change] on Prompt Controller
        │
        ▼
PresetPicker opens with available options
        │
        ▼
User selects different Preset
        │
        ▼
Controller.activePresetId updates
Next chat uses new Preset
```

### 9.3 Import Flow (Future)

```
User receives shared Preset file/URL
        │
        ▼
Clicks "Import Preset" in console
        │
        ▼
Import dialog validates Preset schema
        │
        ▼
Preview shows source attribution
        │
        ▼
User confirms import
        │
        ▼
New Preset created with source: "imported"
Federation metadata preserved
```

---

## 10. Design Decisions

### 10.1 Why No Edit on System-Seed?

**Decision:** System-seed Presets are always read-only.

**Rationale:**
- DEX Pillar I: User sovereignty means users own their data
- System-seed is the "known good" reference
- Edits should create user-owned copies
- Prevents accidental modification of shared baselines
- Enables federation (system-seeds are canonical)

**Alternative considered:** Allow editing with "reset to default" button.
**Rejected because:** Creates ambiguity about what "default" means after edits.

### 10.2 Why Controllers Don't Federate?

**Decision:** Controllers are Field-local singletons that never federate.

**Rationale:**
- DEX Pillar III: Selection is a local decision
- Federating would impose external choices
- Each Field owner decides their active Presets
- Presets federate (the options); Controllers don't (the choice)

### 10.3 Why No "Default" Controller?

**Decision:** Controllers must always have an active Preset.

**Rationale:**
- Eliminates "undefined behavior" edge cases
- System-seed provides guaranteed baseline
- If user archives active Preset, fallback to system-seed default
- AI agents can always introspect active configuration

### 10.4 Why Source Badges for Everything Except User-Created?

**Decision:** user-created source has no badge.

**Rationale:**
- "User created" is the normal/expected state
- Badges indicate deviation from normal
- Reduces visual noise for common case
- SYSTEM/FORKED/IMPORTED are the exceptions worth highlighting

---

## 11. Accessibility Considerations

### 11.1 Color Independence

All source badges use both color AND text:
- SYSTEM badge: Gray background + "SYSTEM" text
- FORKED badge: Blue background + "FORKED" text
- Status badges: Color + text label

Never rely on color alone to convey meaning.

### 11.2 Keyboard Navigation

| Action | Keyboard |
|--------|----------|
| Navigate cards | Arrow keys |
| Select card | Enter |
| Toggle favorite | F key |
| Open inspector | Enter on card |
| Close inspector | Escape |
| Fork Preset | F key (when inspector open on system-seed) |

### 11.3 Screen Reader Announcements

| Context | Announcement |
|---------|--------------|
| Card focus | "{name}, {source} template, {status}, press Enter to edit" |
| System-seed editor | "System template, read-only, press F to fork" |
| Controller change | "{name} is now the active {type} Preset" |

---

## 12. Implementation Phases

### Phase 1: Schema (S21-CP-Schema)

**Design deliverables:** None (schema only)

### Phase 2: Engine (S22-CP-Engine)

**Design deliverables:** None (engine only)

### Phase 3: Console Integration (S23-CP-Console)

**Design deliverables:**
- `ControllerCard` component
- `PresetPicker` dropdown
- `ControllerSection` layout
- Integration with existing Preset cards/editors

### Phase 4: Migration (S24-CP-Migration)

**Design deliverables:** None (data migration)

### Phase 5: Federation (S25-CP-Federation)

**Design deliverables:**
- Import flow wireframes
- Federation preview UI
- Attribution display for imported Presets

---

## 13. Success Criteria

### 13.1 Self-Evident Test

A user with no prior Grove experience should be able to:
1. Find the active Prompt Preset within 10 seconds
2. Understand that SYSTEM templates require forking within 5 seconds
3. Create a customized Preset within 2 minutes
4. Switch active Preset within 3 clicks

### 13.2 AI Agent Test

An AI agent should be able to:
1. List all available Presets via API introspection
2. Explain what each Preset does based on description + payload
3. Recommend Preset changes based on user intent
4. Execute selection changes without code modification

### 13.3 DEX Compliance Test

All implementations must pass:
- [ ] Behavior changed via config, not code
- [ ] Non-developer can customize via UI
- [ ] All Presets have full provenance chain
- [ ] New Preset types work without engine changes

---

## Cross-References

- **Vision Paper:** `docs/architecture/CONTROLLER_PRESET_ARCHITECTURE.md`
- **DEX Stack:** `docs/architecture/TRELLIS.md`
- **DEX Pillars:** `docs/architecture/TRELLIS_FIRST_ORDER_DIRECTIVES.md`
- **Output Template Reference:** `src/core/schema/output-template.ts`
- **Card Reference:** `src/bedrock/consoles/ExperienceConsole/OutputTemplateCard.tsx`
- **Editor Reference:** `src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx`

---

*UI/UX Designer | Grove Product Pod | January 2026*
