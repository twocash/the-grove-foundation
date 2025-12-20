# Development Log — v0.12e Minimalist Orchard

## Sprint Status: COMPLETE

## Objective
Make the first-time experience bulletproof: terminal open by default, URL lens highlighting, referrer tracking, and guaranteed welcome flow for new users.

## Strategic Context
> "Show the Orchard, Not the Seed"

When someone visits The Grove (especially via a shared link), they should immediately see the full experience with the terminal open. If they came with a specific lens, that lens should be highlighted and ready for selection.

---

## Execution Log

### Phase 1: Terminal Open by Default
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Change isOpen default to true | ✅ | GenesisPage.tsx line 49 |

**Build gate:** ✅

---

### Phase 2: Referrer Tracking
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Add STORAGE_KEY_REFERRER | ✅ | localStorage key |
| Create captureReferrer() | ✅ | Stores ?r= param with timestamp |
| Create isReturningUser() | ✅ | Checks for existing Grove state |
| Create getStoredReferrer() | ✅ | Retrieves stored referrer data |
| Add referrer to context | ✅ | Exposed via useNarrativeEngine |
| Add isFirstTimeUser to context | ✅ | For conditional flows |

**Build gate:** ✅

---

### Phase 3: URL Lens Highlighting
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Add urlLensId to NarrativeEngineContext | ✅ | Captures ?lens= param |
| Add highlightedLens prop to LensGrid | ✅ | Visual treatment |
| Add highlightedLens prop to LensPicker | ✅ | Pass-through |
| Add "Shared with you" badge | ✅ | Clay orange styling |
| Wire urlLensId through Terminal | ✅ | Complete chain |

**Build gate:** ✅

---

### Phase 4: First-Time User Welcome
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| Update welcome logic for URL lens | ✅ | Shows LensPicker if ?lens= present |
| Welcome interstitial for new users | ✅ | No URL = welcome flow |
| localStorage state detection | ✅ | isReturningUser() utility |

**Build gate:** ✅

---

## Files Changed

| File | Change Type | Purpose |
|------|-------------|---------|
| `src/surface/pages/GenesisPage.tsx` | MODIFY | Terminal open by default |
| `hooks/NarrativeEngineContext.tsx` | MODIFY | Referrer tracking, urlLensId, isFirstTimeUser |
| `components/Terminal.tsx` | MODIFY | URL lens logic, pass highlightedLens |
| `components/Terminal/LensGrid.tsx` | MODIFY | highlightedLens visual treatment |
| `components/Terminal/LensPicker.tsx` | MODIFY | highlightedLens prop |

---

## User Flow

### First Visit (No Referrer, No State)
1. Terminal opens automatically
2. Welcome interstitial displayed
3. User selects lens, starts exploring

### Visit with URL Lens (?lens=academic)
1. Terminal opens automatically
2. LensPicker displayed (not welcome)
3. "Academic" lens highlighted with "Shared with you" badge
4. User clicks to select, starts exploring

### Visit with Referrer (?r=friend123)
1. Referrer code stored in localStorage with timestamp
2. Used for future social graph / seeding features
3. Terminal opens, normal welcome flow

### Returning User
1. Terminal opens
2. Previous lens restored from localStorage
3. Normal terminal experience

---

## Known Issues
None encountered during sprint.

---

## Post-Sprint Notes

The "minimalist orchard" approach ensures every visitor sees the full experience immediately. The terminal-first design means:
- No hidden features
- No scroll-to-find UX
- Immediate engagement with the core product

The referrer tracking infrastructure prepares for future social graph features where users can earn "grove seedings" for bringing others to the platform.

**Completed:** 2025-12-20
