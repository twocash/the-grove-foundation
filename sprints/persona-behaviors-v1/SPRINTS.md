# Sprint Plan: persona-behaviors-v1

**Sprint:** persona-behaviors-v1
**Duration:** 1 day
**Date:** 2025-01-02

---

## Epic 1: Schema Extension

### Story 1.1: Add PersonaBehaviors interface
**File:** `data/narratives-schema.ts`
**Task:** Add ResponseMode type, ClosingBehavior type, and PersonaBehaviors interface
**Tests:** TypeScript compilation validates types

### Story 1.2: Extend Persona interface
**File:** `data/narratives-schema.ts`
**Task:** Add optional `behaviors?: PersonaBehaviors` field to Persona interface
**Tests:** TypeScript compilation validates types

### Build Gate
```bash
npm run build
```

---

## Epic 2: Persona Configuration

### Story 2.1: Add Wayne Turner behaviors
**File:** `data/default-personas.ts`
**Task:** Add behaviors field to wayne-turner persona:
```typescript
behaviors: {
  responseMode: 'contemplative',
  closingBehavior: 'question',
  useBreadcrumbTags: false,
  useTopicTags: false,
  useNavigationBlocks: false
}
```
**Tests:** Unit test verifies Wayne has correct behaviors

### Story 2.2: Add Dr. Chiang behaviors (if persona exists)
**File:** `data/default-personas.ts`
**Task:** Add behaviors field to dr-chiang persona (if it exists):
```typescript
behaviors: {
  responseMode: 'librarian',
  closingBehavior: 'navigation'
}
```
**Tests:** Unit test verifies Dr. Chiang has correct behaviors

### Story 2.3: Verify default personas unchanged
**File:** `data/default-personas.ts`
**Task:** Confirm concerned-citizen and others have NO behaviors field
**Tests:** Unit test verifies undefined behaviors

### Build Gate
```bash
npm run build
npm test -- --grep "persona"
```

---

## Epic 3: Frontend Propagation

### Story 3.1: Extend ChatOptions interface
**File:** `services/chatService.ts`
**Task:** Add `personaBehaviors?: PersonaBehaviors` to ChatOptions interface
**Tests:** TypeScript compilation

### Story 3.2: Update sendMessageStream request body
**File:** `services/chatService.ts`
**Task:** Include `personaBehaviors: options.personaBehaviors` in request body
**Tests:** Integration test verifies field is sent

### Story 3.3: Update initChatSession request body
**File:** `services/chatService.ts`
**Task:** Include personaBehaviors in init request (if needed for session setup)
**Tests:** TypeScript compilation

### Story 3.4: Update Terminal.tsx to pass behaviors
**File:** `components/Terminal.tsx`
**Task:** Add `personaBehaviors: activeLensData?.behaviors` to sendMessageStream call (~line 985)
**Tests:** TypeScript compilation

### Build Gate
```bash
npm run build
npm test -- --grep "chatService"
```

---

## Epic 4: Server Prompt Assembly

### Story 4.1: Define RESPONSE_MODES constant
**File:** `server.js`
**Task:** Add RESPONSE_MODES object with architect, librarian, contemplative definitions
**Location:** Near top of file with other constants

### Story 4.2: Define CLOSING_BEHAVIORS constant
**File:** `server.js`
**Task:** Add CLOSING_BEHAVIORS object with navigation, question, open definitions
**Location:** Near RESPONSE_MODES

### Story 4.3: Extract IDENTITY_PROMPT from FALLBACK_SYSTEM_PROMPT
**File:** `server.js`
**Task:** Split base prompt into:
- IDENTITY_PROMPT (core identity, always included)
- MODE/FORMATTING sections (now conditional)

### Story 4.4: Modify buildSystemPrompt to read behaviors
**File:** `server.js`
**Task:** Update buildSystemPrompt() to:
1. Destructure personaBehaviors from options
2. Apply defaults for undefined flags
3. Conditionally include response mode
4. Conditionally include closing behavior
5. Conditionally include formatting rules
6. Append voice layer last

### Story 4.5: Update /api/chat endpoint to pass behaviors
**File:** `server.js`
**Task:** Extract personaBehaviors from request body and pass to buildSystemPrompt()

### Build Gate
```bash
npm run build
# Manual test: Start server, send message, verify prompt assembly
```

---

## Epic 5: Verification

### Story 5.1: Test Wayne Turner response
**Task:** Manual verification per TEST_STRATEGY.md Section 4.1
- Send "What is The Grove—and why does it matter?"
- Verify no breadcrumbs, no navigation, ends on question

### Story 5.2: Test default persona response
**Task:** Manual verification per TEST_STRATEGY.md Section 4.2
- Select Concerned Citizen
- Verify breadcrumbs, navigation blocks present

### Story 5.3: Test /explore route
**Task:** Manual verification per TEST_STRATEGY.md Section 4.3
- Navigate to /explore
- Verify chat works with lens changes

### Story 5.4: Run full test suite
```bash
npm run build
npm test
npx playwright test
```

---

## Summary

| Epic | Stories | Estimated Time |
|------|---------|----------------|
| Epic 1: Schema | 2 stories | 15 min |
| Epic 2: Personas | 3 stories | 15 min |
| Epic 3: Frontend | 4 stories | 30 min |
| Epic 4: Server | 5 stories | 1 hour |
| Epic 5: Verification | 4 stories | 30 min |
| **Total** | **18 stories** | **~2.5 hours** |

---

## Definition of Done

- [ ] TypeScript compiles without errors
- [ ] All unit tests pass
- [ ] Wayne Turner responds without navigation blocks
- [ ] Wayne Turner ends on question
- [ ] Default personas (Concerned Citizen) unchanged
- [ ] /explore route works correctly
- [ ] /terminal route works correctly
