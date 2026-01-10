# SPRINTS: System Prompt Versioning v1

**Sprint:** system-prompt-versioning-v1  
**Date:** January 10, 2026

---

## Sprint Structure

Single sprint with 3 epics, estimated 2-3 hours total.

---

## Epic 1: Data Hook Extension

**Goal:** Add `saveAndActivate` function to useExperienceData  
**Effort:** 45 minutes  
**Risk:** Low

### Tasks

| Task | Description | Effort |
|------|-------------|--------|
| E1.1 | Add `saveAndActivate` function implementation | 20 min |
| E1.2 | Add TypeScript types for function signature | 5 min |
| E1.3 | Update hook return object to include new function | 5 min |
| E1.4 | Add console logging for debugging | 5 min |
| E1.5 | Test in isolation (call from browser console) | 10 min |

### Acceptance Criteria
- [ ] Function exists and is exported
- [ ] TypeScript compiles without errors
- [ ] Manual call creates new record in Supabase
- [ ] Old record gets archived
- [ ] Cache invalidation endpoint called

### File Changes
- `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts`

---

## Epic 2: Editor Integration

**Goal:** Wire "Save & Activate" button to new versioning flow  
**Effort:** 60 minutes  
**Risk:** Medium

### Tasks

| Task | Description | Effort |
|------|-------------|--------|
| E2.1 | Add `saveAndActivate` to editor props interface | 5 min |
| E2.2 | Add `modifiedFields` state tracking | 10 min |
| E2.3 | Update `handleFieldChange` to track modifications | 10 min |
| E2.4 | Create `handleSaveAndActivate` function | 15 min |
| E2.5 | Update button onClick binding | 5 min |
| E2.6 | Reset tracking on discard | 5 min |
| E2.7 | Test edit → save flow end-to-end | 10 min |

### Acceptance Criteria
- [ ] Props interface updated
- [ ] Modified fields tracked correctly
- [ ] "Save & Activate" triggers new version creation
- [ ] Discard resets modification tracking
- [ ] UI updates after save

### File Changes
- `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx`

---

## Epic 3: Factory Connection

**Goal:** Connect data hook to editor via console factory  
**Effort:** 30 minutes  
**Risk:** Low

### Tasks

| Task | Description | Effort |
|------|-------------|--------|
| E3.1 | Audit console-factory.tsx editor prop passing | 10 min |
| E3.2 | Add `saveAndActivate` to editor props | 10 min |
| E3.3 | End-to-end verification | 10 min |

### Acceptance Criteria
- [ ] Factory passes `saveAndActivate` to editor
- [ ] Full flow works: edit → save → new version created
- [ ] Build passes
- [ ] No console errors

### File Changes
- `src/bedrock/patterns/console-factory.tsx`

---

## Sprint Execution Order

```
┌─────────────────────────────────────────────────────────────┐
│ Execution Flow                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Epic 1: Data Hook           Epic 2: Editor                 │
│  ┌────────────────┐         ┌────────────────┐             │
│  │ E1.1 Function  │         │ E2.1 Props     │             │
│  │ E1.2 Types     │         │ E2.2 State     │             │
│  │ E1.3 Export    │────────▶│ E2.3 Tracking  │             │
│  │ E1.4 Logging   │         │ E2.4 Handler   │             │
│  │ E1.5 Test      │         │ E2.5 Button    │             │
│  └────────────────┘         │ E2.6 Reset     │             │
│                             │ E2.7 Test      │             │
│                             └───────┬────────┘             │
│                                     │                       │
│                                     ▼                       │
│                             Epic 3: Factory                 │
│                             ┌────────────────┐             │
│                             │ E3.1 Audit     │             │
│                             │ E3.2 Connect   │             │
│                             │ E3.3 Verify    │             │
│                             └────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependencies

| Epic | Depends On | Blocks |
|------|------------|--------|
| Epic 1 | None | Epic 2, Epic 3 |
| Epic 2 | Epic 1 | Epic 3 |
| Epic 3 | Epic 1, Epic 2 | None |

---

## Verification Gates

### After Epic 1
- [ ] `npm run build` passes
- [ ] Hook returns `saveAndActivate` function
- [ ] Manual test via console works

### After Epic 2
- [ ] `npm run build` passes
- [ ] Editor accepts new prop
- [ ] Field modification tracking works

### After Epic 3
- [ ] `npm run build` passes
- [ ] Full UI flow works
- [ ] Supabase shows version chain
- [ ] `/explore` uses new prompt

---

## Rollback Triggers

Abort and rollback if:
- Build fails after any epic
- Console factory pattern breaks
- Other console types affected (LensWorkshop, PromptWorkshop)
- Cache invalidation causes issues

---

## Success Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Build status | Passing | `npm run build` |
| New version created | Yes | Supabase query |
| Old version archived | Yes | Supabase query |
| Only one active | Yes | `WHERE status = 'active'` count = 1 |
| Version increment | old + 1 | Check payload.version |
| Provenance chain | Linked | Check previousVersionId |
| UI update | Correct | Visual inspection |

---

*Sprints complete. Proceed to EXECUTION_PROMPT.md*
