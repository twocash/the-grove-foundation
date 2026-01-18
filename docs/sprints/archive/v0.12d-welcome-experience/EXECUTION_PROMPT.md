# Execution Prompt — v0.12d Welcome Experience

## Context
Split the Terminal's LensPicker into two distinct experiences: a WelcomeInterstitial for first-time users that establishes product context, and a streamlined LensPicker for returning users switching lenses. Enable the Create Your Own Lens feature by default with clay orange styling for emphasis.

## Documentation
All sprint documentation is in `docs/sprints/v0.12d-welcome-experience/`:
- `REPO_AUDIT.md` — Current state with verified line numbers
- `SPEC.md` — Goals and acceptance criteria
- `SPRINTS.md` — Story breakdown with file locations
- `TARGET_CONTENT.md` — Exact copy for both components
- `DECISIONS.md` — Architectural decisions and rationale

## Repository Intelligence

| Concern | File | Key Lines |
|---------|------|-----------|
| Terminal State | `components/Terminal.tsx` | 205-213 |
| Feature Flag Hook | `components/Terminal.tsx` | 307 |
| Welcome useEffect | `components/Terminal.tsx` | 361-384 |
| handleLensSelect | `components/Terminal.tsx` | 387-405 |
| handleCreateCustomLens | `components/Terminal.tsx` | 408-411 |
| Render Conditionals | `components/Terminal.tsx` | 932-951 |
| FIRST_TIME_WELCOME | `components/Terminal.tsx` | 50-57 |
| LensPicker Header | `components/Terminal/LensPicker.tsx` | 143-157 |
| LensPicker Icons | `components/Terminal/LensPicker.tsx` | 9-100 |
| EXTENDED_PERSONA_COLORS | `components/Terminal/LensPicker.tsx` | 103-116 |
| Custom Lenses Section | `components/Terminal/LensPicker.tsx` | 163-222 |
| Standard Lenses Section | `components/Terminal/LensPicker.tsx` | 224-265 |
| Create Your Own | `components/Terminal/LensPicker.tsx` | 267-291 |
| LensPicker Footer | `components/Terminal/LensPicker.tsx` | 294-302 |
| Feature Flag (config) | `src/core/config/defaults.ts` | 115-120 |
| Feature Flag (schema) | `data/narratives-schema.ts` | 241-246 |

---

## Phase 1: Extract LensGrid Component

### Step 1.1: Create LensGrid.tsx
1. Create new file `components/Terminal/LensGrid.tsx`
2. Extract the following from LensPicker.tsx:
   - Icons (lines 9-100)
   - EXTENDED_PERSONA_COLORS (lines 103-116)
   - IconComponent helper (line 130)
   - getColors helper (lines 132-136)
   - Custom lenses section (lines 163-222)
   - Standard lenses section (lines 224-265)
   - Create Your Own section (lines 267-291)

3. Use this structure:
```typescript
// LensGrid - Shared lens rendering for WelcomeInterstitial and LensPicker
import React from 'react';
import { Persona, PERSONA_COLORS, PersonaColor, getPersonaColors } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';

// [PASTE: Icons from LensPicker.tsx lines 9-100]

// [PASTE: EXTENDED_PERSONA_COLORS from LensPicker.tsx lines 103-116]

interface LensGridProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  currentLens?: string | null;
  onSelect: (personaId: string | null) => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  showCreateOption?: boolean;
}

const LensGrid: React.FC<LensGridProps> = ({
  personas,
  customLenses = [],
  currentLens,
  onSelect,
  onCreateCustomLens,
  onDeleteCustomLens,
  showCreateOption = true
}) => {
  const IconComponent = (iconName: string) => {
    const Icon = ICONS[iconName] || ICONS.Eye;
    return Icon;
  };

  const getColors = (color: PersonaColor | 'custom' | 'purple') => {
    const mappedColor = color === 'purple' ? 'custom' : color;
    return EXTENDED_PERSONA_COLORS[mappedColor as keyof typeof EXTENDED_PERSONA_COLORS] || PERSONA_COLORS.fig;
  };

  return (
    <div className="space-y-3">
      {/* Custom Lenses Section */}
      {customLenses.length > 0 && (
        <>
          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted pt-2 pb-1">
            Your Custom Lenses
          </div>
          {/* [PASTE: Custom lens mapping from lines 166-218] */}
          <div className="border-t border-ink/5 my-3" />
        </>
      )}

      {/* Standard Lenses Section Header (only if custom lenses exist) */}
      {customLenses.length > 0 && (
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted pt-1 pb-1">
          Standard Lenses
        </div>
      )}

      {/* [PASTE: Standard persona mapping from lines 228-264] */}

      {/* "Create Your Own" Option - CLAY ORANGE dashed border for emphasis */}
      {showCreateOption && onCreateCustomLens && (
        <>
          <div className="border-t border-ink/5 my-3" />
          <button
            onClick={onCreateCustomLens}
            className="w-full text-left p-4 rounded-lg border-2 border-dashed border-grove-clay/40 
                       transition-all duration-200 group 
                       hover:border-grove-clay hover:bg-grove-clay/5"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-grove-clay/10 group-hover:bg-grove-clay/20 transition-colors">
                <ICONS.Sparkles className="w-5 h-5 text-grove-clay/60 group-hover:text-grove-clay" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-sans font-medium text-sm text-grove-clay/80 group-hover:text-grove-clay">
                  Create your own lens
                </div>
                <div className="font-serif text-xs text-ink-muted italic mt-0.5">
                  "Build a lens that's uniquely yours"
                </div>
              </div>
              <ICONS.Plus className="w-4 h-4 text-grove-clay/40 group-hover:text-grove-clay self-center" />
            </div>
          </button>
        </>
      )}
    </div>
  );
};

export default LensGrid;
```

### Step 1.2: Refactor LensPicker to Use LensGrid
1. Open `components/Terminal/LensPicker.tsx`
2. Add import at top: `import LensGrid from './LensGrid';`
3. Remove lines 9-116 (icons and color mappings - now in LensGrid)
4. Remove lines 130-136 (IconComponent and getColors - now in LensGrid)
5. Replace lines 159-292 (the entire `{/* Persona Options */}` div contents) with:
```tsx
{/* Lens Selection */}
<div className="flex-1 overflow-y-auto p-4">
  <LensGrid
    personas={personas}
    customLenses={customLenses}
    currentLens={currentLens}
    onSelect={onSelect}
    onCreateCustomLens={onCreateCustomLens}
    onDeleteCustomLens={onDeleteCustomLens}
    showCreateOption={showCreateOption}
  />
</div>
```

6. Run `npm run build`

---

## Phase 2: Create WelcomeInterstitial Component

### Step 2.1: Create WelcomeInterstitial.tsx
Create new file `components/Terminal/WelcomeInterstitial.tsx`:

```tsx
// WelcomeInterstitial - First-open experience for new Terminal users
// Shows welcome copy + lens selection to establish product context

import React from 'react';
import { Persona } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';
import LensGrid from './LensGrid';

interface WelcomeInterstitialProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  onSelect: (personaId: string | null) => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  showCreateOption?: boolean;
}

const WELCOME_COPY = `Welcome to The Grove.

You're inside the Terminal — engaging with your own personal AI. In this demo, we explore complex ideas through conversation. Everything written about The Grove Foundation is indexed here.

Choose a lens to shape how we explore the subject matter in a way most relevant to you. Each lens emphasizes different aspects of this groundbreaking initiative. You can switch lenses anytime in your journey. And we recommend it!`;

const WelcomeInterstitial: React.FC<WelcomeInterstitialProps> = ({
  personas,
  customLenses = [],
  onSelect,
  onCreateCustomLens,
  onDeleteCustomLens,
  showCreateOption = true
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-6 border-b border-ink/5">
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
          THE GROVE TERMINAL [v2.5.0]
        </div>
        <div className="font-mono text-xs text-grove-forest mb-6">
          Connection established.
        </div>
        
        {/* Welcome Copy */}
        <div className="space-y-4">
          {WELCOME_COPY.split('\n\n').map((paragraph, i) => (
            <p key={i} className={`font-serif text-sm leading-relaxed ${i === 0 ? 'text-ink font-medium' : 'text-ink-muted'}`}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          Select Your Starting Lens
        </div>
      </div>

      {/* Lens Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <LensGrid
          personas={personas}
          customLenses={customLenses}
          onSelect={onSelect}
          onCreateCustomLens={onCreateCustomLens}
          onDeleteCustomLens={onDeleteCustomLens}
          showCreateOption={showCreateOption}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
        <p className="text-[10px] text-ink-muted text-center">
          You can switch lenses anytime by clicking on your lens in the Terminal.
        </p>
      </div>
    </div>
  );
};

export default WelcomeInterstitial;
```

### Step 2.2: Add State to Terminal
1. Open `components/Terminal.tsx`
2. Find line 205 (state declarations)
3. Add after `const [hasShownWelcome, setHasShownWelcome] = useState<boolean>(false);`:
```typescript
const [showWelcomeInterstitial, setShowWelcomeInterstitial] = useState<boolean>(false);
```

### Step 2.3: Update Welcome Flow Logic
1. Find the welcome useEffect at lines 361-384
2. Replace the entire useEffect with:
```typescript
// Check if we should show welcome interstitial on first open
useEffect(() => {
  const hasBeenWelcomed = localStorage.getItem('grove-terminal-welcomed') === 'true';

  if (terminalState.isOpen && !hasBeenWelcomed && !hasShownWelcome) {
    // Show welcome interstitial instead of injecting chat message
    setShowWelcomeInterstitial(true);
    setHasShownWelcome(true);
  }
}, [terminalState.isOpen, hasShownWelcome]);
```

### Step 2.4: Add Welcome Handlers
Add these handlers after `handleCreateCustomLens` (around line 411):
```typescript
// Handle lens selection from welcome interstitial
const handleWelcomeLensSelect = (personaId: string | null) => {
  selectLens(personaId);
  setShowWelcomeInterstitial(false);
  localStorage.setItem('grove-terminal-welcomed', 'true');

  // Track lens activation
  if (personaId) {
    trackLensActivated(personaId, personaId.startsWith('custom-'));
    emit.lensSelected(personaId, personaId.startsWith('custom-'), currentArchetypeId || undefined);
    emit.journeyStarted(personaId, currentThread.length || 5);
  }

  if (personaId?.startsWith('custom-')) {
    updateCustomLensUsage(personaId);
  }
};

// Handle Create Your Own from welcome interstitial
const handleWelcomeCreateCustomLens = () => {
  setShowWelcomeInterstitial(false);
  setShowCustomLensWizard(true);
};
```

### Step 2.5: Render WelcomeInterstitial
1. Add import at top of Terminal.tsx (around line 20):
```typescript
import WelcomeInterstitial from './Terminal/WelcomeInterstitial';
```

2. Find render conditionals at line 932
3. Replace the conditional block with:
```tsx
{/* Show Custom Lens Wizard, Welcome Interstitial, Lens Picker, or Main Terminal */}
{showCustomLensWizard ? (
  <CustomLensWizard
    onComplete={handleCustomLensComplete}
    onCancel={handleCustomLensCancel}
  />
) : showWelcomeInterstitial ? (
  <WelcomeInterstitial
    personas={enabledPersonas}
    customLenses={customLenses}
    onSelect={handleWelcomeLensSelect}
    onCreateCustomLens={handleWelcomeCreateCustomLens}
    onDeleteCustomLens={handleDeleteCustomLens}
    showCreateOption={showCustomLensInPicker}
  />
) : showLensPicker ? (
  <LensPicker
    personas={enabledPersonas}
    customLenses={customLenses}
    onSelect={handleLensSelect}
    onCreateCustomLens={handleCreateCustomLens}
    onDeleteCustomLens={handleDeleteCustomLens}
    currentLens={session.activeLens}
    showCreateOption={showCustomLensInPicker}
  />
) : (
```

4. Run `npm run build`

---

## Phase 3: Refactor LensPicker for Switching

### Step 3.1: Update LensPicker Header
1. Open `components/Terminal/LensPicker.tsx`
2. Find header section (now around line 20-35 after refactor)
3. Replace with:
```tsx
{/* Header */}
<div className="px-4 py-6 border-b border-ink/5">
  <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-4">
    THE GROVE TERMINAL [v2.5.0]
  </div>
  <h2 className="font-display text-xl text-ink mb-2">
    Switch Lens
  </h2>
  <p className="font-serif text-sm text-ink-muted italic">
    Change your perspective on the subject matter.
  </p>
</div>
```

### Step 3.2: Update LensPicker Footer
1. Find footer section (near end of file)
2. Replace with:
```tsx
{/* Footer */}
<div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
  <p className="text-[10px] text-ink-muted text-center">
    Your current lens shapes how we explore topics together.
  </p>
</div>
```

3. Run `npm run build`

---

## Phase 4: Enable Create Your Own by Default

### Step 4.1: Update defaults.ts
1. Open `src/core/config/defaults.ts`
2. Find line 119 (`enabled: false` for custom-lens-in-picker)
3. Change to `enabled: true`

### Step 4.2: Update narratives-schema.ts
1. Open `data/narratives-schema.ts`
2. Find line 245 (`enabled: false` for custom-lens-in-picker)
3. Change to `enabled: true`

4. Run `npm run build`

---

## Phase 5: Cleanup

### Step 5.1: Remove FIRST_TIME_WELCOME
1. Open `components/Terminal.tsx`
2. Find lines 50-57 (FIRST_TIME_WELCOME constant)
3. Delete the entire constant block

### Step 5.2: Update Terminal/index.ts (if needed)
1. Check if `components/Terminal/index.ts` exists
2. If so, add exports:
```typescript
export { default as LensGrid } from './LensGrid';
export { default as WelcomeInterstitial } from './WelcomeInterstitial';
```

3. Run `npm run build`

---

## Build Verification
Run after each phase:
```bash
npm run build
```
Build must pass before proceeding to next phase.

## Citation Format
When reporting changes, cite as: `path:lineStart-lineEnd`

Example:
- Modified `components/Terminal.tsx:205-210` — Added showWelcomeInterstitial state
- Created `components/Terminal/LensGrid.tsx` — Extracted lens rendering

---

## Testing After Completion

### Test 1: Welcome Flow (New User)
1. Clear localStorage: `localStorage.removeItem('grove-terminal-welcomed')`
2. Refresh page
3. Open Terminal
4. **Verify:** WelcomeInterstitial appears (not LensPicker)
5. **Verify:** Welcome copy matches TARGET_CONTENT.md
6. **Verify:** All lenses visible + Create Your Own option with clay orange border
7. Select a lens
8. **Verify:** Interstitial closes, chat is ready

### Test 2: Welcome Persistence
1. Close Terminal
2. Reopen Terminal
3. **Verify:** WelcomeInterstitial does NOT appear
4. **Verify:** Normal chat view shows

### Test 3: Lens Switching (Returning User)
1. Click lens pill button at bottom
2. **Verify:** LensPicker appears (not WelcomeInterstitial)
3. **Verify:** Header says "Switch Lens"
4. **Verify:** Create Your Own option visible with clay orange border
5. Select different lens
6. **Verify:** Picker closes, lens changed

### Test 4: Create Your Own Styling
1. Open LensPicker (pill click) or WelcomeInterstitial (clear localStorage)
2. **Verify:** Create Your Own card has:
   - Clay orange dashed border (`border-grove-clay/40`)
   - Clay orange hover state
   - Clay orange icon tint
3. **Verify:** Distinct from other lens cards

### Test 5: Create Your Own from Welcome
1. Clear localStorage
2. Open Terminal (WelcomeInterstitial shows)
3. Click Create Your Own
4. **Verify:** CustomLensWizard opens
5. Cancel wizard
6. **Verify:** Returns to WelcomeInterstitial (not LensPicker)

### Test 6: Create Your Own from Switcher
1. Ensure welcomed (localStorage set)
2. Click lens pill
3. Click Create Your Own
4. Cancel wizard
5. **Verify:** Returns to LensPicker

---

## Forbidden Actions
- Do NOT modify CustomLensWizard component
- Do NOT change the chat API or backend
- Do NOT modify lens definitions or personas
- Do NOT add new localStorage keys
- Do NOT change the lens pill button (done in v0.12c)
- Do NOT skip build verification between phases
