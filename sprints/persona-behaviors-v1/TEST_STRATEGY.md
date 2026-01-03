# Test Strategy: persona-behaviors-v1

**Sprint:** persona-behaviors-v1
**Date:** 2025-01-02

---

## 1. Test Philosophy

This sprint modifies prompt assembly logic. Testing focuses on:

1. **Schema validation** - TypeScript catches type mismatches
2. **Behavior verification** - Manual testing of LLM responses
3. **Regression prevention** - Existing personas still work

---

## 2. Unit Tests

### 2.1 Schema Tests

**File:** `tests/unit/persona-behaviors.test.ts` (NEW)

```typescript
import { PersonaBehaviors, ResponseMode, ClosingBehavior } from '@/data/narratives-schema';

describe('PersonaBehaviors schema', () => {
  it('accepts valid response modes', () => {
    const modes: ResponseMode[] = ['architect', 'librarian', 'contemplative'];
    modes.forEach(mode => {
      const behaviors: PersonaBehaviors = { responseMode: mode };
      expect(behaviors.responseMode).toBe(mode);
    });
  });

  it('accepts valid closing behaviors', () => {
    const closings: ClosingBehavior[] = ['navigation', 'question', 'open'];
    closings.forEach(closing => {
      const behaviors: PersonaBehaviors = { closingBehavior: closing };
      expect(behaviors.closingBehavior).toBe(closing);
    });
  });

  it('allows all fields to be optional', () => {
    const behaviors: PersonaBehaviors = {};
    expect(behaviors).toEqual({});
  });
});
```

### 2.2 Persona Configuration Tests

**File:** `tests/unit/default-personas.test.ts` (EXTEND)

```typescript
import { DEFAULT_PERSONAS } from '@/data/default-personas';

describe('Wayne Turner persona', () => {
  const wayne = DEFAULT_PERSONAS['wayne-turner'];

  it('has behaviors defined', () => {
    expect(wayne.behaviors).toBeDefined();
  });

  it('uses contemplative response mode', () => {
    expect(wayne.behaviors?.responseMode).toBe('contemplative');
  });

  it('uses question closing behavior', () => {
    expect(wayne.behaviors?.closingBehavior).toBe('question');
  });

  it('disables structural elements', () => {
    expect(wayne.behaviors?.useBreadcrumbTags).toBe(false);
    expect(wayne.behaviors?.useTopicTags).toBe(false);
    expect(wayne.behaviors?.useNavigationBlocks).toBe(false);
  });
});

describe('Default personas backward compatibility', () => {
  it('concerned-citizen has no behaviors (uses defaults)', () => {
    const citizen = DEFAULT_PERSONAS['concerned-citizen'];
    expect(citizen.behaviors).toBeUndefined();
  });
});
```

---

## 3. Integration Tests

### 3.1 ChatService Tests

**File:** `tests/integration/chatService.test.ts` (EXTEND)

```typescript
describe('sendMessageStream with behaviors', () => {
  it('includes personaBehaviors in request body', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      body: { getReader: () => mockReader }
    });
    global.fetch = mockFetch;

    await sendMessageStream('test', () => {}, {
      personaTone: 'test tone',
      personaBehaviors: {
        responseMode: 'contemplative',
        closingBehavior: 'question'
      }
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        body: expect.stringContaining('personaBehaviors')
      })
    );
  });

  it('handles undefined personaBehaviors gracefully', async () => {
    // Should not throw when behaviors undefined
    await sendMessageStream('test', () => {}, {
      personaTone: 'test tone'
      // personaBehaviors intentionally omitted
    });
  });
});
```

---

## 4. Manual Verification Tests

### 4.1 Wayne Turner Verification

**Test case:** Wayne Turner responds correctly

**Steps:**
1. Navigate to /terminal or /explore
2. Select Wayne Turner lens (if available) or apply via config
3. Send: "What is The Grove—and why does it matter?"

**Expected:**
- [ ] Response does NOT contain `[[BREADCRUMB:...]]`
- [ ] Response does NOT contain `[[TOPIC:...]]`
- [ ] Response does NOT contain navigation blocks (`[[deep_dive:...]]`)
- [ ] Response ENDS on a question, not a conclusion
- [ ] Response feels contemplative, not brief/punchy

**Not expected:**
- Generic scenario opening ("small business owner, kid's school project")
- Immediate solution pitch ("That's where The Grove comes in")
- Analogies and examples in first response

### 4.2 Default Persona Verification

**Test case:** Concerned Citizen still works as before

**Steps:**
1. Navigate to /terminal or /explore
2. Select Concerned Citizen lens
3. Send: "What is The Grove?"

**Expected:**
- [ ] Response contains `[[BREADCRUMB:...]]`
- [ ] Response contains `[[TOPIC:...]]`
- [ ] Response ends with navigation blocks
- [ ] Behavior identical to before this sprint

### 4.3 /explore Route Verification

**Test case:** Changes propagate to /explore

**Steps:**
1. Navigate to /explore
2. Verify chat works with any lens
3. Switch to Wayne Turner
4. Verify contemplative behavior

**Expected:**
- [ ] All existing functionality preserved
- [ ] Wayne behaviors apply correctly

---

## 5. Build Gate

```bash
# Must pass before merge
npm run build          # TypeScript compiles
npm test               # Unit tests pass
npx playwright test    # E2E tests pass (if applicable)
```

---

## 6. Regression Checklist

- [ ] Concerned Citizen responds with navigation blocks
- [ ] Academic lens responds with evidence-first structure
- [ ] Engineer lens responds with technical depth
- [ ] Freestyle lens adapts to questions
- [ ] /terminal route works
- [ ] /explore route works
- [ ] Chat persistence works across navigation
- [ ] Session reset on lens change still works
