# SPRINTS: Explore Pool Filtering v1

**Sprint ID:** `explore-pool-filtering-v1`
**Estimated Effort:** 2-3 hours
**Dependencies:** None (extends existing patterns)

---

## Epic 1: DEX Mode Toggle UI

Add the toggle button to the header, following existing RAG/JOURNEY pattern.

### Story 1.1: Add DEX toggle state to ExploreShell

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Task:** Add useState + localStorage pattern for dexMode, matching existing journeyMode pattern.

**Code:**
```typescript
// After journeyMode state declaration (~line 75)
const [dexMode, setDexMode] = useState(() => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('grove-dex-mode');
    // Default to true - exclude library prompts by default
    return stored !== 'false';
  }
  return true;
});

const handleDexModeToggle = useCallback(() => {
  setDexMode(prev => {
    const next = !prev;
    localStorage.setItem('grove-dex-mode', String(next));
    console.log('[ExploreShell] DEX mode:', next ? 'ON' : 'OFF');
    return next;
  });
}, []);
```

**Tests:** Manual verification of state toggle

---

### Story 1.2: Add props to KineticHeader

**File:** `src/surface/components/KineticStream/KineticHeader.tsx`

**Task:** Add dexMode and onDexModeToggle props to interface and component.

**Code (interface addition):**
```typescript
// Add to KineticHeaderProps interface
dexMode?: boolean;
onDexModeToggle?: () => void;
```

**Code (destructure in component):**
```typescript
// Add to destructuring
dexMode,
onDexModeToggle,
```

---

### Story 1.3: Add DEX toggle button to KineticHeader

**File:** `src/surface/components/KineticStream/KineticHeader.tsx`

**Task:** Add DEX toggle button after JOURNEY toggle, using identical styling pattern.

**Code (add after JOURNEY toggle, ~line 130):**
```typescript
{/* Sprint: explore-pool-filtering-v1 - DEX mode toggle */}
{onDexModeToggle && (
  <button
    onClick={onDexModeToggle}
    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium
      border transition-all duration-200
      ${dexMode
        ? 'bg-[var(--neon-cyan)]/20 border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]'
        : 'bg-[var(--glass-elevated)] border-[var(--glass-border)] text-[var(--glass-text-muted)]'
      }
      hover:border-[var(--neon-cyan)]/70`}
    title={dexMode
      ? 'DEX Mode: Only curated prompts (excludes legacy library)'
      : 'Legacy Mode: All prompts including library'}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${dexMode ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-text-subtle)]'}`} />
    <span>DEX</span>
    <span className="text-[9px] opacity-70">{dexMode ? 'ON' : 'OFF'}</span>
  </button>
)}
```

---

### Story 1.4: Wire props in ExploreShell render

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Task:** Pass dexMode state and handler to KineticHeader component.

**Code (find KineticHeader render, add props):**
```typescript
<KineticHeader
  // ... existing props
  dexMode={dexMode}
  onDexModeToggle={handleDexModeToggle}
/>
```

### Build Gate (Epic 1)
```bash
npm run build  # Must compile
npm run dev    # Visual verification: DEX toggle visible and clickable
```

---

## Epic 2: Prompt Pool Filtering

Wire the DEX mode toggle to actually filter prompts.

### Story 2.1: Add dexMode parameter to useNavigationPrompts

**File:** `src/explore/hooks/useNavigationPrompts.ts`

**Task:** Accept dexMode from context or props. For now, read directly from localStorage (simpler, matches pattern).

**Code (add inside useMemo, after grovePool creation, ~line 138):**
```typescript
// Sprint: explore-pool-filtering-v1 - DEX mode filter
// Read DEX mode from localStorage (matches header toggle)
const dexMode = typeof window !== 'undefined' 
  ? localStorage.getItem('grove-dex-mode') !== 'false'
  : true;

// Filter out library prompts when DEX mode is ON
let filteredBySource = grovePool;
if (dexMode) {
  filteredBySource = grovePool.filter(p => p.payload.source !== 'library');
  console.log('[NavPrompts] DEX mode ON - filtered to', filteredBySource.length, 'non-library prompts');
}
```

**Note:** Update subsequent code to use `filteredBySource` instead of `grovePool`.

---

### Story 2.2: Add history filter for repetition prevention

**File:** `src/explore/hooks/useNavigationPrompts.ts`

**Task:** Exclude prompts that appear in `context.promptsSelected`.

**Code (add after source filter):**
```typescript
// Sprint: explore-pool-filtering-v1 - History filter (prevent repetition)
const recentlySelected = new Set(context.promptsSelected || []);
const filteredByHistory = filteredBySource.filter(p => !recentlySelected.has(p.meta.id));
console.log('[NavPrompts] History filter:', filteredBySource.length, '->', filteredByHistory.length, 
  '(excluded', recentlySelected.size, 'previously selected)');
```

**Note:** Use `filteredByHistory` as the pool for subsequent filtering (genesis check, scoring).

---

### Story 2.3: Update filter chain to use new pools

**File:** `src/explore/hooks/useNavigationPrompts.ts`

**Task:** Ensure the filter chain flows: grovePool → filteredBySource → filteredByHistory → genesis/scoring

**Verification:** Console logs should show:
```
[NavPrompts] DEX mode ON - filtered to 250 non-library prompts
[NavPrompts] History filter: 250 -> 247 (excluded 3 previously selected)
[NavPrompts] GENESIS PHASE - found 5 genesis-welcome prompts
```

### Build Gate (Epic 2)
```bash
npm run build  # Must compile
npm run dev    # Verify console logs show filtering
```

---

## Epic 3: Feature Flag Registration (Optional)

Register the flag for potential admin control.

### Story 3.1: Add to DEFAULT_FEATURE_FLAGS

**File:** `src/core/config/defaults.ts`

**Task:** Add dex-mode flag to defaults array.

**Code:**
```typescript
{
  id: 'dex-mode',
  name: 'DEX Mode',
  description: 'Exclude legacy library prompts from /explore navigation',
  enabled: true,
  category: 'exploration'
},
```

### Story 3.2: Add to narratives-schema

**File:** `src/data/narratives-schema.ts`

**Task:** Add to FeatureFlag type if category needs extension.

**Note:** This is for future admin panel integration. The UI toggle works independently via localStorage.

### Build Gate (Epic 3)
```bash
npm run build  # Must compile
```

---

## Final Verification

```bash
# Full test suite
npm run build
npm test
npx playwright test

# Manual testing checklist
# 1. Fresh incognito session
# 2. Navigate to /explore
# 3. Verify DEX toggle is visible (default ON)
# 4. Send a message, observe prompts appear
# 5. Click a prompt, send it
# 6. Verify that prompt doesn't reappear
# 7. Toggle DEX OFF → observe more prompts (library included)
# 8. Toggle DEX ON → library prompts disappear
# 9. Refresh page → toggle state persists
```

---

## Commit Strategy

```bash
# After Epic 1
git add -A
git commit -m "feat(header): add DEX mode toggle UI"

# After Epic 2
git add -A
git commit -m "feat(prompts): filter by source and history in navigation"

# After Epic 3 (if completed)
git add -A
git commit -m "chore(flags): register dex-mode feature flag"

# Final
git push origin bedrock
```
