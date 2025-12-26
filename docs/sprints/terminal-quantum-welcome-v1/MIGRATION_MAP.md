# Migration Map: Terminal Quantum Welcome

**Sprint:** terminal-quantum-welcome-v1

## File Changes Overview

| File | Action | Risk | Lines Changed |
|------|--------|------|---------------|
| `components/Terminal/TerminalWelcome.tsx` | CREATE | Low | ~60 |
| `components/Terminal.tsx` | MODIFY | Medium | ~15 |
| `components/Terminal/index.ts` | MODIFY | Low | ~2 |
| `styles/globals.css` | MODIFY | Low | ~25 |

## Detailed Changes

### 1. CREATE: TerminalWelcome.tsx

**Path:** `components/Terminal/TerminalWelcome.tsx`

**Purpose:** Declarative welcome card consuming reality.terminal

**Content outline:**
```typescript
// Type imports
import { TerminalWelcome as TerminalWelcomeType } from '../../src/core/schema/narrative';

interface TerminalWelcomeProps {
  welcome: TerminalWelcomeType;
  onPromptClick: (prompt: string) => void;
  variant?: 'overlay' | 'embedded';
}

// Render heading, thesis, prompts, footer
// Use --glass-* tokens for styling
```

### 2. MODIFY: Terminal.tsx

**Path:** `components/Terminal.tsx`

**Changes:**

#### A. Add imports (near top of file)
```typescript
// After existing imports
import { useQuantumInterface } from '../src/surface/hooks/useQuantumInterface';
import { DEFAULT_TERMINAL_WELCOME } from '../src/data/quantum-content';
import TerminalWelcome from './Terminal/TerminalWelcome';
```

#### B. Call hook (in component body, after other hooks)
```typescript
// After existing useEngagement hooks
const { reality, activeLens: quantumLens, isCollapsing } = useQuantumInterface();
```

#### C. Derive welcome content (after hook call)
```typescript
// Derive welcome content with fallback
const welcomeContent = reality?.terminal ?? DEFAULT_TERMINAL_WELCOME;
```

#### D. Render TerminalWelcome (in messages area, before message map)
```typescript
{/* Welcome Card - when no messages and lens selected */}
{terminalState.messages.length === 0 && session.activeLens && (
  <TerminalWelcome
    welcome={welcomeContent}
    onPromptClick={(prompt) => handleSend(prompt)}
    variant={variant}
  />
)}
```

### 3. MODIFY: Terminal/index.ts

**Path:** `components/Terminal/index.ts`

**Add export:**
```typescript
export { default as TerminalWelcome } from './TerminalWelcome';
```

### 4. MODIFY: globals.css

**Path:** `styles/globals.css`

**Add after existing glass-message classes (~line 1300):**
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

## Import Path Verification

Before execution, verify these imports resolve:

```bash
# Check hook exists
cat src/surface/hooks/useQuantumInterface.ts | head -5

# Check type exists
grep "TerminalWelcome" src/core/schema/narrative.ts

# Check fallback exists
grep "DEFAULT_TERMINAL_WELCOME" src/data/quantum-content.ts
```

## Rollback Plan

If issues arise:
1. Remove TerminalWelcome component
2. Remove import and hook call from Terminal.tsx
3. Remove CSS classes from globals.css
4. Git reset to previous commit

No database changes, no schema migrations, no config changes—pure code rollback.
