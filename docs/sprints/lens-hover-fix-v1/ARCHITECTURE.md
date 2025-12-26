# Architecture: lens-hover-fix-v1

## Current State

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT DATA FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User hovers card                                                │
│       ↓                                                          │
│  No state change (no hover tracking)                             │
│       ↓                                                          │
│  No visual feedback                                              │
│                                                                  │
│  User clicks card                                                │
│       ↓                                                          │
│  setPreviewLens(persona.id)                                      │
│       ↓                                                          │
│  isPreviewed = true                                              │
│       ↓                                                          │
│  Solid Select button appears (abrupt)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Target State

```
┌─────────────────────────────────────────────────────────────────┐
│                     TARGET DATA FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User hovers card                                                │
│       ↓                                                          │
│  setHoveredLens(persona.id)                                      │
│       ↓                                                          │
│  isHovered = true                                                │
│       ↓                                                          │
│  Ghost Select button appears                                     │
│  Card border → --glass-border-hover                              │
│  Card bg → --glass-elevated                                      │
│                                                                  │
│  User clicks card                                                │
│       ↓                                                          │
│  setPreviewLens(persona.id)                                      │
│       ↓                                                          │
│  isPreviewed = true                                              │
│       ↓                                                          │
│  Solid Select button (green)                                     │
│  Card border → --neon-green                                      │
│                                                                  │
│  User clicks Select button                                       │
│       ↓                                                          │
│  onSelect(persona.id)                                            │
│  setPreviewLens(null)                                            │
│       ↓                                                          │
│  isSelected = true (via parent state)                            │
│       ↓                                                          │
│  "Active" badge with persona color                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component State Design

### LensGrid Internal State

```typescript
// Existing
const [previewLens, setPreviewLens] = React.useState<string | null>(null);

// New
const [hoveredLens, setHoveredLens] = React.useState<string | null>(null);
```

### State Priority (for button rendering)

```typescript
const buttonState = 
  isSelected ? 'active' :      // Show "Active" badge
  isPreviewed ? 'solid' :      // Show solid Select button
  isHovered ? 'ghost' :        // Show ghost Select button
  'hidden';                    // No button
```

## Token Architecture

### New CSS Classes (globals.css)

```css
/* Glass Select Button - Lens card interactions */
.glass-select-button {
  font-size: 10px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all var(--duration-fast) var(--ease-out-expo);
  cursor: pointer;
}

.glass-select-button--ghost {
  background: transparent;
  border: 1px solid var(--glass-border-hover);
  color: var(--glass-text-muted);
}

.glass-select-button--ghost:hover {
  border-color: var(--neon-green);
  color: var(--neon-green);
}

.glass-select-button--solid {
  background: var(--neon-green);
  border: 1px solid var(--neon-green);
  color: var(--glass-void);
}

.glass-select-button--solid:hover {
  opacity: 0.9;
}
```

### Card Styling Strategy

**Non-selected states:** Use glass tokens exclusively
```typescript
// Default
'bg-[var(--glass-panel)] border-[var(--glass-border)]'

// Hover (CSS handles via hover: prefix)
'hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-elevated)]'

// Preview
'bg-[var(--glass-elevated)] border-[var(--neon-green)] border-2'
```

**Selected state:** Preserve persona colors (brand identity)
```typescript
// Active lens retains persona color scheme
`${colors.bgLight} ${colors.border} border-2`
```

## DEX Compliance

### Declarative Sovereignty
Card states determined by data (`hoveredLens`, `previewLens`, `currentLens`). No hardcoded behavior per lens type.

### Capability Agnosticism
Visual styling independent of AI model. State transitions are user-driven.

### Provenance
Button clicks trace to `onSelect` callback, which traces to engagement machine.

### Organic Scalability
New lenses automatically get hover/preview behavior. No per-lens configuration needed.

## File Changes

| File | Type | Purpose |
|------|------|---------|
| `styles/globals.css` | Modify | Add `.glass-select-button` classes |
| `components/Terminal/LensGrid.tsx` | Modify | Add hover state, update styling |

## Risk Mitigation

### Visual Regression
- Only LensGrid.tsx consumers (WelcomeInterstitial) affected
- Active state unchanged—persona colors preserved
- Preview state enhanced, not replaced

### Token Conflicts
- New classes use existing `--glass-*` and `--neon-*` tokens
- No new token definitions needed
- Button classes namespaced with `glass-select-button`
