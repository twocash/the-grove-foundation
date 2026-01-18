# Execution Prompt: Active Grove Polish v2

## Context
You are completing the Active Grove Polish v2 sprint. This sprint fixes a critical reload bug and polishes several sections of the Genesis landing experience. Read the full sprint documentation in `docs/sprints/active-grove-polish-v2/` before starting.

## Pre-Flight Checklist
```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean
npm run build  # Should succeed
```

---

## Epic 1: Reload State Fix (CRITICAL - DO FIRST)

### Problem
Users returning with a previously-set lens get stuck after clicking sapling. The flowState transitions to 'collapsing' but WaveformCollapse never fires onComplete (no trigger change), so user is permanently locked.

### Fix
In `src/surface/pages/GenesisPage.tsx`, find `handleTreeClick` (around line 125).

**Current code:**
```tsx
const handleTreeClick = useCallback(() => {
  if (flowState === 'hero') {
    setUIMode('split');
    setFlowState('split');
    setTerminalState(prev => ({ ...prev, isOpen: true }));
    console.log('[ActiveGrove] Tree clicked → split mode');
  }
  // ... rest of function
}, [flowState]);
```

**Change to:**
```tsx
const handleTreeClick = useCallback(() => {
  if (flowState === 'hero') {
    setUIMode('split');
    setTerminalState(prev => ({ ...prev, isOpen: true }));
    
    // If lens already set from previous session, skip to unlocked
    if (activeLens) {
      console.log('[ActiveGrove] Tree clicked → unlocked (lens exists:', activeLens, ')');
      setFlowState('unlocked');
    } else {
      console.log('[ActiveGrove] Tree clicked → split mode (no lens)');
      setFlowState('split');
    }
  } else if (flowState === 'unlocked') {
    // Scroll to next section
    const targetRef = screenRefs.current[1];
    if (targetRef) {
      targetRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else {
    console.log('[ActiveGrove] Navigation locked, flowState:', flowState);
  }
}, [flowState, activeLens]);
```

**IMPORTANT:** Add `activeLens` to the dependency array.

### Verify
```bash
npm run build
```
Then manually test:
1. Clear localStorage, fresh visit → should show lens picker after tree click
2. Select lens, refresh page, click tree → should skip to unlocked, can navigate

### Commit
```bash
git add -A
git commit -m "fix(genesis): skip to unlocked for return visitors with existing lens"
```

---

## Epic 2: Quote Carousel Polish

### 2.1 Increase Carousel Interval
In `src/surface/components/genesis/ProblemStatement.tsx`:

Search for the auto-advance interval (look for `setInterval`, `useEffect` with timer, or constants like `3000`, `4000`, `CAROUSEL_INTERVAL`).

Change the interval value to `6000` (6 seconds).

### 2.2 Add Section Headline
In the same file, find the compressed variant return statement. Add a headline above the carousel:

```tsx
{variant === 'compressed' && (
  <>
    <h2 className="text-xl md:text-2xl font-display text-grove-forest mb-6 text-center px-4">
      The People Building AI Have a Message
    </h2>
    {/* existing carousel code */}
  </>
)}
```

### Verify
```bash
npm run build
```
Manual test: Cards should advance every ~6 seconds.

### Commit
```bash
git add -A
git commit -m "feat(problem): increase carousel interval to 6s, add section headline"
```

---

## Epic 3: Diary Entry Redesign

### 3.1 Update Copy in AhaDemo.tsx
In `src/surface/components/genesis/AhaDemo.tsx`, find the diary content and replace with:

```tsx
const DIARY_CONTENT = `I've been digging into Wang et al.'s research on hierarchical reasoning, which is informative as we build the Foundation: knowing things compresses well; thinking hard doesn't. That's why the hybrid works—your laptop handles the conversation, the memory; the cloud handles the breakthroughs. We're on the right path. Doing more research.`;

const DIARY_AUTHOR = "Leah";
```

Use these constants in the JSX where the diary text renders.

### 3.2 Remove Secondary CTA
Find and remove/comment out the "Keep Exploring" button. Only keep the primary action CTA.

### 3.3 Restyle Primary CTA
Update the primary CTA button:

```tsx
<button 
  onClick={onGoDeeper}
  className="px-6 py-3 bg-grove-forest text-white rounded-lg hover:bg-grove-forest/90 transition-colors font-medium"
>
  Ask The Grove: How does Grove know when to call for backup?
</button>
```

### 3.4 Update Handler in GenesisPage.tsx
Find `handleAhaDemoCTA` and update to use externalQuery pattern:

```tsx
const handleAhaDemoCTA = useCallback(() => {
  trackGenesisCTAClicked('diary-hybrid-routing', 4, 'AhaDemo');
  setExternalQuery({
    display: "How does Grove know when to call for backup?",
    query: "Explain Grove's hybrid routing architecture in plain terms: how the system detects when a task exceeds local capability and routes to cloud inference. Frame it as the agent 'recognizing the limits of their own thinking'—make the technical feel almost introspective. Reference the efficiency-enlightenment loop briefly, and imagine if we build systems to ratchet forward, we can unlock new distributed computing models that scale without chokepoints."
  });
}, []);
```

### 3.5 Add CSS Scaling
In `styles/globals.css`, add after the Active Grove section:

```css
/* Diary entry scaling for split mode (Active Grove Polish v2) */
.content-rail.split .diary-entry,
.content-rail.split blockquote {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  line-height: 1.6;
  max-width: 100%;
}

.content-rail.split .diary-author {
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
}
```

### Verify
```bash
npm run build
```
Manual test: Diary fits viewport, CTA text is correct, clicking opens Terminal with query.

### Commit
```bash
git add -A
git commit -m "refactor(aha): redesign diary section with new copy and single CTA"
```

---

## Epic 4: Foundation Layout

### 4.1 Reorder JSX in Foundation.tsx
In `src/surface/components/genesis/Foundation.tsx`, reorder elements to match this structure:

```tsx
return (
  <section className="...">
    {/* 1. Headline */}
    <h2 className="...">WHY THIS WORKS</h2>
    
    {/* 2. Body copy */}
    <div className="...">
      <p>AI capability doubles every seven months.</p>
      <p>Today's data center becomes tomorrow's laptop.</p>
      <p className="font-semibold">We're building the infrastructure to ride that wave.</p>
    </div>
    
    {/* 3. CTA invitation - MOVED UP, restyled */}
    <p className="text-grove-accent text-center font-medium text-lg mb-6">
      Want to go deeper?
    </p>
    
    {/* 4. Buttons */}
    <div className="flex flex-wrap gap-4 justify-center mb-8">
      <button onClick={() => onOpenTerminal("Explain The Grove's vision...")}>THE VISION</button>
      <button onClick={() => onOpenTerminal("Explain the Ratchet thesis...")}>THE RATCHET</button>
      <button onClick={() => onOpenTerminal("Explain Grove economics...")}>THE ECONOMICS</button>
    </div>
    
    {/* 5. Sapling */}
    <div className="...">
      <ActiveTree mode="directional" onClick={onScrollNext} />
    </div>
  </section>
);
```

### 4.2 Remove Strikethrough Styling
Search for any `line-through`, `text-pink`, `decoration-` classes on the CTA text and remove them.

### Verify
```bash
npm run build
```
Manual test: "Want to go deeper?" is orange, centered, above buttons. Sapling below.

### Commit
```bash
git add -A
git commit -m "refactor(foundation): reorder layout and apply accent styling to CTA"
```

---

## Final Verification

### Test Checklist
- [ ] Fresh visit: hero → click tree → lens picker → select → morph → unlock → navigate all sections
- [ ] Return visit: hero → click tree → unlocked (no picker) → navigate all sections
- [ ] Quote carousel: ~6 second intervals
- [ ] Diary: New copy displays, single CTA, clicking opens Terminal with correct query
- [ ] Foundation: Orange "Want to go deeper?" above buttons, sapling below

### Push
```bash
git push origin main
```

---

## Troubleshooting

### If reload still locks:
Check that `activeLens` is in the dependency array of `handleTreeClick`.

### If Terminal doesn't show query:
Verify `externalQuery` state is being set and that Terminal component reads it.

### If CSS not applying:
Check selector specificity. `.content-rail.split` must match the actual class structure.

---

## Documentation
After successful execution, update `docs/sprints/active-grove-polish-v2/DEVLOG.md` with:
- Actual time taken per epic
- Any deviations from plan
- Issues encountered and solutions
