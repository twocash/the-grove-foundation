# Execution Prompt — v0.12c Genesis Simplify

## Context
Simplify Genesis screens and add Terminal welcome flow. Remove over-engineered ProductReveal animation, standardize CTAs to "Consult the Grove", add first-time welcome message to Terminal, and reorder Foundation buttons.

## Documentation
All sprint docs in `docs/sprints/v0.12c-genesis-simplify/`:
- `REPO_AUDIT.md` — Current state with line citations
- `SPEC.md` — Goals and acceptance criteria
- `DECISIONS.md` — ADRs for design choices
- `SPRINTS.md` — Story breakdown

## Repository Intelligence

| Concern | File | Key Lines |
|---------|------|-----------|
| ProductReveal | `src/surface/components/genesis/ProductReveal.tsx` | 31, 57-87, 115-156, 189-196 |
| Foundation | `src/surface/components/genesis/Foundation.tsx` | 78-96, 101-107 |
| AhaDemo | `src/surface/components/genesis/AhaDemo.tsx` | 78-83 |
| Terminal welcome | `components/Terminal.tsx` | 348-395 |
| TerminalControls | `components/Terminal/TerminalControls.tsx` | 32-48 |
| LensPicker | `components/Terminal/LensPicker.tsx` | Full file |

## Execution Order

### Phase 1: ProductReveal Simplification

**Step 1.1: Simplify Animation Phase Type**
1. Open `src/surface/components/genesis/ProductReveal.tsx`
2. Line 31: Change animation phase type to:
```typescript
type AnimationPhase = 'hidden' | 'visible';
```

**Step 1.2: Remove Animation Timers**
1. Lines 57-87: Simplify the animation useEffect to:
```typescript
useEffect(() => {
  if (!isVisible) return;
  setPhase('visible');
}, [isVisible]);
```
2. Remove `pixelProgress` state and related code

**Step 1.3: Replace Animated Headline with Static**
1. Lines 115-156: Replace entire animated headline block with:
```tsx
{/* Headline - Static with color emphasis */}
<div className="mb-8">
  <h2 className={`font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center transition-all duration-700 ${
    phase === 'visible' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
  }`}>
    <span className="text-grove-forest">STEP INTO </span>
    <span className="text-grove-clay">YOUR GROVE</span>
  </h2>
</div>
```

**Step 1.4: Update ProductReveal CTA**
1. Lines 189-196: Change button text from "See it in action" to "Consult the Grove"

**Step 1.5: Clean Up Unused Code**
1. Remove `pixelProgress` state (line ~35)
2. Remove `textBlur` and `textOpacity` calculations
3. Remove sparkle effect conditional that references old phases
4. Update any remaining phase checks from 'sprouting'/'knocking'/'settled' to 'visible'

5. Run `npm run build`

---

### Phase 2: CTA Standardization

**Step 2.1: Update AhaDemo CTA**
1. Open `src/surface/components/genesis/AhaDemo.tsx`
2. Line 79: Change "Go deeper" to "Consult the Grove"

**Step 2.2: Update Foundation Main CTA**
1. Open `src/surface/components/genesis/Foundation.tsx`
2. Line 104: Change "Explore" to "Consult the Grove"

**Step 2.3: Reorder Foundation Buttons**
1. Lines 78-96: Reorder the buttons to Vision → Ratchet → Economics:
```tsx
<div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
  <button
    onClick={() => handleDeepDive('vision')}
    className="px-6 py-3 border border-ink/20 text-ink font-mono text-sm uppercase tracking-wider rounded-sm hover:border-grove-forest hover:text-grove-forest transition-colors"
  >
    The Vision
  </button>
  <button
    onClick={() => handleDeepDive('ratchet')}
    className="px-6 py-3 border border-ink/20 text-ink font-mono text-sm uppercase tracking-wider rounded-sm hover:border-grove-forest hover:text-grove-forest transition-colors"
  >
    The Ratchet
  </button>
  <button
    onClick={() => handleDeepDive('economics')}
    className="px-6 py-3 border border-ink/20 text-ink font-mono text-sm uppercase tracking-wider rounded-sm hover:border-grove-forest hover:text-grove-forest transition-colors"
  >
    The Economics
  </button>
</div>
```

3. Run `npm run build`

---

### Phase 3: Terminal Welcome Flow

**Step 3.1: Add Welcome Message Constant**
1. Open `components/Terminal.tsx`
2. After the imports (around line 45), add:
```typescript
// First-time welcome message
const FIRST_TIME_WELCOME = `Welcome to your Grove.

This Terminal is where you interact with your AI village — trained on your data, running on your hardware, owned by you.

Think of it as ChatGPT, but private. Your Grove never leaves your machine. That's **intellectual independence**: AI that enriches *you*, not corporate shareholders.

**One thing to try:** Lenses let you explore the same knowledge from different perspectives — skeptic, enthusiast, or your own custom view.`;
```

**Step 3.2: Modify Welcome Flow**
1. Find the welcome useEffect (around line 353)
2. Modify to inject welcome message before showing LensPicker:
```typescript
// Check if we should show welcome on first open
useEffect(() => {
  const hasBeenWelcomed = localStorage.getItem('grove-terminal-welcomed') === 'true';

  if (terminalState.isOpen && !hasBeenWelcomed && !hasShownWelcome) {
    // Inject welcome message into chat
    setMessages(prev => [...prev, {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: FIRST_TIME_WELCOME,
      timestamp: new Date()
    }]);
    
    // Small delay before showing LensPicker
    setTimeout(() => {
      setShowLensPicker(true);
    }, 500);
    
    setHasShownWelcome(true);
    localStorage.setItem('grove-terminal-welcomed', 'true');
  }
}, [terminalState.isOpen, hasShownWelcome]);
```

**Step 3.3: Update LensPicker Copy (if applicable)**
1. Open `components/Terminal/LensPicker.tsx`
2. If there are button labels, update to:
   - "Try an existing Lens"
   - "Create your own"

3. Run `npm run build`

---

### Phase 4: Lens Selector Redesign

**Step 4.1: Replace Lens Badge with Pill Button**
1. Open `components/Terminal/TerminalControls.tsx`
2. Lines 32-48: Replace the entire lens badge button with:
```tsx
<button
  onClick={onSwitchLens}
  className="flex items-center space-x-1.5 px-3 py-1 border border-ink/20 rounded-full hover:border-grove-forest hover:text-grove-forest transition-colors"
>
  <span className="text-xs">🔎</span>
  <span className="text-[11px] font-sans font-medium text-ink group-hover:text-grove-forest">
    {persona?.publicLabel || 'Choose Lens'}
  </span>
  <span className="text-[9px] text-ink-muted">▾</span>
</button>
```
3. Remove the `colors` variable and `getPersonaColors` import if no longer used
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
1. List files modified with line citations
2. Report build status (pass/fail)
3. Note any issues or deviations from plan

After all phases:
1. Summary of all changes
2. Final build status
3. Smoke test results

## Forbidden Actions
- Do NOT add new animations
- Do NOT modify chat API or backend
- Do NOT change LensPicker modal/overlay structure
- Do NOT add new localStorage keys beyond 'grove-terminal-welcomed'
- Do NOT refactor unrelated Terminal code
- Do NOT skip build verification between phases

## Testing After Completion

1. **Clear localStorage:** Open DevTools → Application → Local Storage → Clear
2. **Refresh page**
3. **Scroll through Genesis screens:**
   - Verify "STEP INTO YOUR GROVE" headline (no animation glitches)
   - Verify "YOUR GROVE" is orange (grove-clay)
   - Verify all "Consult the Grove" CTAs
   - Verify Foundation button order: Vision → Ratchet → Economics
4. **Open Terminal:**
   - Verify welcome message appears in chat
   - Verify LensPicker appears after
5. **Close and reopen Terminal:**
   - Verify welcome does NOT appear again
6. **Check lens selector:**
   - Verify shows as pill: [🔎 Lens Name ▾]
   - Verify hover state changes border color
7. **Check console for errors**
