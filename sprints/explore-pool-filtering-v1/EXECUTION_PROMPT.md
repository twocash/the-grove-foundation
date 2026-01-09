# EXECUTION PROMPT: Explore Pool Filtering v1

**Sprint:** `explore-pool-filtering-v1`
**Branch:** `bedrock`
**Handoff Date:** 2026-01-09

---

## Context

You are implementing a feature to filter the prompt pool in Grove's `/explore` route. This adds:
1. A "DEX" toggle in the header (next to RAG and JOURNEY toggles)
2. Source filtering to exclude legacy library prompts when DEX mode is ON
3. History filtering to prevent showing prompts the user has already selected

**Key Constraint:** Strangler fig pattern - do NOT delete or modify legacy library prompt files. Only add filtering logic.

---

## Pre-Execution Verification

```bash
cd C:\github\the-grove-foundation
git checkout bedrock
git pull origin bedrock

# Verify build works before changes
npm run build
```

---

## Epic 1: DEX Mode Toggle UI

### Step 1.1: Add state to ExploreShell.tsx

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

Find the `journeyMode` state declaration (around line 75) and add DEX mode state after it:

```typescript
// Sprint: explore-pool-filtering-v1 - DEX mode toggle
// Default to true - exclude library prompts by default
const [dexMode, setDexMode] = useState(() => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('grove-dex-mode');
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

### Step 1.2: Add props to KineticHeader interface

**File:** `src/surface/components/KineticStream/KineticHeader.tsx`

Add to `KineticHeaderProps` interface:

```typescript
// Sprint: explore-pool-filtering-v1
dexMode?: boolean;
onDexModeToggle?: () => void;
```

Add to component destructuring:

```typescript
dexMode,
onDexModeToggle,
```

### Step 1.3: Add DEX toggle button

**File:** `src/surface/components/KineticStream/KineticHeader.tsx`

Find the JOURNEY toggle button (search for `onJourneyModeToggle`). Add this immediately after it:

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

### Step 1.4: Wire props in ExploreShell render

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

Find where `<KineticHeader` is rendered and add the new props:

```typescript
dexMode={dexMode}
onDexModeToggle={handleDexModeToggle}
```

### Verify Epic 1

```bash
npm run build
npm run dev
# Open http://localhost:3000/explore
# Verify DEX toggle appears next to JOURNEY toggle
# Click toggle - should change state and persist on refresh
```

### Commit Epic 1

```bash
git add -A
git commit -m "feat(header): add DEX mode toggle UI

Sprint: explore-pool-filtering-v1
- Add dexMode state with localStorage persistence
- Add DEX toggle button to KineticHeader
- Matches existing RAG/JOURNEY toggle pattern"
```

---

## Epic 2: Prompt Pool Filtering

### Step 2.1: Add source and history filters

**File:** `src/explore/hooks/useNavigationPrompts.ts`

Find the `grovePool` creation (where `activeOnly` filter is applied, around line 138-140). 

**IMPORTANT:** There's already some filtering logic including a genesis phase check. The new filters should be added BEFORE the genesis check but AFTER the grovePool creation.

Add these filters right after `grovePool` is created:

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
} else {
  console.log('[NavPrompts] DEX mode OFF - using full pool of', grovePool.length, 'prompts');
}

// Sprint: explore-pool-filtering-v1 - History filter (prevent repetition)
const recentlySelected = new Set(context.promptsSelected || []);
const filteredByHistory = filteredBySource.filter(p => !recentlySelected.has(p.meta.id));
if (recentlySelected.size > 0) {
  console.log('[NavPrompts] History filter:', filteredBySource.length, '->', filteredByHistory.length, 
    '(excluded', recentlySelected.size, 'previously selected)');
}
```

### Step 2.2: Update genesis phase check to use filtered pool

The existing genesis phase check uses `grovePool`. Update it to use `filteredByHistory` instead:

**BEFORE:**
```typescript
if (isGenesisPhase) {
  const genesisTagged = grovePool.filter(p =>
    p.meta.tags?.includes('genesis-welcome')
  );
```

**AFTER:**
```typescript
if (isGenesisPhase) {
  const genesisTagged = filteredByHistory.filter(p =>
    p.meta.tags?.includes('genesis-welcome')
  );
```

Also update the standard path to use `filteredByHistory`:

**BEFORE:**
```typescript
const pool = grovePool.map(grovePromptToPromptObject);
```

**AFTER:**
```typescript
const pool = filteredByHistory.map(grovePromptToPromptObject);
```

### Verify Epic 2

```bash
npm run build
npm run dev
# Open incognito: http://localhost:3000/explore
# Send a message
# Check console for:
#   [NavPrompts] DEX mode ON - filtered to X non-library prompts
#   [NavPrompts] History filter: X -> Y (excluded Z previously selected)
# Click a suggested prompt
# Verify that prompt doesn't reappear in next set of suggestions
# Toggle DEX OFF in header
# Verify more prompts appear (library prompts now included)
```

### Commit Epic 2

```bash
git add -A
git commit -m "feat(prompts): filter by source and history in navigation

Sprint: explore-pool-filtering-v1
- Exclude library prompts when DEX mode is ON
- Prevent repetition via promptsSelected history filter
- Console logging for debugging"
```

---

## Epic 3: Feature Flag Registration (Optional)

### Step 3.1: Add to defaults.ts

**File:** `src/core/config/defaults.ts`

Find `DEFAULT_FEATURE_FLAGS` array and add:

```typescript
{
  id: 'dex-mode',
  name: 'DEX Mode',
  description: 'Exclude legacy library prompts from /explore navigation',
  enabled: true,
  category: 'exploration'
},
```

### Commit Epic 3

```bash
git add -A
git commit -m "chore(flags): register dex-mode feature flag"
```

---

## Final Verification

```bash
# Full build
npm run build

# Run tests (if any prompt-related tests exist)
npm test

# Manual testing in incognito
# 1. /explore with DEX ON (default)
# 2. Verify prompts appear
# 3. Click a prompt, verify it doesn't reappear
# 4. Toggle DEX OFF, verify library prompts appear
# 5. Refresh, verify toggle state persists
```

---

## Troubleshooting

### Toggle doesn't persist
Check localStorage in DevTools:
```javascript
localStorage.getItem('grove-dex-mode')
```

### No prompts showing
Check console for filter logs. If pool is empty:
- Verify Supabase has prompts with `source !== 'library'`
- Genesis prompts should have `source: 'user'`

### History filter too aggressive
If no prompts ever show, check `context.promptsSelected`:
```javascript
// In useNavigationPrompts, log the context
console.log('[NavPrompts] promptsSelected:', context.promptsSelected);
```

### Build errors
The most likely issues:
- Missing import for useCallback in ExploreShell (should already exist)
- Typo in prop names between ExploreShell and KineticHeader

---

## Definition of Done

- [ ] DEX toggle visible in header
- [ ] Toggle state persists via localStorage
- [ ] DEX ON filters out `source: 'library'` prompts
- [ ] History filter prevents repeated suggestions
- [ ] Console logs confirm filtering is working
- [ ] No regression in existing prompt display
- [ ] All changes committed to bedrock branch
