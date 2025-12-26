# Sprint Breakdown: Terminal Quantum Welcome

**Sprint:** terminal-quantum-welcome-v1
**Estimated Duration:** 2-3 hours

---

## Epic 1: Create TerminalWelcome Component

### Story 1.1: Create TerminalWelcome.tsx

**Task:** Create the declarative welcome card component.

**File:** `components/Terminal/TerminalWelcome.tsx`

**Implementation:**
```typescript
// components/Terminal/TerminalWelcome.tsx
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

**Acceptance Criteria:**
- [ ] Component accepts welcome prop with TerminalWelcome type
- [ ] Renders heading, thesis, prompts, footer
- [ ] Prompts are clickable buttons
- [ ] Uses --glass-* tokens for styling

---

### Story 1.2: Add CSS Classes

**Task:** Add glass-welcome-* classes to globals.css.

**File:** `styles/globals.css`

**Find:** End of glass-message section (around line 1296)

**Add after:**
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

**Acceptance Criteria:**
- [ ] glass-welcome-card class defined
- [ ] glass-welcome-prompt class defined
- [ ] Backdrop blur with @supports fallback
- [ ] Hover state with neon-green accent

---

### Story 1.3: Export from Index

**Task:** Add TerminalWelcome to Terminal/index.ts exports.

**File:** `components/Terminal/index.ts`

**Find:** Existing exports

**Add:**
```typescript
export { default as TerminalWelcome } from './TerminalWelcome';
```

---

## Epic 2: Wire Terminal to Quantum Interface

### Story 2.1: Add Imports

**Task:** Import useQuantumInterface and related dependencies in Terminal.tsx.

**File:** `components/Terminal.tsx`

**Find:** Import section (top of file)

**Add after existing imports:**
```typescript
import { useQuantumInterface } from '../src/surface/hooks/useQuantumInterface';
import { DEFAULT_TERMINAL_WELCOME } from '../src/data/quantum-content';
import TerminalWelcome from './Terminal/TerminalWelcome';
```

**Acceptance Criteria:**
- [ ] Import paths resolve correctly
- [ ] No TypeScript errors

---

### Story 2.2: Call Hook

**Task:** Call useQuantumInterface in Terminal component.

**File:** `components/Terminal.tsx`

**Find:** After engagement hooks (around line 160-170)

**Add after `useEngagementBridge()` block:**
```typescript
  // Quantum Interface for lens-reactive content (Sprint: terminal-quantum-welcome-v1)
  const { reality, activeLens: quantumLens, isCollapsing } = useQuantumInterface();
  
  // Derive welcome content with fallback
  const welcomeContent = reality?.terminal ?? DEFAULT_TERMINAL_WELCOME;
```

**Acceptance Criteria:**
- [ ] Hook called successfully
- [ ] No runtime errors
- [ ] welcomeContent derived with fallback

---

### Story 2.3: Render TerminalWelcome

**Task:** Add TerminalWelcome rendering in messages area.

**File:** `components/Terminal.tsx`

**Find:** Messages area, before the message map (search for `terminalState.messages.map`)

**Add BEFORE the map, inside the messages container:**
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

**Context:** This goes inside the `<div className="w-full max-w-[min(90%,56rem)] mx-auto space-y-6">` container.

**Acceptance Criteria:**
- [ ] Welcome shows when messages empty and lens selected
- [ ] Welcome hidden when messages exist
- [ ] Clicking prompt sends message

---

## Epic 3: Verification

### Story 3.1: Manual Testing

**Test Plan:**

1. **Dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Terminal:**
   - Go to http://localhost:3000/terminal
   - Clear any existing session if needed

3. **Test predefined lenses:**
   - Select "Concerned Citizen" lens
   - Verify welcome shows: "Plain-language explanations..."
   - Click a prompt → Message sent, welcome disappears

4. **Test different lens:**
   - Reset/clear chat
   - Select "Engineer" lens
   - Verify different welcome content appears

5. **Test custom lens (if available):**
   - Create or select a custom lens
   - Verify generated welcome appears (may show loading state)

### Story 3.2: Build Verification

```bash
npm run build
```

**Acceptance Criteria:**
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No unused import warnings

---

## Build Gates

After each epic, run:
```bash
npm run build    # Compiles
npm run lint     # No new warnings
```

After Epic 3:
```bash
# Full verification
npm run build
npm run lint
# Manual test in browser
```

## Commit Strategy

```bash
# After Epic 1
git add components/Terminal/TerminalWelcome.tsx styles/globals.css components/Terminal/index.ts
git commit -m "feat(terminal): add TerminalWelcome component with glass styling"

# After Epic 2
git add components/Terminal.tsx
git commit -m "feat(terminal): wire Terminal to Quantum Interface for lens-reactive welcome"

# After Epic 3 (verification)
git commit --amend -m "feat(terminal): lens-reactive welcome via Quantum Interface

- Add TerminalWelcome component consuming reality.terminal
- Wire Terminal to useQuantumInterface hook
- Glass styling matches Lenses page aesthetic
- Prompts send messages on click

Sprint: terminal-quantum-welcome-v1"

git push origin main
```
