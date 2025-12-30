# REPO_AUDIT.md — kinetic-context-v1

**Sprint Goal:** Migrate Terminal's context personalization patterns to Kinetic Stream, including header pills, personalized welcome, and picker overlays.

## 1. TERMINAL PATTERNS TO MIGRATE

### TerminalHeader (`components/Terminal/TerminalHeader.tsx`)
- Lens pill with color dot, clickable to open picker
- Journey pill, clickable to open picker
- Stage indicator (ARRIVAL → ORIENTED → EXPLORING → ENGAGED)
- Streak display with fire emoji
- Menu button, minimize/close buttons

### TerminalWelcome (`components/Terminal/TerminalWelcome.tsx`)
- Lens-reactive heading and thesis
- Adaptive prompts from `useSuggestedPrompts`
- Stage indicator
- Glass card styling

### Quantum Content (`src/data/quantum-content.ts`)
- `getTerminalWelcome(lensId, schemaRealities)` → TerminalWelcome object
- Per-lens: heading, thesis, prompts, footer, placeholder
- Falls back to DEFAULT_TERMINAL_WELCOME

### useSuggestedPrompts (`hooks/useSuggestedPrompts.ts`)
- Stage-aware prompt generation
- Returns: prompts[], stage, refreshPrompts()

### TerminalOverlayRenderer (`components/Terminal/TerminalOverlayRenderer.tsx`)
- Renders LensPicker, JourneyPicker, WelcomeInterstitial
- Uses overlay state machine pattern

## 2. CURRENT KINETIC STREAM STATE

### ExploreShell.tsx
```typescript
// Current header (line 84-89)
<header className="flex-none p-4 border-b border-[var(--glass-border)]">
  <h1 className="text-base font-sans font-semibold text-[var(--glass-text-primary)]">
    Explore The Grove
  </h1>
</header>
```

**Missing:**
- No lens/journey state
- No personalized welcome
- No picker overlays
- No stage tracking

### useKineticStream.ts
- Manages stream items, submit, loading
- No lens/journey context yet

## 3. FILES TO CREATE

| File | Purpose |
|------|---------|
| `KineticHeader.tsx` | Header with lens/journey pills |
| `KineticWelcome.tsx` | Personalized welcome card |
| `KineticOverlay.tsx` | Picker overlay wrapper |
| `useKineticContext.ts` | Lens/journey state hook |

## 4. FILES TO MODIFY

| File | Change |
|------|--------|
| `ExploreShell.tsx` | Add context state, header, welcome, overlays |
| `ExploreShellProps` | Add callbacks for lens/journey selection |

## 5. DEPENDENCIES TO IMPORT

From Terminal infrastructure:
- `useLensState` from `@core/engagement`
- `useJourneyState` from `@core/engagement`
- `useSuggestedPrompts` from `hooks/useSuggestedPrompts`
- `getTerminalWelcome` from `src/data/quantum-content`
- `LensPicker` from `components/Terminal/LensPicker`
- `getPersonaColors` from `data/narratives-schema`

## 6. STATE MANAGEMENT APPROACH

Option A: Import engagement hooks directly into ExploreShell
Option B: Create useKineticContext wrapper hook

**Decision:** Use Option A initially, refactor to B if complexity grows.

## 7. INTEGRATION POINTS

```typescript
// ExploreShell will need:
const { lens, selectLens } = useLensState({ actor });
const { journey, startJourney, exitJourney } = useJourneyState({ actor });
const { prompts, stage, refreshPrompts } = useSuggestedPrompts({ lensId: lens });
const welcomeContent = getTerminalWelcome(lens, schema?.lensRealities);
```

## 8. OVERLAY STATE PATTERN

From Terminal's `useTerminalState`:
```typescript
type OverlayType = 'none' | 'welcome' | 'lens-picker' | 'journey-picker' | 'wizard' | 'command-palette';

const [overlay, setOverlay] = useState<{ type: OverlayType }>({ type: 'none' });
```

## 9. CSS TOKEN MAPPING

Terminal uses `--chat-*` tokens in embedded mode, `--glass-*` in overlay mode.
Kinetic Stream uses `--glass-*` tokens exclusively.

Verify these tokens exist:
- `--glass-text-primary`
- `--glass-text-secondary`
- `--glass-text-subtle`
- `--glass-border`
- `--glass-elevated`
- `--neon-cyan`
- `--neon-green`

## 10. VERIFICATION CHECKLIST

- [ ] KineticHeader renders with lens/journey pills
- [ ] Clicking lens pill opens LensPicker
- [ ] Selecting lens updates context
- [ ] KineticWelcome shows personalized content
- [ ] Welcome prompts are clickable
- [ ] Stage indicator displays correctly
- [ ] Overlays dismiss properly
- [ ] TypeScript compiles clean

**STATUS: ✅ Ready for Implementation**
