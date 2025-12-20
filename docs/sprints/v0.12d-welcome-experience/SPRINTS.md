# Sprint Stories — v0.12d Welcome Experience

## Epic 1: Extract Shared LensGrid (P0)

### Story 1.1: Create LensGrid Component
**File:** Create `components/Terminal/LensGrid.tsx`
**Task:** Extract lens rendering logic from LensPicker into reusable component
**Props:**
```typescript
interface LensGridProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  currentLens?: string | null;
  onSelect: (personaId: string | null) => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  showCreateOption?: boolean;
}
```
**Styling Note:** Create Your Own card uses clay orange dashed border:
```tsx
className="w-full text-left p-4 rounded-lg border-2 border-dashed border-grove-clay/40 
           transition-all duration-200 group 
           hover:border-grove-clay hover:bg-grove-clay/5"
```
**Exports:** `LensGrid`, `LensGridProps`
**Commit:** `refactor(terminal): extract LensGrid component from LensPicker`

### Story 1.2: Refactor LensPicker to Use LensGrid
**File:** `components/Terminal/LensPicker.tsx`
**Lines:** 157-294 (lens rendering section)
**Task:** Replace inline lens rendering with `<LensGrid />` component
**Commit:** `refactor(terminal): LensPicker uses LensGrid component`

---

## Epic 2: Create WelcomeInterstitial (P0)

### Story 2.1: Create WelcomeInterstitial Component
**File:** Create `components/Terminal/WelcomeInterstitial.tsx`
**Task:** New component for first-open experience with:
- Welcome copy (see TARGET_CONTENT)
- LensGrid for lens selection
- Create Your Own always visible
- Footer reassurance
**Exports:** `WelcomeInterstitial`
**Commit:** `feat(terminal): create WelcomeInterstitial component`

### Story 2.2: Add WelcomeInterstitial State to Terminal
**File:** `components/Terminal.tsx`
**Lines:** ~206-210 (state declarations)
**Task:** Add `showWelcomeInterstitial` state variable
**Commit:** `feat(terminal): add showWelcomeInterstitial state`

### Story 2.3: Update Welcome Flow Logic
**File:** `components/Terminal.tsx`
**Lines:** 361-384 (welcome useEffect)
**Task:** 
- Remove chat message injection (welcome copy moves to interstitial)
- Set `showWelcomeInterstitial(true)` instead of `showLensPicker(true)`
- Keep localStorage check and flag setting
**Commit:** `refactor(terminal): welcome flow shows WelcomeInterstitial`

### Story 2.4: Render WelcomeInterstitial in Terminal
**File:** `components/Terminal.tsx`
**Lines:** ~930-950 (component rendering section)
**Task:** Add conditional render for WelcomeInterstitial before LensPicker check
**Commit:** `feat(terminal): render WelcomeInterstitial on first open`

---

## Epic 3: Refactor LensPicker for Switching (P1)

### Story 3.1: Update LensPicker Header
**File:** `components/Terminal/LensPicker.tsx`
**Lines:** 140-155 (header section)
**Task:** 
- Change "Welcome to The Grove" → "Switch Lens"
- Remove "Which lens fits you best?" subhead
- Keep terminal version indicator
**Commit:** `content(terminal): LensPicker header for switching context`

### Story 3.2: Update LensPicker Footer
**File:** `components/Terminal/LensPicker.tsx`
**Lines:** 297-302 (footer section)
**Task:** Update footer copy to switching context
**Commit:** `content(terminal): LensPicker footer for switching context`

---

## Epic 4: Enable Create Your Own by Default (P1)

### Story 4.1: Change Feature Flag Default
**File:** `src/core/config/defaults.ts`
**Lines:** 115-120
**Task:** Change `enabled: false` to `enabled: true` for `custom-lens-in-picker`
**Commit:** `feat(flags): enable custom-lens-in-picker by default`

### Story 4.2: Update narratives-schema.ts Flag Default
**File:** `data/narratives-schema.ts`
**Lines:** 241-246
**Task:** Change `enabled: false` to `enabled: true` (keep in sync)
**Commit:** `feat(flags): sync custom-lens-in-picker default in schema`

---

## Epic 5: Cleanup (P2)

### Story 5.1: Remove FIRST_TIME_WELCOME Constant
**File:** `components/Terminal.tsx`
**Lines:** 50-57
**Task:** Remove unused constant (welcome copy now in WelcomeInterstitial)
**Commit:** `chore(terminal): remove unused FIRST_TIME_WELCOME constant`

### Story 5.2: Update Component Index
**File:** `components/Terminal/index.ts` (if exists)
**Task:** Export WelcomeInterstitial and LensGrid
**Commit:** `chore(terminal): export new components`

---

## Commit Sequence

```
1. refactor(terminal): extract LensGrid component from LensPicker (Epic 1)
2. refactor(terminal): LensPicker uses LensGrid component (Epic 1)
3. feat(terminal): create WelcomeInterstitial component (Epic 2)
4. feat(terminal): add showWelcomeInterstitial state (Epic 2)
5. refactor(terminal): welcome flow shows WelcomeInterstitial (Epic 2)
6. feat(terminal): render WelcomeInterstitial on first open (Epic 2)
7. content(terminal): LensPicker header for switching context (Epic 3)
8. content(terminal): LensPicker footer for switching context (Epic 3)
9. feat(flags): enable custom-lens-in-picker by default (Epic 4)
10. feat(flags): sync custom-lens-in-picker default in schema (Epic 4)
11. chore(terminal): remove unused FIRST_TIME_WELCOME constant (Epic 5)
12. docs: update DEVLOG with v0.12d completion
```

## Build Gates
- After Epic 1: `npm run build` ✓
- After Epic 2: `npm run build` ✓
- After Epic 3: `npm run build` ✓
- After Epic 4: `npm run build` ✓
- After Epic 5: `npm run build` ✓

## Smoke Test Checklist
- [ ] Clear localStorage, open Terminal → WelcomeInterstitial appears
- [ ] WelcomeInterstitial shows approved welcome copy
- [ ] WelcomeInterstitial shows all lenses + Create Your Own
- [ ] Select lens from WelcomeInterstitial → closes, chat ready
- [ ] Reopen Terminal → no WelcomeInterstitial (localStorage works)
- [ ] Click lens pill → LensPicker appears (not WelcomeInterstitial)
- [ ] LensPicker shows "Switch Lens" header
- [ ] LensPicker shows Create Your Own option
- [ ] Create Your Own → CustomLensWizard opens
- [ ] Complete wizard → new lens active, picker closes
- [ ] Cancel wizard → returns to picker (not interstitial)
- [ ] Build passes with no errors
- [ ] No console errors in browser
