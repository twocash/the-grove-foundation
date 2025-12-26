# Repository Audit: route-selection-flow-v1

## Scope

Replace inline selection pickers with route-based flow. Implement Module Shell Architecture across all Grove modules.

## Current Architecture

### Component Inventory

**Inline Pickers (To Be Removed):**
```
components/Terminal/
├── WelcomeInterstitial.tsx    # Embeds LensGrid (92 lines)
├── LensGrid.tsx               # Shared lens renderer (397 lines)
└── Modals/JourneysModal.tsx   # Modal-based journey picker
```

**Canonical Routes (To Be Enhanced):**
```
src/explore/
├── LensPicker.tsx             # Standalone lens selection
└── JourneyList.tsx            # Standalone journey list
```

**Existing Header Patterns:**
```
src/shared/
├── CollectionHeader.tsx       # Reusable header (106 lines) ✅
├── SearchInput.tsx            # Search component
├── FilterButton.tsx           # Filter dropdown
└── SortButton.tsx             # Sort dropdown

src/workspace/
└── WorkspaceHeader.tsx        # Global header (76 lines)
```

### Current Selection Flows

**Lens Selection (Current):**
```
/terminal (first visit)
    ↓
WelcomeInterstitial renders inline LensGrid
    ↓
User clicks lens → setPreviewLens(id)
    ↓
User clicks Select → onSelect(id)
    ↓
Terminal becomes active with lens
```

**Problems:**
- LensGrid renders differently in WelcomeInterstitial vs LensPicker
- State complexity (preview, embedded modes)
- No way to change lens from active Terminal without reset
- Violates Pattern 8 (Canonical Source Rendering)

**Journey Selection (Current):**
```
Terminal header → Journeys button
    ↓
JourneysModal opens (modal overlay)
    ↓
User selects journey
    ↓
Modal closes, journey active
```

**Problems:**
- Modal is separate from canonical JourneyList
- Different UX from browsing journeys at /journeys
- Modal contains duplicated selection logic

### Existing CollectionHeader (src/shared/CollectionHeader.tsx)

Already implements much of Module Shell Architecture:
```typescript
interface CollectionHeaderProps {
  title: string;
  description: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions?: FilterOption[];
  sortOptions?: SortOption[];
  activeIndicator?: { label, value, icon };
  children?: ReactNode;
}
```

**Gap:** No concept of "contextual features" slot (lens badge, journey badge, etc.)

### Route Structure (src/router/routes.tsx)

| Route | Component | Has Header? |
|-------|-----------|-------------|
| `/terminal` | GroveWorkspace | Custom (WorkspaceHeader) |
| `/foundation` | FoundationWorkspace | Custom (FoundationHeader) |
| `/foundation/lenses` | Content in workspace | Uses CollectionHeader |
| `/foundation/journeys` | Content in workspace | Uses CollectionHeader |

**Gap:** No route-level flow parameters (returnTo, ctaLabel)

## Technical Debt Identified

1. **WelcomeInterstitial** — Should be copy + CTA, not embedded picker
2. **LensGrid variants** — `embedded` prop creates styling divergence
3. **JourneysModal** — Duplicates JourneyList selection logic
4. **No ModuleHeader** — CollectionHeader close but needs contextual features
5. **No flow params** — Routes don't support returnTo patterns

## Dependencies

### Files That Import WelcomeInterstitial
- `components/Terminal/TerminalFlow.tsx`
- `src/widget/views/ChatView.tsx`

### Files That Import LensGrid
- `components/Terminal/WelcomeInterstitial.tsx`
- `src/explore/LensPicker.tsx`

### Files That Import JourneysModal
- `components/Terminal/TerminalHeader.tsx`

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking first-time UX | Medium | High | Test WelcomeInterstitial → /lenses → /terminal flow |
| State loss on navigation | Low | Medium | Persist lens/journey in URL or context |
| Route param edge cases | Low | Low | Unit test flow param parsing |

## Recommendation

1. **Create ModuleHeader** extending CollectionHeader with contextual features slot
2. **Add flow params** to /lenses and /journeys routes
3. **Simplify WelcomeInterstitial** to copy + "Choose a Lens" CTA
4. **Replace JourneysModal** with navigation to /journeys
5. **Remove LensGrid embedded variant** once inline usage eliminated
