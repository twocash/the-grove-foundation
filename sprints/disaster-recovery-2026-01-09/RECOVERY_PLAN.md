# Disaster Recovery Sprint: /explore Route Restoration
**Date:** 2026-01-09
**Priority:** CRITICAL - Production regression
**Reference Conversation:** `/mnt/transcripts/2026-01-09-16-42-29-pr41-merge-disaster-recovery.txt`

---

## Executive Summary

The `/explore` route regressed from a fully-functional kinetic stream experience to a basic welcome card. This happened due to a combination of:
1. PR #41 merge deleting critical files
2. Branch divergence between `bedrock` and `hotfix/experiences-console-v1.1`
3. Claude Desktop making direct file modifications that were never committed

**Last Known Working State:** 10:13:14 AM EST (screenshot evidence)

---

## What Was Working (Evidence: Screenshot at 10:13 AM)

The working `/explore` route had:
- [x] RAG ON / JOURNEY On toggle buttons in header
- [x] Full kinetic stream with conversation bubbles
- [x] Navigation prompts at response footers ("What topics can I explore?")
- [x] Concept highlighting in kinetic text (clickable highlighted phrases)
- [x] 4D context-aware prompt selection
- [x] Lens picker dropdown
- [x] Stage indicator (Orienting badge)

---

## What Is Broken Now

- [ ] No RAG/JOURNEY toggles in header
- [ ] No navigation prompts
- [ ] No concept highlighting
- [ ] Static welcome card only
- [ ] 4D prompts system non-functional

---

## Root Cause Analysis

### Problem 1: PR #41 Merge Deleted Files
Commit `2750007` (merged 2026-01-09 11:06) deleted:
- `src/explore/hooks/useNavigationPrompts.ts`
- `src/explore/hooks/usePromptForHighlight.ts`
- `src/core/context-fields/useContextState.ts`
- `src/core/context-fields/adapters.ts`
- `src/core/context-fields/lookup.ts`
- Parts of `src/core/context-fields/scoring.ts`
- Parts of `src/core/context-fields/types.ts`

### Problem 2: Branch Divergence
- `bedrock` branch (current): Missing RAG/JOURNEY toggle code
- `hotfix/experiences-console-v1.1`: Has RAG/JOURNEY toggles but missing other files
- `main`: Behind on all recent work

Key commits with working code:
- `a1102c9` - KineticHeader with RAG/JOURNEY toggles (on hotfix branch)
- `e272b29` - hybrid-search-toggle-v1 sprint
- `5d3e703` - prompt-progression-v1 sprint

### Problem 3: Uncommitted Claude Desktop Changes
Claude Desktop was making direct file modifications while Claude CLI was doing sprint work. These modifications were never committed and are now lost.

---

## Recovery Strategy

### Phase 1: Establish Clean Baseline
1. Create recovery branch from current bedrock
2. Document current file state with checksums

### Phase 2: Restore Core Infrastructure
From commit `d2b7700` (last known good state before PR #41):
```
src/explore/hooks/useNavigationPrompts.ts
src/explore/hooks/usePromptForHighlight.ts  
src/explore/hooks/index.ts
src/core/context-fields/useContextState.ts
src/core/context-fields/adapters.ts
src/core/context-fields/lookup.ts
src/core/context-fields/scoring.ts (full version)
src/core/context-fields/types.ts (full version)
```

### Phase 3: Restore RAG/JOURNEY Toggle UI
From commit `a1102c9`:
```
src/surface/components/KineticStream/KineticHeader.tsx
```

### Phase 4: Wire Toggle Props Through ExploreShell
The ExploreShell needs to:
1. Import toggle state hooks
2. Pass props to KineticHeader
3. Connect to feature flag system

### Phase 5: Add Missing Path Aliases
Add to `vite.config.ts` and `tsconfig.json`:
```
@explore -> ./src/explore
```

### Phase 6: Verify Build & Test
1. `npm run build` - must succeed
2. `npm run dev` - verify at localhost:3004
3. Visual verification against 10:13 AM screenshot

---

## File-by-File Recovery Commands

```bash
# Create recovery branch
git checkout bedrock
git checkout -b recovery/explore-route-2026-01-09

# Phase 2: Core infrastructure from d2b7700
git checkout d2b7700 -- src/explore/hooks/useNavigationPrompts.ts
git checkout d2b7700 -- src/explore/hooks/usePromptForHighlight.ts
git checkout d2b7700 -- src/explore/hooks/index.ts
git checkout d2b7700 -- src/core/context-fields/

# Phase 3: KineticHeader with toggles from a1102c9
git checkout a1102c9 -- src/surface/components/KineticStream/KineticHeader.tsx

# Phase 4: ExploreShell - MANUAL EDIT REQUIRED
# The hotfix version imports useGenesisPrompts which doesn't exist
# Need to merge toggle wiring from hotfix into bedrock version
```

---

## ExploreShell Integration (Phase 4 Details)

The bedrock ExploreShell at `18ed922` needs these additions:

### 1. Add imports
```typescript
// Add after existing imports
import { useLocalStorage } from '../../../../hooks/useLocalStorage';
```

### 2. Add state for toggles
```typescript
// Inside ExploreShell component
const [useHybridSearch, setUseHybridSearch] = useLocalStorage('explore-hybrid-search', true);
const [journeyMode, setJourneyMode] = useLocalStorage('explore-journey-mode', true);
```

### 3. Add toggle handlers
```typescript
const handleHybridSearchToggle = useCallback(() => {
  setUseHybridSearch(prev => !prev);
}, [setUseHybridSearch]);

const handleJourneyModeToggle = useCallback(() => {
  setJourneyMode(prev => !prev);
}, [setJourneyMode]);
```

### 4. Pass to KineticHeader
```typescript
<KineticHeader
  // ... existing props
  useHybridSearch={useHybridSearch}
  onHybridSearchToggle={handleHybridSearchToggle}
  journeyMode={journeyMode}
  onJourneyModeToggle={handleJourneyModeToggle}
/>
```

---

## Verification Checklist

After recovery, verify each item against the 10:13 AM screenshot:

- [ ] Header shows "Explore The Grove" title
- [ ] Header shows stage badge (● Orienting • 2)
- [ ] Header shows RAG toggle (● RAG ON/OFF)
- [ ] Header shows JOURNEY toggle (● JOURNEY ON/OFF)
- [ ] Header shows "Choose Lens" dropdown
- [ ] Header shows "Self-Guided" indicator
- [ ] Kinetic stream renders conversation bubbles
- [ ] Response bubbles have "The Grove" label
- [ ] User messages appear as right-aligned bubbles
- [ ] Navigation prompts appear at response footers
- [ ] Highlighted concepts are clickable
- [ ] "Let's focus" button appears after responses
- [ ] Input field shows "Ask anything about The Grove..."

---

## Post-Recovery Actions

1. **Commit Recovery**
   ```bash
   git add -A
   git commit -m "fix: restore /explore route from 2026-01-09 disaster"
   ```

2. **Update Bedrock Sprint Contract**
   - Add pre-merge checklist item: "Verified /explore route functional"
   - Add artifact requirement: Screenshot evidence before merge

3. **Document in DEVLOG**
   - Root cause analysis
   - Files affected
   - Prevention measures

4. **Push to Remote**
   ```bash
   git push origin recovery/explore-route-2026-01-09
   ```

5. **Create PR to Bedrock**
   - Reference this recovery plan
   - Include before/after screenshots

---

## Key Git References

| Commit | Description | Contains |
|--------|-------------|----------|
| `d2b7700` | Last good state before PR #41 | 4D prompts system, context-fields |
| `a1102c9` | prompt-journey-mode-v1 | KineticHeader with toggles |
| `e272b29` | hybrid-search-toggle-v1 | RAG toggle implementation |
| `18ed922` | Current bedrock HEAD | ExploreShell base (no toggles) |
| `16e2d76` | hotfix branch HEAD | Mixed state (some files broken) |

---

## Files Currently Modified (Uncommitted)

Run `git status` to see current state. Files touched during this session:
- `src/surface/components/KineticStream/KineticHeader.tsx`
- `src/explore/hooks/*`
- `src/core/context-fields/*`
- `vite.config.ts`
- `tsconfig.json`
- `docs/BEDROCK_SPRINT_CONTRACT.md`

**RECOMMENDATION:** `git stash` current changes before starting clean recovery.

---

## Execution Instructions for New Context

1. Read this plan completely
2. Read transcript at `/mnt/transcripts/2026-01-09-16-42-29-pr41-merge-disaster-recovery.txt` for additional context
3. Start with `git stash` to preserve current modifications
4. Execute Phase 1-6 in order
5. Verify against checklist
6. Commit and push

**DO NOT** attempt to merge hotfix branch wholesale - it has incompatible changes.

**DO** cherry-pick specific files from specific commits as documented above.
