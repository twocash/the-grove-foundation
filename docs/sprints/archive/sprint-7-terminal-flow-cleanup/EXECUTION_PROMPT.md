# Sprint 7: Execution Prompt

Copy this prompt into Claude Code to execute the implementation.

---

## EXECUTION PROMPT

```
I need to implement Sprint 7: Terminal Flow Cleanup for The Grove Foundation project.

## Foundation Loop Protocol

Follow the Foundation Loop methodology:
1. Read the sprint spec first
2. Audit relevant files before making changes
3. Make minimal, focused changes
4. Test after each significant change
5. Document decisions in DEVLOG.md

## Context

Read the sprint documentation:
- `docs/sprints/sprint-7-terminal-flow-cleanup/SPEC.md` - Full specification
- `docs/sprints/sprint-7-terminal-flow-cleanup/FILE_REFERENCE.md` - Current file contents

## Goals

1. **Fix header persistence** - Header should always be visible during chat
2. **Show journey name** - Replace "Guided Journey" with actual journey title
3. **Redesign JourneyCard** - Make it minimal (just the suggestion prompt)
4. **Inline JourneyCompletion** - Move from floating modal to inline in chat

## Implementation Order

### Phase 1: Investigation (Don't change code yet)

1. Read `components/Terminal.tsx` focusing on:
   - Lines 1040-1082 (header rendering)
   - Lines 1319-1342 (JourneyCard usage)
   - Lines 1412-1439 (JourneyCompletion modal)

2. Read `src/explore/ExploreChat.tsx` for CSS overrides

3. Read `hooks/useNarrativeEngine.ts` to understand:
   - How to get active journey metadata
   - What data is available for journey title

4. Document findings in DEVLOG.md

### Phase 2: Fix Header Persistence

1. Check if header is rendering but invisible (CSS issue) or not rendering at all (state issue)
2. Add debug logging if needed to trace state
3. Fix the root cause
4. Verify fix works in both fresh load and after chat engagement

### Phase 3: Journey Name in Header

1. Find where journey title data is available
2. Update Terminal.tsx line ~1076:
   ```tsx
   // From:
   journeyName={currentThread.length > 0 ? 'Guided Journey' : 'Self-Guided'}
   
   // To:
   journeyName={activeJourneyTitle || (currentThread.length > 0 ? 'Guided' : 'Self-Guided')}
   ```
3. Wire up the journey title from narrative engine

### Phase 4: Redesign JourneyCard

1. Rewrite `components/Terminal/JourneyCard.tsx`:
   - Remove journeyTitle prop (context is in header now)
   - Remove progress bar
   - Remove "explore freely" option
   - Keep only: header label, card count, single suggestion button

2. New simplified component:
   ```tsx
   interface JourneyCardProps {
     currentPosition: number;
     totalCards: number;
     currentCard: Card | null;
     onResume: () => void;
   }
   ```

3. Update usage in Terminal.tsx (~line 1321)

### Phase 5: Inline JourneyCompletion

1. Move the JourneyCompletion from fixed modal to inside messages area

2. In Terminal.tsx, find the modal (~line 1412):
   ```tsx
   {showJourneyCompletion && (
     <div className="fixed inset-0 z-[60]...">
   ```

3. Move it inside the messages div (after messages.map, before input area):
   ```tsx
   {showJourneyCompletion && (
     <div className="max-w-md mx-auto my-6">
       <JourneyCompletion ... />
     </div>
   )}
   ```

4. Update JourneyCompletion.tsx styling for dark mode:
   - Replace `bg-white` with `bg-surface-light dark:bg-surface-dark`
   - Replace `text-ink` with `text-slate-900 dark:text-slate-100`
   - Replace `border-ink/10` with `border-border-light dark:border-border-dark`

### Phase 6: Verification

1. Run `npm run build` - must pass
2. Run `npm test` - must pass
3. Test manually:
   - Fresh load: Header visible
   - After lens selection: Header persists, shows lens
   - During journey: Shows journey name, minimal card
   - Journey complete: Inline celebration (not modal)
   - Dark mode: All styled correctly

## Constraints

- Do NOT break existing chat functionality
- Do NOT remove Scholar Mode button
- Keep changes minimal and focused
- Use CSS variables for dark mode (--grove-*, not hardcoded colors)

## Output

Create DEVLOG.md in the sprint folder with:
- Investigation findings
- Changes made
- Any issues encountered
- Test results
```

---

## After Execution

Return to the original Claude context and share:
1. Screenshots of fixed header + inline journey card + inline completion
2. DEVLOG.md contents
3. Any issues or decisions made
