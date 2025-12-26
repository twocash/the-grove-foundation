# Execution Prompt: Terminal Quantum Welcome

**Sprint:** terminal-quantum-welcome-v1
**Handoff:** Self-contained for Claude Code CLI
**Duration:** 2-3 hours

---

## Context

You are implementing a sprint to wire Terminal's welcome experience to the Quantum Interface pattern. Currently, Terminal doesn't consume `useQuantumInterface()` at all—the welcome content is disconnected from lens reality.

**The Fix:**
```
Lens Selection → useQuantumInterface() → reality.terminal → TerminalWelcome component
```

## Pre-Flight Verification

```bash
cd C:\GitHub\the-grove-foundation

# Verify hook exists
head -20 src/surface/hooks/useQuantumInterface.ts

# Verify type exists
grep -n "interface TerminalWelcome" src/core/schema/narrative.ts

# Verify fallback exists
grep -n "DEFAULT_TERMINAL_WELCOME" src/data/quantum-content.ts
```

All three should return results. If any fail, check file paths before proceeding.

---

## Epic 1: Create TerminalWelcome Component

### Step 1.1: Create Component File

Create `components/Terminal/TerminalWelcome.tsx`:

```typescript
// components/Terminal/TerminalWelcome.tsx
// Declarative welcome card consuming reality.terminal
// Sprint: terminal-quantum-welcome-v1

import React from 'react';
import { TerminalWelcome as TerminalWelcomeType } from '../../src/core/schema/narrative';

interface TerminalWelcomeProps {
  welcome: TerminalWelcomeType;
  onPromptClick: (prompt: string) => void;
  variant?: 'overlay' | 'embedded';
}

const TerminalWelcome: React.FC<TerminalWelcomeProps> = ({
  welcome,
  onPromptClick,
  variant = 'overlay'
}) => {
  return (
    <div className="glass-welcome-card">
      <h2 className="text-xl font-medium text-[var(--glass-text-primary)] mb-3">
        {welcome.heading}
      </h2>
      <p className="text-[var(--glass-text-body)] mb-6 leading-relaxed">
        {welcome.thesis}
      </p>
      
      <div className="space-y-2 mb-4">
        {welcome.prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onPromptClick(prompt)}
            className="glass-welcome-prompt"
          >
            <span className="text-[var(--neon-green)] mr-2">→</span>
            {prompt}
          </button>
        ))}
      </div>
      
      <p className="text-xs text-[var(--glass-text-subtle)]">
        {welcome.footer}
      </p>
    </div>
  );
};

export default TerminalWelcome;
```

### Step 1.2: Add CSS Classes

Edit `styles/globals.css`. Find the end of the glass-message section (search for `.glass-message-error`) and add AFTER it:

```css
/* ============================================
   TERMINAL WELCOME (Sprint: terminal-quantum-welcome-v1)
   ============================================ */

.glass-welcome-card {
  background: var(--glass-panel);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 24px;
  max-width: 640px;
  margin: 0 auto;
}

@supports (backdrop-filter: blur(12px)) {
  .glass-welcome-card {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

.glass-welcome-prompt {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--glass-elevated);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--glass-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.glass-welcome-prompt:hover {
  border-color: var(--neon-green);
  color: var(--neon-green);
}
```

### Step 1.3: Export from Index

Edit `components/Terminal/index.ts`. Add export:

```typescript
export { default as TerminalWelcome } from './TerminalWelcome';
```

### Build Gate 1

```bash
npm run build
```

Should compile without errors.

---

## Epic 2: Wire Terminal to Quantum Interface

### Step 2.1: Add Imports

Edit `components/Terminal.tsx`. Near the top imports, add:

```typescript
import { useQuantumInterface } from '../src/surface/hooks/useQuantumInterface';
import { DEFAULT_TERMINAL_WELCOME } from '../src/data/quantum-content';
import TerminalWelcome from './Terminal/TerminalWelcome';
```

### Step 2.2: Call Hook

In Terminal.tsx, find the `useEngagementBridge()` hook call. Add AFTER it:

```typescript
  // Quantum Interface for lens-reactive content (Sprint: terminal-quantum-welcome-v1)
  const { reality, activeLens: quantumLens, isCollapsing } = useQuantumInterface();
  
  // Derive welcome content with fallback
  const welcomeContent = reality?.terminal ?? DEFAULT_TERMINAL_WELCOME;
```

### Step 2.3: Render TerminalWelcome

Find the messages area. Search for:
```typescript
<div className="w-full max-w-[min(90%,56rem)] mx-auto space-y-6">
```

Add IMMEDIATELY after the opening of that div, BEFORE `{terminalState.messages.map(`:

```typescript
                {/* Welcome Card - lens-reactive (Sprint: terminal-quantum-welcome-v1) */}
                {terminalState.messages.length === 0 && session.activeLens && (
                  <TerminalWelcome
                    welcome={welcomeContent}
                    onPromptClick={(prompt) => handleSend(prompt)}
                    variant={variant}
                  />
                )}
```

### Build Gate 2

```bash
npm run build
```

Should compile without errors.

---

## Epic 3: Verification

### Manual Testing

```bash
npm run dev
```

1. Open http://localhost:3000/terminal
2. Select "Concerned Citizen" lens
3. **Expected:** Glass-styled welcome card with:
   - Heading: "The Terminal."
   - Thesis: "Plain-language explanations..."
   - Prompts with → arrows
   - Footer: "No jargon. Just answers."
4. Click any prompt → Message sends, welcome disappears
5. Select different lens (e.g., "Engineer") → Different welcome content

### Visual Verification

The welcome card should:
- Have translucent glass background (not solid gray)
- Show backdrop blur effect
- Match the visual style of the Lenses page cards
- Have neon-green accent on hover

### Final Build

```bash
npm run build
npm run lint
```

---

## Commit

```bash
git add -A
git commit -m "feat(terminal): lens-reactive welcome via Quantum Interface

- Add TerminalWelcome component consuming reality.terminal
- Wire Terminal to useQuantumInterface hook
- Glass styling matches Lenses page aesthetic
- Prompts send messages on click

Sprint: terminal-quantum-welcome-v1"

git push origin main
```

---

## Troubleshooting

### Import Errors

If `useQuantumInterface` import fails:
- Check path: `../src/surface/hooks/useQuantumInterface`
- Verify file exists at `src/surface/hooks/useQuantumInterface.ts`

### Type Errors

If `TerminalWelcome` type not found:
- Check import: `import { TerminalWelcome as TerminalWelcomeType } from '../../src/core/schema/narrative'`
- Verify type is exported from narrative.ts

### Welcome Not Showing

Check conditions:
- `terminalState.messages.length === 0` (no messages)
- `session.activeLens` is truthy (lens selected)
- `welcomeContent` is defined (fallback should always provide value)

### Glass Effect Not Visible

- Verify `--glass-panel` token is defined in globals.css
- Check backdrop-filter browser support
- Inspect element to see if classes are applied

---

## Files Changed Summary

| File | Action |
|------|--------|
| `components/Terminal/TerminalWelcome.tsx` | CREATE |
| `components/Terminal/index.ts` | ADD EXPORT |
| `components/Terminal.tsx` | ADD IMPORTS, HOOK, RENDER |
| `styles/globals.css` | ADD CSS CLASSES |

---

## Success Criteria

- [ ] TerminalWelcome component created
- [ ] CSS classes defined in globals.css
- [ ] Terminal imports useQuantumInterface
- [ ] Welcome shows when no messages and lens selected
- [ ] Different lenses show different welcome content
- [ ] Clicking prompt sends message
- [ ] Glass styling matches Lenses page
- [ ] Build passes
- [ ] Committed and pushed
