# Repository Audit: lens-hover-fix-v1

## Scope

Lens card rendering in WelcomeInterstitial (Terminal first-open experience).

## Current Architecture

### File Structure

```
components/Terminal/
├── WelcomeInterstitial.tsx    # Welcome copy + lens selection wrapper
├── LensGrid.tsx               # CANONICAL lens card renderer (397 lines)
└── LensBadge.tsx              # Active lens indicator (separate concern)
```

### LensGrid.tsx Analysis

**Purpose:** Shared lens rendering for WelcomeInterstitial and LensPicker.

**State Management:**
```typescript
const [previewLens, setPreviewLens] = React.useState<string | null>(null);
const highlightedLens = previewLens || externalHighlightedLens;
```

**Current Styling Approach:**
- Inline Tailwind classes with persona color interpolation
- `EXTENDED_PERSONA_COLORS` map for color lookups
- No hover state tracking (only preview/selected)
- Hardcoded ring/border classes for highlight states

**Problem Areas:**

1. **No hover affordance:**
   ```typescript
   // Only shows button when isPreviewed (clicked)
   {isPreviewed ? (
     <button>Select</button>
   ) : null}
   ```

2. **Inline color logic violates Pattern 4:**
   ```typescript
   // Scattered throughout component
   className={`${colors.bgLight} ${colors.border} border-2`}
   ```

3. **Highlight ring uses arbitrary values:**
   ```typescript
   // Not using glass token system
   className="ring-2 ring-offset-1 ring-grove-clay/20"
   ```

### Quantum Glass Token System (globals.css)

**Available tokens:**
```css
--glass-panel: rgba(17, 24, 39, 0.6);
--glass-solid: #111827;
--glass-elevated: rgba(30, 41, 59, 0.4);
--glass-border: #1e293b;
--glass-border-hover: #334155;
--glass-border-active: rgba(16, 185, 129, 0.5);
--neon-green: #10b981;
--neon-cyan: #06b6d4;
```

**Existing glass card classes:**
```css
.glass-card { /* Base interactive card */ }
.glass-card:hover { border-color: var(--glass-border-hover); }
.glass-card[data-selected="true"] { /* Cyan glow */ }
.glass-card[data-active="true"] { /* Green gradient */ }
```

**Missing:** Button variant classes for ghost/solid states.

## Canonical Source Audit

| Capability | Canonical Home | Status |
|------------|----------------|--------|
| Lens card rendering | `LensGrid.tsx` | ✅ Canonical |
| Card styling | `globals.css` (.glass-card) | ⚠️ Not used by LensGrid |
| Persona colors | `narratives-schema.ts` | ✅ Used for Active state |
| Select button | None | 🆕 Needs creation |

## Technical Debt Identified

1. **Style inconsistency:** LensGrid uses inline Tailwind; rest of app uses glass tokens
2. **Missing hover state:** Cards appear static until clicked
3. **No button token system:** Ad-hoc button styling throughout

## Dependencies

- `data/narratives-schema.ts` → PERSONA_COLORS, getPersonaColors
- `types/lens.ts` → CustomLens type
- `styles/globals.css` → Glass token system

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Visual regression in other lens consumers | Low | Medium | LensGrid is only consumer |
| Persona color loss | Low | High | Keep persona colors for Active state only |
| Token conflicts | Low | Low | Use existing namespace |

## Recommendation

1. Add `hoveredLens` state to LensGrid
2. Create `.glass-select-button` token classes
3. Refactor non-Active states to use glass tokens
4. Preserve persona colors for Active state (brand identity)
