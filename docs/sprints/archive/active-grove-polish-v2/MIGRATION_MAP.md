# Migration Map: Active Grove Polish v2

## File Change Summary

| File | Action | Risk | Epic |
|------|--------|------|------|
| `src/surface/pages/GenesisPage.tsx` | MODIFY | HIGH | 1 |
| `src/surface/components/genesis/ProblemStatement.tsx` | MODIFY | LOW | 2 |
| `src/surface/components/genesis/AhaDemo.tsx` | MODIFY | MEDIUM | 3 |
| `src/surface/components/genesis/Foundation.tsx` | MODIFY | LOW | 4 |
| `styles/globals.css` | MODIFY | LOW | 3,4 |

## Detailed Changes

### Epic 1: GenesisPage.tsx (Critical Bug Fix)

**Location:** `src/surface/pages/GenesisPage.tsx`

**Change 1: handleTreeClick (around line 125)**
```tsx
// BEFORE
const handleTreeClick = useCallback(() => {
  if (flowState === 'hero') {
    setUIMode('split');
    setFlowState('split');
    setTerminalState(prev => ({ ...prev, isOpen: true }));
    console.log('[ActiveGrove] Tree clicked → split mode');
  }
  // ...
}, [flowState]);

// AFTER
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
  }
  // ...
}, [flowState, activeLens]);
```

**Verification:** Console logs should show correct path taken.

---

### Epic 2: ProblemStatement.tsx (Quote Carousel)

**Location:** `src/surface/components/genesis/ProblemStatement.tsx`

**Change 1: Find carousel interval constant and increase**
```tsx
// BEFORE (search for setInterval or similar)
const CAROUSEL_INTERVAL = 3000; // or 4000

// AFTER
const CAROUSEL_INTERVAL = 6000; // 6 seconds per card
```

**Change 2: Add section headline (if missing)**
Find the section return statement and add above carousel:
```tsx
{variant === 'compressed' && (
  <div className="section-frame">
    {/* ADD: Section headline */}
    <h2 className="text-xl md:text-2xl font-display text-grove-forest mb-6 text-center px-4">
      The People Building AI Have a Message
    </h2>
    
    {/* Existing carousel */}
    <div className="quote-carousel ...">
```

---

### Epic 3: AhaDemo.tsx (Diary Redesign)

**Location:** `src/surface/components/genesis/AhaDemo.tsx`

**Change 1: Update diary copy**
Find the blockquote/diary content and replace:
```tsx
// NEW COPY
const DIARY_CONTENT = `I've been digging into Wang et al.'s research on hierarchical reasoning, which is informative as we build the Foundation: knowing things compresses well; thinking hard doesn't. That's why the hybrid works—your laptop handles the conversation, the memory; the cloud handles the breakthroughs. We're on the right path. Doing more research.`;

const DIARY_AUTHOR = "Leah";
```

**Change 2: Remove "Keep Exploring" button**
Delete or comment out the secondary CTA.

**Change 3: Restyle primary CTA**
```tsx
// BEFORE (likely)
<button onClick={onGoDeeper}>Go Deeper</button>

// AFTER
<button 
  onClick={() => onGoDeeper?.()}
  className="px-6 py-3 bg-grove-forest text-white rounded-lg hover:bg-grove-forest/90 transition-colors"
>
  Ask The Grove: How does Grove know when to call for backup?
</button>
```

**Change 4: Update onGoDeeper call in GenesisPage.tsx**
```tsx
// Find handleAhaDemoCTA and update:
const handleAhaDemoCTA = useCallback(() => {
  trackGenesisCTAClicked('diary-hybrid-routing', 4, 'AhaDemo');
  
  // Use externalQuery pattern for display vs underlying prompt
  setExternalQuery({
    display: "How does Grove know when to call for backup?",
    query: "Explain Grove's hybrid routing architecture in plain terms: how the system detects when a task exceeds local capability and routes to cloud inference. Frame it as the agent 'recognizing the limits of their own thinking'—make the technical feel almost introspective. Reference the efficiency-enlightenment loop briefly, and imagine if we build systems to ratchet forward, we can unlock new distributed computing models that scale without chokepoints."
  });
}, []);
```

---

### Epic 4: Foundation.tsx (Layout Reorder)

**Location:** `src/surface/components/genesis/Foundation.tsx`

**Change 1: Reorder JSX elements**
```tsx
// TARGET ORDER:
return (
  <section className="...">
    {/* 1. Headline */}
    <h2>WHY THIS WORKS</h2>
    
    {/* 2. Body copy */}
    <p>AI capability doubles...</p>
    <p>Today's data center...</p>
    <p>We're building...</p>
    
    {/* 3. CTA text - MOVED UP, restyled */}
    <p className="text-grove-accent text-center font-medium text-lg mb-4">
      Want to go deeper?
    </p>
    
    {/* 4. Buttons */}
    <div className="flex flex-wrap gap-4 justify-center mb-8">
      <button>THE VISION</button>
      <button>THE RATCHET</button>
      <button>THE ECONOMICS</button>
    </div>
    
    {/* 5. Sapling - at bottom */}
    <ActiveTree ... />
  </section>
);
```

**Change 2: Remove strikethrough/pink styling**
Search for any `line-through`, `text-pink`, or similar classes on the CTA text and remove.

---

### Epic 3/4: globals.css (Styling)

**Location:** `styles/globals.css`

**Add after existing Active Grove section (~line 350):**
```css
/* Diary entry scaling for split mode */
.content-rail.split .diary-entry,
.content-rail.split blockquote {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  line-height: 1.6;
  max-width: 100%;
}

/* Foundation CTA styling */
.foundation-cta-text {
  color: var(--color-grove-accent, #c97b4a);
  text-align: center;
  font-weight: 500;
}
```

## Execution Order

1. **Epic 1** - GenesisPage.tsx reload fix (unblocks testing)
2. **Epic 2** - ProblemStatement.tsx carousel timing
3. **Epic 3** - AhaDemo.tsx redesign (most changes)
4. **Epic 4** - Foundation.tsx layout + CSS

## Rollback Plan

Each epic is independently revertable:
```bash
git revert HEAD~1  # Revert last epic if issues found
```

Keep commits atomic per epic for clean rollback.
