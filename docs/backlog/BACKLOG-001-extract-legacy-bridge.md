# Backlog: Extract Legacy Bridge

**ID:** BACKLOG-001  
**Priority:** P3 (Tech Debt)  
**Depends On:** Legacy consumer audit  
**Estimated:** 2 hours

---

## Context

Sprint 3 (`bedrock-event-integration-v1`) shipped with legacy dual-write logic embedded in `useEventBridge.ts`. The Foundation Loop design specified isolating this in `useLegacyBridge.ts` for cleaner deprecation.

Current implementation works correctly. This is a code smell, not a bug.

---

## Current State

```typescript
// useEventBridge.ts (lines 85-100)
async function getLegacyBus() {
  if (!legacyBus) {
    try {
      const module = await import('../../../../hooks/useEngagementBus');
      // ...
    }
  }
}

// Each emit method has inline legacy writes:
querySubmitted: (queryId, content, intent) => {
  if (isNewSystemEnabled && newDispatch) {
    newDispatch({ type: 'QUERY_SUBMITTED', ... });
  }
  getLegacyBus().then(bus => {
    if (bus) bus.emit('EXCHANGE_SENT', { ... });
  });
}
```

---

## Desired State

```typescript
// useLegacyBridge.ts (new file, marked for deprecation)
export function useLegacyBridge(): LegacyBridgeAPI {
  return useMemo(() => ({
    onQuerySubmitted: (content) => emit('EXCHANGE_SENT', { query: content }),
    onLensActivated: (lensId, isCustom) => emit('LENS_SELECTED', { lensId, isCustom }),
    // ... all translations in one place
  }), []);
}

// useEventBridge.ts (cleaner)
const legacy = useLegacyBridge();

querySubmitted: (queryId, content, intent) => {
  if (isNewSystemEnabled && newDispatch) {
    newDispatch({ type: 'QUERY_SUBMITTED', ... });
  }
  legacy.onQuerySubmitted(content);
}
```

---

## Trigger

Execute this task when:
1. Auditing legacy consumers for removal, OR
2. Adding new event types to bridge (prevents translation sprawl)

---

## Acceptance Criteria

- [ ] `useLegacyBridge.ts` created with all legacy translations
- [ ] `useEventBridge.ts` delegates to `useLegacyBridge`
- [ ] File marked with `@deprecated` JSDoc
- [ ] Tests still pass (180 event tests)
- [ ] No functional change to dual-write behavior

---

## Why Not Now

1. Tests pass (180 total)
2. Schema bugs are fixed
3. Feature flag works
4. Rewriting working code adds risk
5. Legacy removal is future sprint anyway

---

*Created: January 4, 2026*  
*Source: Sprint 3 post-execution review*
