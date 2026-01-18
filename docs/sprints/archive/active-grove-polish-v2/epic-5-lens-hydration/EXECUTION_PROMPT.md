# Epic 5: Lens URL Hydration - Execution Prompt

**Sprint**: active-grove-polish-v2
**Epic**: 5 - URL Lens Parameter Hydration
**Date**: 2024-12-23

---

## Claude CLI Kickoff Prompt

Copy the entire block below and paste into Claude CLI:

---

```
# Epic 5: URL Lens Parameter Hydration

## Context

I'm working on The Grove Foundation codebase. We have a bug where URL lens parameters (`?lens=engineer`) aren't being respected - the personalized headline shows correctly, but clicking the seedling still shows the lens picker instead of skipping directly to the Terminal.

**Root Cause**: SSR hydration gap. `NarrativeEngineContext` reads URL params in a `useState` initializer, which returns null on the server and React preserves that null on hydration.

**Strategy**: Instead of patching the 694-line legacy NarrativeEngineContext monolith, we're creating an isolated "bridge hook" that:
1. Reads URL params on client mount
2. Uses existing `selectLens()` mutator from NarrativeEngine
3. Is documented as temporary migration code

## Sprint Documentation

Read these files in order for full context:

1. `docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/REPO_AUDIT.md` - Architecture analysis
2. `docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/SPEC.md` - Goals & acceptance criteria
3. `docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/ARCHITECTURE.md` - Target state & migration path
4. `docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/MIGRATION_MAP.md` - File changes
5. `docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/DECISIONS.md` - ADRs

## Tasks

### Task 1: Create useLensHydration.ts

Create new file: `src/surface/hooks/useLensHydration.ts`

Requirements:
- 50+ lines of header documentation explaining:
  - The architectural context (NarrativeEngine monolith problem)
  - Why this is a bridge hook
  - The migration path (Phase 1/2/3)
  - When to modify vs when to wait for Phase 2
- Import useNarrativeEngine and DEFAULT_PERSONAS
- Create VALID_ARCHETYPES from Object.keys(DEFAULT_PERSONAS)
- Implement useLensHydration() function:
  - SSR guard: `if (typeof window === 'undefined') return;`
  - Idempotency guard: useRef(false) pattern
  - Read `?lens=` from URL params
  - Validate against VALID_ARCHETYPES
  - Skip if session.activeLens already matches
  - Call selectLens() with validated lens
  - Console log with `[LensHydration]` prefix
- Return void (side-effect only hook)
- Export as named and default

### Task 2: Modify GenesisPage.tsx

File: `src/surface/pages/GenesisPage.tsx`

Changes:
1. Add import: `import { useLensHydration } from '../hooks/useLensHydration';`
2. Add hook call BEFORE useQuantumInterface():
   ```typescript
   // Bridge SSR gap for URL lens params (see hook for migration context)
   useLensHydration();
   ```

The order matters - useLensHydration must fire before useQuantumInterface so the session is updated.

### Task 3: Verify Build

Run:
```bash
npm run build
```

Ensure no TypeScript errors.

### Task 4: Test

Start dev server and test these URLs:

| URL | Expected Console | Expected Behavior |
|-----|------------------|-------------------|
| `/` | "No URL lens param" | Picker shows on tree click |
| `/?lens=engineer` | "Hydrating from URL: engineer" | Skips picker, Terminal opens |
| `/?lens=academic` | "Hydrating from URL: academic" | Skips picker, Terminal opens |
| `/?lens=invalid` | "Invalid lens param: invalid" | Picker shows (graceful fallback) |

### Task 5: Commit

```bash
git add .
git commit -m "feat(lens): URL parameter hydration for deep links

- Add useLensHydration bridge hook for SSR gap
- Fix: ?lens=engineer now skips picker and opens Terminal
- Extensive documentation for future engagement system migration
- Part of Active Grove Polish v2 sprint

ADRs: 019-025 (see docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/DECISIONS.md)"
```

## Key Files Reference

- Legacy monolith (DO NOT MODIFY): `hooks/NarrativeEngineContext.tsx`
- Validation source: `data/default-personas.ts`
- Clean pattern to follow: `src/surface/hooks/useQuantumInterface.ts`
- Page to modify: `src/surface/pages/GenesisPage.tsx`

## Documentation Emphasis

The header documentation in useLensHydration.ts is CRITICAL. It should explain:
1. Why this file exists (SSR hydration bug)
2. Why we didn't patch NarrativeEngine (too risky, monolith)
3. The migration phases (when this hook will be deleted)
4. What changes are appropriate vs what requires Phase 2

This documentation serves future Claude sessions and developers who need to understand the architectural evolution.
```

---

## Post-Execution

After completing the tasks:

1. Update DEVLOG.md with execution notes
2. Verify all test scenarios pass
3. Deploy to preview environment
4. Test on production URL: `https://the-grove.ai/?lens=engineer`
