# Execution Prompt — v0.12b Terminal Polish

## Context
Polish sprint for Terminal UX improvements identified in v0.12 testing. **CRITICAL: Phase 0 must diagnose why clickable bold text isn't working in production despite code being deployed.**

Six focus areas:
1. **[P0] Diagnose clickable bold text pipeline** — Code exists but not working in prod
2. Animation consistency
3. CTA arrow removal
4. CognitiveBridge warmth
5. Scroll indicator redesign
6. ProductReveal YOUR animation fix

## Documentation
All sprint docs in `docs/sprints/v0.12b-terminal-polish/`:
- `REPO_AUDIT.md` — Current state with line citations
- `SPEC.md` — Goals and acceptance criteria
- `DECISIONS.md` — ADRs for design choices
- `SPRINTS.md` — Story breakdown

## Critical File Locations

| Component | File | Key Lines |
|-----------|------|-----------|
| parseInline (bold handling) | `components/Terminal.tsx` | 52-90 |
| MarkdownRenderer | `components/Terminal.tsx` | 92-175 |
| handleSuggestion | `components/Terminal.tsx` | 813-816 |
| MarkdownRenderer usage | `components/Terminal.tsx` | 985-990 |
| Terminal Drawer | `components/Terminal.tsx` | 906 |
| CognitiveBridge | `components/Terminal/CognitiveBridge.tsx` | 1-143 |
| ProductReveal | `src/surface/components/genesis/ProductReveal.tsx` | 102-165 (animation), 241-254 (CTA) |

## ⚠️ KNOWN ISSUE: Clickable Bold Text Not Working in Production

### What Was Implemented (commit 80d63ae)
```typescript
const parseInline = (text: string, onBoldClick?: (phrase: string) => void) => {
  // Bold text (**phrase**) should render as clickable button when handler provided
  if (part.startsWith('**') && part.endsWith('**')) {
    const phrase = part.slice(2, -2);
    if (onBoldClick) {
      return (
        <button onClick={() => onBoldClick(phrase)} className="text-grove-clay font-bold hover:underline...">
          {phrase}
        </button>
      );
    }
    // Falls back to static bold if no handler
  }
}
```

### Expected Behavior
- AI response: "You might explore **local-first ownership** or **the dependency trap**"
- Both phrases render as orange bold clickable buttons
- Clicking sends phrase as new query + fires telemetry

### Observed Behavior
- Bold text renders (orange, styled)
- **NOT clickable** — no hover state, no cursor change, clicking does nothing

### Potential Failure Points
1. **onBoldClick not passed:** `parseInline` called without second argument
2. **MarkdownRenderer not receiving onPromptClick:** Props not wired correctly
3. **AI not using markdown:** Responses don't contain `**bold**` syntax
4. **Regex not matching:** Split pattern fails on certain text
5. **Build not deployed:** Local build differs from production

---

## Execution Order

### Phase 0: Diagnose Clickable Bold Text (P0 — DO THIS FIRST)

**Step 0.1: Add Diagnostic Logging**
1. Open `components/Terminal.tsx`
2. Find `parseInline` function (around line 52)
3. Add console logging:
```typescript
const parseInline = (text: string, onBoldClick?: (phrase: string) => void) => {
  console.log('[parseInline] Called with:', { 
    textLength: text.length, 
    hasOnBoldClick: !!onBoldClick,
    textPreview: text.slice(0, 100) 
  });
  
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|_[^_]+_)/g);
  console.log('[parseInline] Split into parts:', parts.length, parts);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const phrase = part.slice(2, -2);
      console.log('[parseInline] Found bold phrase:', phrase, 'onBoldClick:', !!onBoldClick);
      // ... rest of function
    }
    // ...
  });
};
```

**Step 0.2: Verify MarkdownRenderer Props**
1. Find `MarkdownRenderer` component (around line 92)
2. Add logging at start:
```typescript
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onPromptClick }) => {
  console.log('[MarkdownRenderer] Rendered with:', { 
    contentLength: content.length, 
    hasOnPromptClick: !!onPromptClick 
  });
  // ...
}
```

**Step 0.3: Verify handleSuggestion Wiring**
1. Find where MarkdownRenderer is used (around line 985-990)
2. Confirm `onPromptClick={handleSuggestion}` is present
3. Add logging to handleSuggestion:
```typescript
const handleSuggestion = (hint: string) => {
  console.log('[handleSuggestion] Called with:', hint);
  trackSuggestionClicked(hint);
  handleSend(hint);
};
```

**Step 0.4: Create Test Component**
Create a simple test to verify the pipeline works in isolation:
```typescript
// Add temporarily at bottom of Terminal.tsx, inside the component
useEffect(() => {
  // Test parseInline with mock handler
  const testText = "Check out **local-first ownership** and **dependency trap**";
  const mockHandler = (phrase: string) => console.log('[TEST] Handler called:', phrase);
  const result = parseInline(testText, mockHandler);
  console.log('[TEST] parseInline result:', result);
}, []);
```

**Step 0.5: Check AI Response Format**
1. Open browser DevTools → Console
2. Send a message in Terminal
3. Check if AI responses contain `**bold**` markdown
4. If not, the issue is AI not using markdown format

**Step 0.6: Run Build and Test**
```bash
npm run build
npm run dev
```
1. Open Terminal, send a message
2. Check console for all `[parseInline]`, `[MarkdownRenderer]`, `[handleSuggestion]` logs
3. Document findings

**Step 0.7: Fix Based on Findings**
- If `hasOnBoldClick: false` → Fix prop passing
- If no bold parts found → Check regex or AI format
- If handler never fires → Check button rendering

**Step 0.8: Clean Up Logging**
After fix confirmed, remove or reduce console.logs to essential telemetry only.

Run `npm run build` before proceeding.

---

### Phase 1: Animation Unification
1. Open `components/Terminal.tsx`
2. Find line ~906: `duration-500 ease-in-out`
3. Change to: `duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`
4. Run `npm run build`

### Phase 2: CTA Arrow Removal
1. Open `src/surface/components/genesis/ProductReveal.tsx`
2. Find lines 241-254 (CTA button with arrow SVG)
3. Remove the entire `<svg>` element, keep button text "See it in action"
4. Open `src/surface/components/genesis/AhaDemo.tsx`
5. Find lines 79-83, remove `<svg>` from "Go deeper" button
6. Open `src/surface/components/genesis/Foundation.tsx`
7. Remove `<svg>` elements from all 4 buttons:
   - "The Ratchet" (lines 80-83)
   - "The Economics" (lines 89-92)
   - "The Vision" (lines 98-101)
   - "Explore" (lines 114-118)
8. Run `npm run build`

### Phase 3: CognitiveBridge Enhancement
1. Open `components/Terminal/CognitiveBridge.tsx`
2. Add typing animation state after existing state declarations (around line 56):
```typescript
const [displayedText, setDisplayedText] = useState('');
const [isTypingComplete, setIsTypingComplete] = useState(false);

// Warm invitation text
const invitationText = `I'd love to take you on a guided journey about "${journeyInfo.title}" — we'll explore ${journeyInfo.coverTopics.slice(0, 3).join(', ')}. Or keep asking anything. I'm here to help!`;
```
3. Add typing effect after the isResolving useEffect (around line 73):
```typescript
// Typing animation
useEffect(() => {
  if (!isResolving && !isTypingComplete) {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(invitationText.slice(0, i + 1));
      i++;
      if (i >= invitationText.length) {
        clearInterval(timer);
        setIsTypingComplete(true);
      }
    }, 20);
    return () => clearInterval(timer);
  }
}, [isResolving, isTypingComplete, invitationText]);
```
4. Update the JSX (around line 83-100):
   - Replace static `<p>` with typed text display
   - Show journey card only after `isTypingComplete`
5. Run `npm run build`

### Phase 4: Scroll Indicator (Staged)
**Stage 4A: CSS Fallback First**
1. Create `src/surface/components/genesis/ScrollIndicator.tsx`:
```typescript
// ScrollIndicator - Organic scroll invitation
import React from 'react';

interface ScrollIndicatorProps {
  onClick: () => void;
}

export const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 text-ink-muted hover:text-grove-forest transition-colors focus:outline-none"
      aria-label="Continue scrolling"
    >
      <span className="text-2xl animate-float">🌱</span>
      <svg 
        className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7" />
      </svg>
    </button>
  );
};

export default ScrollIndicator;
```
2. Add float animation to `styles/globals.css`:
```css
/* Organic float animation for scroll indicator */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
```
3. Replace scroll indicators in all Genesis components
4. Run `npm run build`

### Phase 5: ProductReveal YOUR Animation Fix
1. Open `src/surface/components/genesis/ProductReveal.tsx`
2. Simplify animation phases to use fade instead of knock-away
3. Remove fixed-width container
4. THE fades out, YOUR fades in (same position)
5. Run `npm run build`

---

## Build Verification
Run after each phase:
```bash
npm run build
```
Build must pass before proceeding.

## Citation Format
Report changes as: `path:lineStart-lineEnd`

## Forbidden Actions
- Do NOT modify Terminal state management beyond diagnostics
- Do NOT change LensPicker or CustomLensWizard
- Do NOT add feature flags
- Do NOT modify backend/API code
- Do NOT skip build verification
- Do NOT remove diagnostic logging until fix is confirmed

## Response Format

**After Phase 0:**
1. Console log findings (what's working, what's not)
2. Root cause identified
3. Fix implemented
4. Verification that clicks now work

**After each subsequent phase:**
1. Files modified with line citations
2. Build status
3. Any issues

**After all phases:**
1. Summary of all changes
2. Final build status
3. Smoke test results
