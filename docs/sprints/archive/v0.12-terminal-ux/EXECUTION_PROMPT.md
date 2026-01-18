# Execution Prompt — Terminal UX v0.12

## Context
Transform the Terminal from "The Terminal" into "Your Grove" — warm, modern, Apple-like. Add minimize-to-pill capability, simplify header, move controls below input, and make AI suggestions clickable. All changes preserve existing functionality while improving UX.

## Documentation
All sprint documentation is in `docs/sprints/v0.12-terminal-ux/`:
- `REPO_AUDIT.md` — Codebase analysis with line citations
- `SPEC.md` — Goals and acceptance criteria
- `DECISIONS.md` — Architecture decisions (ADR-001 through ADR-005)
- `SPRINTS.md` — Story breakdown with file locations

**Read SPEC.md and DECISIONS.md before starting.**

## Repository Intelligence

### Critical Files
| Purpose | File | Notes |
|---------|------|-------|
| Main Terminal | `components/Terminal.tsx:1-1267` | Monolithic — be careful |
| Subcomponents | `components/Terminal/` | Add new components here |
| Barrel Export | `components/Terminal/index.ts` | Add exports for new components |
| Types | `src/core/schema/base.ts:27-32` | TerminalState interface |
| Feature Flags | `data/narratives.json` | globalSettings.featureFlags |
| Telemetry | `utils/funnelAnalytics.ts` | Add tracking functions |
| Styles | `styles/globals.css` | Add animations here |

### Design Tokens (Use These)
```
bg-paper, bg-paper-dark     — backgrounds
text-ink, text-ink-muted    — text colors
text-grove-forest           — accent (green)
text-grove-clay             — highlight (orange)
border-ink/10, border-ink/20 — subtle borders
font-serif (Lora)           — body text
font-display (Playfair)     — headlines
font-mono (JetBrains Mono)  — meta text
```

### Feature Flag Hook
```typescript
import { useFeatureFlag } from '../hooks/useFeatureFlags';
const showMinimize = useFeatureFlag('terminal-minimize');
```

---

## Execution Order

### Phase 1: Types & Flags

1. **Extend TerminalState** (`src/core/schema/base.ts:27-32`)
```typescript
export interface TerminalState {
  isOpen: boolean;
  isMinimized?: boolean;  // ADD THIS
  messages: ChatMessage[];
  isLoading: boolean;
}
```

2. **Add Feature Flags** (`data/narratives.json`)
Add to `globalSettings.featureFlags` array:
```json
{
  "id": "terminal-minimize",
  "name": "Terminal Minimize",
  "description": "Enable minimize to pill functionality",
  "enabled": true
},
{
  "id": "terminal-controls-below",
  "name": "Controls Below Input",
  "description": "Move lens/journey controls below input",
  "enabled": true
}
```

3. Run `npm run build`

---

### Phase 2: TerminalPill Component

1. **Create** `components/Terminal/TerminalPill.tsx`:
```typescript
import React from 'react';

interface TerminalPillProps {
  isLoading: boolean;
  onExpand: () => void;
}

const TerminalPill: React.FC<TerminalPillProps> = ({ isLoading, onExpand }) => {
  return (
    <button
      onClick={onExpand}
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between px-4 py-3 bg-paper border border-ink/10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">🌱</span>
        <span className="font-display font-bold text-ink">
          {isLoading ? 'Your Grove is thinking...' : 'Your Grove'}
        </span>
      </div>
      <svg className="w-5 h-5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
};

export default TerminalPill;
```

2. **Export** in `components/Terminal/index.ts`:
```typescript
export { default as TerminalPill } from './TerminalPill';
```

3. Run `npm run build`

---

### Phase 3: TerminalHeader Component

1. **Create** `components/Terminal/TerminalHeader.tsx`:
```typescript
import React from 'react';

interface TerminalHeaderProps {
  onMenuClick?: () => void;
  onMinimize: () => void;
  isScholarMode: boolean;
}

const TerminalHeader: React.FC<TerminalHeaderProps> = ({ 
  onMenuClick, 
  onMinimize, 
  isScholarMode 
}) => {
  return (
    <div className="px-4 py-3 border-b border-ink/5 bg-white flex items-center justify-between">
      {/* Menu button (future) */}
      <button 
        onClick={onMenuClick}
        className="p-1 text-ink-muted hover:text-ink transition-colors"
        disabled={!onMenuClick}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Title */}
      <div className="flex items-center space-x-2">
        <span className="font-display font-bold text-base text-ink">Your Grove</span>
        {isScholarMode && (
          <span className="bg-grove-clay text-white px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase">
            Scholar
          </span>
        )}
      </div>

      {/* Minimize button */}
      <button 
        onClick={onMinimize}
        className="p-1 text-ink-muted hover:text-ink transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
    </div>
  );
};

export default TerminalHeader;
```

2. **Export** in `components/Terminal/index.ts`

3. **Replace header** in `Terminal.tsx:889-901`:
- Import `TerminalHeader`
- Replace inline header JSX with:
```tsx
<TerminalHeader
  onMinimize={handleMinimize}
  isScholarMode={isVerboseMode}
/>
```

4. Run `npm run build`

---

### Phase 4: Minimize Logic

1. **Add state** in `Terminal.tsx` (around line 250):
```typescript
const [isMinimized, setIsMinimized] = useState(false);

const handleMinimize = () => {
  setIsMinimized(true);
  trackTerminalMinimized();
};

const handleExpand = () => {
  setIsMinimized(false);
  trackTerminalExpanded();
};

// Update toggleTerminal
const toggleTerminal = () => {
  if (!terminalState.isOpen) {
    setTerminalState(prev => ({ ...prev, isOpen: true }));
    setIsMinimized(false);
  } else if (isMinimized) {
    setIsMinimized(false);
  } else {
    setTerminalState(prev => ({ ...prev, isOpen: false }));
    setIsMinimized(false);
  }
};
```

2. **Update render** in `Terminal.tsx` return statement:
```tsx
return (
  <>
    {/* FAB - only show when Terminal closed */}
    {!terminalState.isOpen && (
      <button onClick={toggleTerminal} className="fixed bottom-8 right-8 ...">
        {/* existing FAB content */}
      </button>
    )}

    {/* Pill - show when minimized */}
    {terminalState.isOpen && isMinimized && (
      <TerminalPill
        isLoading={terminalState.isLoading}
        onExpand={handleExpand}
      />
    )}

    {/* Drawer - show when open and not minimized */}
    {terminalState.isOpen && !isMinimized && (
      <div className="fixed inset-y-0 right-0 z-[60] ...">
        {/* existing drawer content */}
      </div>
    )}

    {/* Reveal overlays stay as-is */}
  </>
);
```

3. **Add telemetry** in `utils/funnelAnalytics.ts`:
```typescript
export const trackTerminalMinimized = () => {
  trackEvent('terminal_minimized', {});
};

export const trackTerminalExpanded = () => {
  trackEvent('terminal_expanded', {});
};
```

4. Run `npm run build`

---

### Phase 5: TerminalControls Component

1. **Create** `components/Terminal/TerminalControls.tsx`:
```typescript
import React from 'react';
import { Persona, getPersonaColors } from '../../data/narratives-schema';

interface TerminalControlsProps {
  persona: Persona | null;
  onSwitchLens: () => void;
  currentPosition: number;
  totalSteps: number;
  currentStreak: number;
  showStreak: boolean;
  showJourney: boolean;
}

const TerminalControls: React.FC<TerminalControlsProps> = ({
  persona,
  onSwitchLens,
  currentPosition,
  totalSteps,
  currentStreak,
  showStreak,
  showJourney
}) => {
  const colors = persona ? getPersonaColors(persona.color) : null;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-ink/5 bg-paper/50">
      {/* Lens Badge */}
      <button
        onClick={onSwitchLens}
        className="flex items-center space-x-2 group"
      >
        {persona ? (
          <>
            <span className={`w-2 h-2 rounded-full ${colors?.dot || 'bg-ink/30'}`} />
            <span className="text-[11px] font-sans font-medium text-ink">
              {persona.publicLabel}
            </span>
          </>
        ) : (
          <span className="text-[11px] font-sans text-ink-muted">
            Choose a lens
          </span>
        )}
        <span className="text-[9px] text-ink-muted group-hover:text-grove-forest transition-colors">
          ↔
        </span>
      </button>

      {/* Journey Progress */}
      {showJourney && totalSteps > 0 && (
        <span className="text-[10px] font-mono text-ink-muted">
          Step {currentPosition + 1}/{totalSteps}
        </span>
      )}

      {/* Streak */}
      {showStreak && currentStreak > 0 && (
        <div className="flex items-center space-x-1 text-grove-clay">
          <span className="text-xs">🔥</span>
          <span className="text-[10px] font-mono font-bold">{currentStreak}</span>
        </div>
      )}
    </div>
  );
};

export default TerminalControls;
```

2. **Export** in `components/Terminal/index.ts`

3. **Add to Terminal.tsx** after input area:
```tsx
{/* Controls below input */}
{useFeatureFlag('terminal-controls-below') && (
  <TerminalControls
    persona={activeLensData}
    onSwitchLens={() => setShowLensPicker(true)}
    currentPosition={currentPosition}
    totalSteps={currentThread.length}
    currentStreak={currentStreak}
    showStreak={showStreakDisplay}
    showJourney={currentThread.length > 0}
  />
)}
```

4. **Gate JourneyNav** at line ~904:
```tsx
{!useFeatureFlag('terminal-controls-below') && (
  <JourneyNav ... />
)}
```

5. Run `npm run build`

---

### Phase 6: Suggestion Chips

1. **Create** `components/Terminal/SuggestionChip.tsx`:
```typescript
import React from 'react';

interface SuggestionChipProps {
  prompt: string;
  onClick: (prompt: string) => void;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ prompt, onClick }) => {
  return (
    <button
      onClick={() => onClick(prompt)}
      className="w-full text-left px-4 py-2.5 bg-paper-dark/50 border border-transparent rounded-sm text-sm font-serif text-ink hover:border-grove-forest/30 hover:bg-paper-dark hover:shadow-sm active:scale-[0.99] transition-all duration-150 flex items-center justify-between group"
    >
      <span>{prompt}</span>
      <svg 
        className="w-4 h-4 text-ink-muted group-hover:text-grove-forest group-hover:translate-x-0.5 transition-all" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

export default SuggestionChip;
```

2. **Export** in `components/Terminal/index.ts`

3. **Update MarkdownRenderer** in `Terminal.tsx:115-130`:
Replace the inline prompt button rendering with SuggestionChip

4. **Add telemetry** (`utils/funnelAnalytics.ts`):
```typescript
export const trackSuggestionClicked = (prompt: string, messageId?: string) => {
  trackEvent('suggestion_clicked', { prompt, messageId });
};
```

5. Run `npm run build`

---

### Phase 7: Animations & Polish

1. **Add CSS** to `styles/globals.css`:
```css
/* Terminal animations */
.terminal-slide-up {
  animation: terminal-slide-up 300ms cubic-bezier(0.32, 0.72, 0, 1);
}

.terminal-slide-down {
  animation: terminal-slide-down 250ms cubic-bezier(0.32, 0.72, 0, 1);
}

@keyframes terminal-slide-up {
  from { 
    transform: translateY(100%);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes terminal-slide-down {
  from { 
    transform: translateY(0);
    opacity: 1;
  }
  to { 
    transform: translateY(100%);
    opacity: 0;
  }
}
```

2. **Apply classes** to pill/drawer transitions

3. **Mobile fixes**: Ensure pill and controls work on small screens

4. Run `npm run build`

---

## Build Verification
Run after each phase:
```bash
npm run build
```
Build must pass before proceeding.

## Citation Format
Report changes as: `path:lineStart-lineEnd`

## Response Format
After each phase:
1. Files modified/created with line citations
2. Build status
3. Issues or deviations

After all phases:
1. Summary of changes
2. Final build status
3. Smoke test results

## Forbidden Actions
- Do NOT refactor Terminal.tsx beyond specified changes
- Do NOT modify LensPicker internal UI
- Do NOT modify reveal system (SimulationReveal, etc.)
- Do NOT add new npm dependencies
- Do NOT change backend/API code
- Do NOT skip build verification
- Do NOT change existing message rendering logic (except suggestion chips)
