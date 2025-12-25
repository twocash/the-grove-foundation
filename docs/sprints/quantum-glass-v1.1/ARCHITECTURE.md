# ARCHITECTURE.md — Quantum Glass v1.1

## Sprint: Card System Unification
## Date: 2025-12-25

---

## 1. System Context

This sprint operates at the **presentation layer only**. No changes to:
- State management patterns
- Data schemas
- API contracts
- Business logic

### Scope Boundary

```
┌─────────────────────────────────────────────────────────────────────────┐
│ OUT OF SCOPE                                                            │
│  - Data layer (schemas, hooks)                                          │
│  - Engagement engine                                                    │
│  - Narrative engine                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ IN SCOPE                                                                │
│  - CSS utilities (globals.css)                                          │
│  - Card components (JourneyCard, LensCard, NodeCard)                    │
│  - Shared components (CollectionHeader, SearchInput, ActiveIndicator)   │
│  - Inspector close logic (WorkspaceUIContext.navigateTo)                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Card Architecture

### 2.1 Unified Card Anatomy

Every Grove object card follows this DOM structure:

```
<article.glass-card>
  ├── <div.header>
  │   ├── <span.glass-card-icon>
  │   ├── <h3.title>
  │   └── <StatusBadge>? (conditional)
  │
  ├── <p.description>
  │
  ├── <div.glass-callout>? (conditional)
  │
  └── <div.glass-card-footer>
      ├── <div.glass-card-meta>
      └── <button.glass-btn-primary>? (conditional)
</article>
```

### 2.2 State Machine

Cards have two orthogonal state dimensions:

```
                    ┌─────────────────┐
                    │    DEFAULT      │
                    │  (no attrs)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              │              ▼
     ┌────────────────┐      │     ┌────────────────┐
     │    SELECTED    │      │     │     ACTIVE     │
     │ data-selected  │      │     │  data-active   │
     │  (cyan ring)   │      │     │ (green border) │
     └────────────────┘      │     └────────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │ ACTIVE+SELECTED │
                    │   (both attrs)  │
                    │  (green ring)   │
                    └─────────────────┘
```

**State Semantics:**
- `data-selected="true"` → This item is being inspected
- `data-active="true"` → This item is the "current" contextual item

### 2.3 CSS Cascade

```css
/* Base state */
.glass-card { ... }

/* Hover (applies to all states) */
.glass-card:hover { ... }

/* Selected state */
.glass-card[data-selected="true"] { ... }

/* Active state */
.glass-card[data-active="true"] { ... }

/* Active AND Selected (most specific) */
.glass-card[data-active="true"][data-selected="true"] { ... }
```

---

## 3. Component Composition

### 3.1 Card Component Pattern

```tsx
interface ObjectCardProps {
  item: ObjectType;
  isActive: boolean;      // Is this the "current" item?
  isInspected: boolean;   // Is inspector showing this item?
  onAction: () => void;   // Primary action (Start, Select)
  onView: () => void;     // Opens inspector
}

function ObjectCard({ item, isActive, isInspected, onAction, onView }: ObjectCardProps) {
  return (
    <article
      data-selected={isInspected || undefined}
      data-active={isActive || undefined}
      className="glass-card p-5 cursor-pointer"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined glass-card-icon">
            {OBJECT_ICON}
          </span>
          <h3 className="font-medium text-[var(--glass-text-primary)]">
            {item.title}
          </h3>
        </div>
        {isActive && <StatusBadge variant="active" />}
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--glass-text-muted)] mb-3 line-clamp-2">
        {item.description}
      </p>

      {/* Callout (optional) */}
      {item.insight && (
        <div className="glass-callout line-clamp-2">
          {item.insight}
        </div>
      )}

      {/* Footer */}
      <div className="glass-card-footer">
        <div className="glass-card-meta">
          {/* Metadata */}
        </div>
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="glass-btn-primary"
          >
            {ACTION_LABEL}
          </button>
        )}
      </div>
    </article>
  );
}
```

### 3.2 Compact Card Pattern

For chat nav picker (single column):

```tsx
function CompactObjectCard({ item, isActive, onAction }: CompactProps) {
  return (
    <div
      data-active={isActive || undefined}
      className="glass-card p-4 cursor-pointer flex items-center gap-4"
      onClick={onAction}
    >
      <span className="material-symbols-outlined glass-card-icon text-xl">
        {OBJECT_ICON}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
          {item.title}
        </h3>
        <p className="text-sm text-[var(--glass-text-muted)] truncate">
          {item.description}
        </p>
      </div>
      {isActive && <StatusBadge variant="active" />}
    </div>
  );
}
```

---

## 4. Inspector Context Architecture

### 4.1 Current Flow (Broken)

```
User clicks Journey card
  → openInspector({ type: 'journey', journeyId })
  → Inspector shows JourneyInspector

User navigates to Lenses
  → navigateTo(['explore', 'groveProject', 'lenses'])
  → Inspector STAYS OPEN with stale journey data ❌
```

### 4.2 Fixed Flow

```
User clicks Journey card
  → openInspector({ type: 'journey', journeyId })
  → Inspector shows JourneyInspector

User navigates to Lenses
  → navigateTo(['explore', 'groveProject', 'lenses'])
  → navigateTo detects collection change
  → setInspector({ mode: { type: 'none' }, isOpen: false })
  → Inspector closes ✅
```

### 4.3 Collection Type Mapping

```typescript
const COLLECTION_PATHS = {
  'terminal': 'terminal',
  'lenses': 'lens',
  'journeys': 'journey',
  'nodes': 'node',
  'diary': 'diary',
  'sprouts': 'sprout',
};

// In navigateTo:
const currentCollection = navigation.activePath[1];
const newCollection = path[1];

if (currentCollection !== newCollection && inspector.isOpen) {
  closeInspector();
}
```

---

## 5. CSS Utility Architecture

### 5.1 New Utilities

```css
/* Icon in card header */
.glass-card-icon {
  color: var(--glass-text-muted);
  font-size: 20px;
  transition: color var(--duration-fast);
}

.glass-card:hover .glass-card-icon {
  color: var(--glass-text-secondary);
}

/* Callout block (replaces amber boxes) */
.glass-callout {
  padding: 10px 14px;
  margin: 12px 0;
  border-left: 2px solid var(--neon-cyan);
  background: transparent;
  color: var(--glass-text-muted);
  font-style: italic;
  font-size: 13px;
  line-height: 1.5;
}

/* Card footer */
.glass-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--glass-border);
}

/* Metadata in footer */
.glass-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--glass-text-subtle);
}

.glass-card-meta .material-symbols-outlined {
  font-size: 14px;
}

/* Primary action button */
.glass-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: var(--neon-green);
  color: white;
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.glass-btn-primary:hover {
  background: rgba(16, 185, 129, 0.85);
  box-shadow: var(--glow-green);
}

/* Secondary action button */
.glass-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: var(--glass-elevated);
  color: var(--glass-text-secondary);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.glass-btn-secondary:hover {
  border-color: var(--neon-cyan);
  color: var(--glass-text-primary);
}
```

### 5.2 Utility Dependency Graph

```
.glass-card (v1, exists)
    │
    ├── .glass-card-icon (new)
    │
    ├── .glass-callout (new)
    │
    ├── .glass-card-footer (new)
    │   └── .glass-card-meta (new)
    │
    └── .glass-btn-primary (new)
        └── .glass-btn-secondary (new)
```

---

## 6. Object Icon Registry

For v1.1, each object type uses a single icon:

| Object Type | Icon | Material Symbol |
|-------------|------|-----------------|
| Journey | Map | `map` |
| Lens | Brain | `psychology` |
| Node | Branch | `account_tree` |
| Sprout | Seedling | `psychiatry` |
| Diary | Book | `auto_stories` |

**Future Architecture:** Per-item icons can be stored in data schemas and passed as props. The icon registry would move from hardcoded to data-driven.

---

## 7. Migration Strategy

### 7.1 Phase Order Rationale

1. **CSS First** — Utilities must exist before components can use them
2. **Inspector Fix** — Can run in parallel, no dependencies
3. **JourneyCard** — Most complex (full + compact), establishes pattern
4. **LensCard** — Follow JourneyCard pattern, remove accent system
5. **NodeCard** — Simplest, apply pattern
6. **Shared Components** — Independent, can run last

### 7.2 Rollback Strategy

Each phase is independently deployable. If issues arise:
- CSS utilities are additive (no breakage)
- Component changes can be reverted file-by-file
- Inspector logic is isolated to one function
