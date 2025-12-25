# Terminal Polish v1 — Execution Prompt

**Sprint:** terminal-polish-v1  
**For:** Claude Code CLI  
**Working Directory:** `C:\GitHub\the-grove-foundation`

---

## Context

This sprint fixes a gap from Sprint 6: the `--card-*` tokens were documented but never implemented. CardShell.tsx references undefined CSS variables, causing broken visual states.

Additionally, the Inspector panels show fake config UI instead of actual object data.

**Read before executing:**
- `docs/sprints/terminal-polish-v1/SPEC.md` — Requirements with Pattern Check
- `docs/sprints/terminal-polish-v1/MIGRATION_MAP.md` — Exact code to add
- `docs/sprints/terminal-polish-v1/DECISIONS.md` — ADRs explaining choices

---

## Pre-Flight Checks

```bash
cd C:\GitHub\the-grove-foundation

# Verify clean state
git status

# Confirm tests pass before changes
npm run build
npm run test
```

Expected: 161/161 tests passing, build succeeds.

---

## Step 1: Add Card Tokens (Epic 1)

**File:** `styles/globals.css`

1. Find the `:root { }` block containing `--chat-*` tokens (near end of file)
2. Add the card tokens AFTER the chat tokens block
3. See MIGRATION_MAP.md "Change 1" for exact CSS

**Verify:**
```bash
npm run build
```

**Commit:**
```bash
git add styles/globals.css
git commit -m "feat: add --card-* tokens to globals.css"
```

---

## Step 2: Create ObjectInspector (Epic 2)

**Create directory and files:**
```bash
mkdir -p src/shared/inspector
```

**Create:** `src/shared/inspector/ObjectInspector.tsx`
- See MIGRATION_MAP.md "Change 2" for full implementation
- ~140 lines: component + CollapsibleSection + JsonBlock

**Create:** `src/shared/inspector/index.ts`
```ts
export { ObjectInspector } from './ObjectInspector';
```

**Verify:**
```bash
npm run build
npm run test
```

**Commit:**
```bash
git add src/shared/inspector/
git commit -m "feat: create ObjectInspector component"
```

---

## Step 3: Replace LensInspector (Epic 3)

**File:** `src/explore/LensInspector.tsx`

1. Replace entire file content with MIGRATION_MAP.md "Change 3"
2. Key changes:
   - Remove fake form imports (Toggle, Slider, Select)
   - Add personaToGroveObject normalizer
   - Render ObjectInspector instead of fake UI

**Verify:**
```bash
npm run build
npm run test
```

**Commit:**
```bash
git add src/explore/LensInspector.tsx
git commit -m "refactor: replace LensInspector with ObjectInspector"
```

---

## Step 4: Replace JourneyInspector (Epic 4)

**File:** `src/explore/JourneyInspector.tsx`

1. Replace entire file content with MIGRATION_MAP.md "Change 4"
2. Same pattern as LensInspector

**Verify:**
```bash
npm run build
npm run test
```

**Commit:**
```bash
git add src/explore/JourneyInspector.tsx
git commit -m "refactor: replace JourneyInspector with ObjectInspector"
```

---

## Step 5: Visual Verification

```bash
npm run dev
```

**Test matrix:**

| Screen | Action | Expected |
|--------|--------|----------|
| /terminal → Lenses | View cards | Borders visible (slate/cyan) |
| /terminal → Lenses | Hover card | Border lightens |
| /terminal → Lenses | Click card | Inspector opens with JSON |
| Inspector | View META | Shows id, type, status, createdBy |
| Inspector | View PAYLOAD | Shows systemPrompt, tone, etc. |
| Inspector | Click Copy | Valid JSON in clipboard |
| /terminal → Journeys | Click card | Inspector shows Journey JSON |
| Marketing page | Load | No changes |

---

## Step 6: Final Commit

```bash
# Update devlog
# Edit docs/sprints/terminal-polish-v1/DEVLOG.md with completion status

git add docs/sprints/terminal-polish-v1/DEVLOG.md
git commit -m "docs: complete terminal-polish-v1 sprint"

# Push
git push origin main
```

---

## Troubleshooting

### "Cannot find module '@core/schema/grove-object'"

Check tsconfig.json paths. The import should resolve to `src/core/schema/grove-object.ts`.

### "useNarrativeEngine is not defined"

Check import path. Should be:
```ts
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
```

### Card borders still broken after token add

1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server
3. Verify tokens are in `:root { }` block, not inside `@theme { }`

### Inspector not opening

Check WorkspaceUIContext is providing `closeInspector`. Verify the component is mounted in the inspector slot.

---

## Rollback

If critical issues:

```bash
git checkout HEAD -- styles/globals.css
git checkout HEAD -- src/explore/LensInspector.tsx
git checkout HEAD -- src/explore/JourneyInspector.tsx
rm -rf src/shared/inspector/
```

---

## Success Criteria

- [ ] `npm run build` passes
- [ ] `npm run test` — 161/161 passing
- [ ] Card borders render correctly
- [ ] LensInspector shows Persona JSON
- [ ] JourneyInspector shows Journey JSON
- [ ] Copy JSON produces valid JSON
- [ ] Marketing demo unchanged

---

*Sprint ready for execution. Update DEVLOG.md as you complete each step.*
