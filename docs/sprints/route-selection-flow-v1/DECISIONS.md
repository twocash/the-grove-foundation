# Architectural Decisions: route-selection-flow-v1

## ADR-001: Route-Based Selection vs Modal/Inline

### Context
Currently, lens selection happens inline (WelcomeInterstitial) and journey selection happens via modal (JourneysModal). Both duplicate logic that exists at canonical routes.

### Decision
**Use route-based selection flow for all selection interactions.**

### Rationale
- **Single canonical source** — LensGrid renders once, styled once, tested once
- **Consistent UX** — Selection always happens at full page view
- **Simpler state** — No modal/preview state management
- **Back button works** — Browser navigation is natural
- **Accessible** — Full page > overlay for screen readers

### Rejected Alternatives
- **Keep modals:** Creates duplicate code, different UX
- **Inline with shared component:** Still requires variant props, styling branches
- **Context menu:** Poor mobile experience, limited space

---

## ADR-002: URL Params for Flow Control, Not State

### Context
When navigating from Terminal to /lenses, need to know where to return. Options:
1. Pass state through URL (?lens=x&returnTo=...)
2. Pass flow params only, state in context
3. Pass everything through React context

### Decision
**URL carries flow control (returnTo, ctaLabel). State lives in engagement machine.**

### Rationale
- **Separation of concerns** — URL is for navigation, not data
- **Cleaner URLs** — `/lenses?returnTo=/terminal` vs `/lenses?returnTo=/terminal&currentLens=x&prevLens=y`
- **State survives navigation** — Engagement machine persists
- **Shareable URLs** — User can share /lenses without leaking state

### Rejected Alternatives
- **Full state in URL:** Cluttered, synchronization issues
- **All in context:** Loses browser back/forward semantics
- **Local storage:** Overly persistent, hard to clear

---

## ADR-003: Conditional CTA vs Always-Present Button

### Context
When user arrives at /lenses via returnTo flow, should the CTA:
1. Always be visible
2. Only visible after selection
3. Configurable per flow

### Decision
**CTA appears only after selection when in flow. Configurable via ctaCondition param (future).**

### Rationale
- **Clear intent signal** — CTA appearing confirms "you've made a choice"
- **Reduces premature navigation** — User won't accidentally click before selecting
- **Browsing mode unchanged** — Direct visitors see no CTA
- **Future flexibility** — ctaCondition param allows different behaviors

### Rejected Alternatives
- **Always visible:** Confusing in browse mode, premature in flow
- **Never visible (rely on nav):** Loses flow context, user may forget
- **Selection auto-navigates:** Too aggressive, no confirmation

---

## ADR-004: ModuleHeader vs Extending CollectionHeader

### Context
CollectionHeader exists with title/description/search/filter/sort. Need to add contextual features slot.

### Decision
**Create ModuleHeader as new component that composes CollectionHeader patterns but adds contextual features.**

### Rationale
- **Don't break existing** — CollectionHeader consumers unchanged
- **Different concerns** — CollectionHeader is content-focused; ModuleHeader is shell-focused
- **Cleaner API** — ModuleHeader has simpler required props
- **Reuse parts** — Can import SearchInput, FilterButton from shared

### Rejected Alternatives
- **Extend CollectionHeader:** Would change existing consumers' API
- **Add slot to CollectionHeader:** Clutters a focused component
- **No abstraction:** Each module has different header = inconsistent UX

---

## ADR-005: Fixed Position FlowCTA vs Inline

### Context
When FlowCTA appears, where should it render?

### Decision
**Fixed position bottom-right for selection flows.**

### Rationale
- **Always visible** — Doesn't scroll away with content
- **Consistent position** — User learns where to look
- **Doesn't affect layout** — Grid/list content unchanged
- **Mobile friendly** — Thumb zone on mobile devices

### Rejected Alternatives
- **Inline at bottom of list:** Scrolls away, lost context
- **In header:** Too far from selection, cramped
- **Floating action button pattern:** Too subtle for important action

---

## ADR-006: Remove JourneysModal vs Keep Both

### Context
JourneysModal provides quick journey access from Terminal header. Should we:
1. Remove modal, use route only
2. Keep modal for quick access, route for full browse
3. Replace modal with dropdown

### Decision
**Remove JourneysModal. Route-based selection only.**

### Rationale
- **Single pattern** — Consistency over micro-optimization
- **Eliminates duplicate code** — Modal selection logic removed
- **Full context** — Route provides more space for journey details
- **Back button works** — Modal doesn't support browser nav

### Rejected Alternatives
- **Keep both:** Maintenance burden, inconsistent UX
- **Dropdown in header:** Limited space, poor mobile experience
- **Bottom sheet:** Custom pattern, not standard for web

---

## ADR-007: WelcomeInterstitial Simplification Scope

### Context
WelcomeInterstitial currently shows welcome copy + embedded LensGrid. Should it:
1. Just show copy + CTA button
2. Show copy + mini lens preview + CTA
3. Show copy + recommended lens + CTA

### Decision
**Simplest form: copy + single CTA button.**

### Rationale
- **Clear call to action** — One thing to do, one button to click
- **Fastest path** — User gets to lens selection immediately
- **No duplicate rendering** — Full experience at /lenses
- **Testable** — Single code path

### Rejected Alternatives
- **Mini preview:** Still duplicate rendering, incomplete view
- **Recommended lens:** Requires logic, reduces agency
- **Auto-redirect:** Skips welcome copy, jarring

---

## ADR-008: Keep LensGrid vs Inline Everything in LensPicker

### Context
LensGrid is currently shared between WelcomeInterstitial and LensPicker. After removing inline usage, should we:
1. Keep LensGrid as separate component
2. Inline LensGrid into LensPicker
3. Create new CanonicalLensGrid

### Decision
**Keep LensGrid as separate component in components/Terminal/.**

### Rationale
- **Separation of concerns** — Grid rendering vs page layout
- **Potential reuse** — May want grid in other contexts (widget, embed)
- **Easier testing** — Test grid in isolation
- **Gradual migration** — Can refactor location later

### Rejected Alternatives
- **Inline into LensPicker:** Harder to test, monolithic
- **Move to src/explore/:** Larger refactor, breaks imports

---

## Summary

| Decision | Choice |
|----------|--------|
| Selection pattern | Route-based, not modal/inline |
| URL params | Flow control only, state in XState |
| CTA visibility | After selection when in flow |
| Header component | New ModuleHeader |
| CTA position | Fixed bottom-right |
| JourneysModal | Remove entirely |
| WelcomeInterstitial | Copy + single CTA |
| LensGrid | Keep as separate component |
