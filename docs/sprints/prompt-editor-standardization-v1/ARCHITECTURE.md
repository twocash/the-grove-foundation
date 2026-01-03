# Architecture: Prompt Editor Standardization

**Sprint:** prompt-editor-standardization-v1  
**Date:** 2025-01-03

## Target Architecture

### Component Structure

```
PromptEditor.tsx
├── Scrollable Content Container
│   ├── InspectorSection (Identity)
│   ├── InspectorDivider
│   ├── InspectorSection (Execution)
│   ├── InspectorDivider
│   ├── InspectorSection (Source & Weight)
│   ├── InspectorDivider
│   ├── CollapsibleSection (Targeting) ← NEW
│   ├── InspectorDivider
│   ├── CollapsibleSection (Sequences) ← NEW
│   ├── InspectorDivider
│   ├── CollapsibleSection (Performance) ← NEW
│   ├── InspectorDivider
│   └── InspectorSection (Metadata)
└── Fixed Footer
    └── GlassButton[3] (Save | Duplicate | Delete)
```

## Critical Discovery: Collapsible Not Implemented

**Finding:** The `collapsible` and `defaultCollapsed` props used in `LensEditor.tsx` are passed to `InspectorSection` but **NOT IMPLEMENTED**. The props are silently ignored by React.

**Evidence:**
- `shared/layout/InspectorPanel.tsx` - InspectorSection interface has only: `title`, `children`, `className`
- `bedrock/primitives/BedrockInspector.tsx` - Just re-exports without enhancement
- LensEditor uses `collapsible` and `defaultCollapsed` props that do nothing

**Resolution Options:**

### Option A: Enhance InspectorSection (RECOMMENDED)
Add collapsible support to the shared primitive:

```typescript
interface InspectorSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;        // NEW
  defaultCollapsed?: boolean;   // NEW
}
```

**Pros:** Single source of truth, benefits all consumers
**Cons:** Modifies shared component (low risk)

### Option B: Create CollapsibleSection in Bedrock
New component specifically for Bedrock consoles:

```typescript
// bedrock/primitives/CollapsibleSection.tsx
export function CollapsibleSection({ 
  title, 
  children, 
  defaultCollapsed = false 
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  // ... render with chevron toggle
}
```

**Pros:** No shared code changes
**Cons:** Duplication, LensEditor would need updating too

### Decision: Option A
Enhance `InspectorSection` in `shared/layout/InspectorPanel.tsx` to support collapsible behavior. This fixes LensEditor's broken props AND enables PromptEditor standardization.

## Data Flow

### Edit Operations

```
User Input
    ↓
patchPayload(field, value) or patchMeta(field, value)
    ↓
Creates PatchOperation: { op: 'replace', path: '/payload/{field}', value }
    ↓
onEdit([operation]) → Factory
    ↓
Accumulated in local state (hasChanges = true)
    ↓
onSave() → Factory
    ↓
usePromptData.update(id, operations)
    ↓
Supabase PATCH
```

### State Management

**Before (Current PromptEditor):**
```typescript
const [localPrompt, setLocalPrompt] = useState(prompt);
const [isDirty, setIsDirty] = useState(false);

// Duplicate state tracking ❌
```

**After (Standardized):**
```typescript
// Use factory props directly ✓
const { object, hasChanges, onEdit, onSave } = props;

// Helper pattern from LensEditor
const patchPayload = (field: keyof PromptPayload, value: unknown) => {
  onEdit([{ op: 'replace', path: `/payload/${field}`, value }]);
};

const patchMeta = (field: string, value: unknown) => {
  onEdit([{ op: 'replace', path: `/meta/${field}`, value }]);
};
```

## Component Mapping

### From Tabs to Sections

| Old Tab | New Section | Collapsible |
|---------|-------------|-------------|
| Content → Title, Description | Identity | No |
| Content → Execution Prompt | Execution | No |
| Content → Variant, Weight, Tags | Source & Weight | No |
| Targeting | Targeting | Yes (default open) |
| Sequences | Sequences | Yes (default closed) |
| Stats | Performance | Yes (default closed) |
| (new) | Metadata | No |

### Field Mapping

| Field | Section | Component Type |
|-------|---------|----------------|
| `meta.title` | Identity | text input |
| `meta.description` | Identity | text input |
| `payload.variant` | Identity | select dropdown |
| `meta.status` | Identity | toggle switch |
| `payload.executionPrompt` | Execution | textarea |
| `payload.source` | Source & Weight | badge (read-only) |
| `payload.baseWeight` | Source & Weight | range slider |
| `meta.tags` | Source & Weight | tag input |
| `payload.targeting.stages` | Targeting | multi-select |
| `payload.targeting.minInteractions` | Targeting | number input |
| `payload.targeting.minConfidence` | Targeting | number input |
| `payload.targeting.lensIds` | Targeting | multi-select |
| `payload.targeting.requireMoment` | Targeting | toggle |
| `payload.sequences` | Sequences | badges (read-only) |
| `payload.stats.*` | Performance | stat cards (read-only) |
| `meta.createdAt` | Metadata | date display |
| `meta.updatedAt` | Metadata | date display |
| `meta.id` | Metadata | ID display |

## Styling Tokens

Consistent with LensEditor:

```css
/* Form labels */
.text-xs.text-[var(--glass-text-muted)]

/* Text inputs */
.w-full.px-3.py-2.text-sm.rounded-lg
.border.border-[var(--glass-border)]
.bg-[var(--glass-solid)]
.text-[var(--glass-text-primary)]
.focus:outline-none.focus:ring-1.focus:ring-[var(--neon-cyan)]/50

/* Textareas */
Same as text inputs + .resize-none.font-mono

/* Toggle switch */
.relative.w-11.h-6.rounded-full.transition-colors
Active: .bg-[var(--neon-green)]
Inactive: .bg-[var(--glass-border)]

/* Section header */
.glass-section-header (defined in CSS)

/* Fixed footer */
.flex-shrink-0.p-4.border-t.border-[var(--glass-border)].bg-[var(--glass-panel)]
```

## File Changes Summary

| File | Change Type | Scope |
|------|-------------|-------|
| `src/shared/layout/InspectorPanel.tsx` | MODIFY | Add collapsible support |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | REWRITE | Full refactor |
| `src/bedrock/consoles/LensWorkshop/LensEditor.tsx` | NONE | Already correct (will work once InspectorSection fixed) |
