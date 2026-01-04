# Execution Prompt — hybrid-search-toggle-v1

## Context

The RAG hybrid search system is fully implemented on the backend but has no UI exposure. This sprint adds a simple toggle to the /explore header so users can switch between basic vector search and hybrid search (vector + keyword + utility + temporal scoring).

## Documentation

Sprint documentation in `docs/sprints/hybrid-search-toggle-v1/`:
- `REPO_AUDIT.md` — Current state analysis
- `SPEC.md` — Goals and acceptance criteria
- `ARCHITECTURE.md` — Data flow diagram
- `MIGRATION_MAP.md` — File-by-file changes (PRIMARY REFERENCE)
- `DECISIONS.md` — ADRs for design choices
- `SPRINTS.md` — Story breakdown

## Repository Intelligence

Key locations:
- `services/chatService.ts` — ChatOptions interface (lines 22-28), requestBody (lines 87-97)
- `src/surface/components/KineticStream/hooks/useKineticStream.ts` — Stream hook (line 38, ~90)
- `src/surface/components/KineticStream/KineticHeader.tsx` — Header component (full file)
- `src/surface/components/KineticStream/ExploreShell.tsx` — Container (lines ~48, ~50, ~340)

## DEX Compliance Rules

- NO new `handle*` callbacks for domain logic (toggle handler is UI chrome, acceptable)
- Test behavior, not implementation
- Use existing token system for styling

---

## Execution Order

### Phase 1: Service Layer (chatService.ts)

**Step 1.1: Add useHybridSearch to ChatOptions**

```typescript
// services/chatService.ts, lines 22-28
// ADD after journeyId line:
  useHybridSearch?: boolean;  // Sprint: hybrid-search-toggle-v1
```

**Step 1.2: Add to requestBody**

```typescript
// services/chatService.ts, lines 87-97
// ADD after journeyId line in requestBody object:
    useHybridSearch: options.useHybridSearch ?? false  // Sprint: hybrid-search-toggle-v1
```

**Verify:**
```bash
npm run build
```

---

### Phase 2: Stream Hook (useKineticStream.ts)

**Step 2.1: Add options interface**

```typescript
// src/surface/components/KineticStream/hooks/useKineticStream.ts
// ADD before UseKineticStreamReturn interface:

export interface UseKineticStreamOptions {
  useHybridSearch?: boolean;
}
```

**Step 2.2: Accept options parameter**

```typescript
// Change function signature from:
export function useKineticStream(): UseKineticStreamReturn {

// To:
export function useKineticStream(options: UseKineticStreamOptions = {}): UseKineticStreamReturn {
```

**Step 2.3: Pass to sendMessageStream**

Find the sendMessageStream call (~line 90) and add useHybridSearch:

```typescript
const chatResponse = await sendMessageStream(
  query,
  (chunk: string) => {
    fullContent += chunk;
    setCurrentItem(prev => prev ? {
      ...prev,
      content: fullContent
    } as ResponseStreamItem : null);
  },
  {
    personaTone: effectiveLensId || undefined,
    useHybridSearch: options.useHybridSearch  // Sprint: hybrid-search-toggle-v1
  }
);
```

**Verify:**
```bash
npm run build
```

---

### Phase 3: Header UI (KineticHeader.tsx)

**Step 3.1: Extend props interface**

```typescript
// src/surface/components/KineticStream/KineticHeader.tsx, lines 22-30
// ADD before closing brace of KineticHeaderProps:
  // Sprint: hybrid-search-toggle-v1
  useHybridSearch?: boolean;
  onHybridSearchToggle?: () => void;
```

**Step 3.2: Destructure new props**

```typescript
// In component function, add to destructuring:
export const KineticHeader: React.FC<KineticHeaderProps> = ({
  lensName,
  lensColor,
  onLensClick,
  journeyName,
  onJourneyClick,
  stage,
  exchangeCount,
  currentStreak,
  showStreak = true,
  onStreakClick,
  useHybridSearch,           // ADD
  onHybridSearchToggle,      // ADD
}) => {
```

**Step 3.3: Add toggle UI**

Insert BEFORE the `{/* Center: Context Pills */}` comment:

```tsx
      {/* Hybrid Search Toggle (Sprint: hybrid-search-toggle-v1) */}
      {onHybridSearchToggle && (
        <button
          onClick={onHybridSearchToggle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium
            border transition-all duration-200
            ${useHybridSearch 
              ? 'bg-[var(--neon-cyan)]/20 border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]' 
              : 'bg-[var(--glass-elevated)] border-[var(--glass-border)] text-[var(--glass-text-muted)]'
            }
            hover:border-[var(--neon-cyan)]/70`}
          title={useHybridSearch ? 'Hybrid search enabled (vector + keyword + temporal)' : 'Basic vector search'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${useHybridSearch ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-text-subtle)]'}`} />
          <span>RAG</span>
          <span className="text-[9px] opacity-70">{useHybridSearch ? 'ON' : 'OFF'}</span>
        </button>
      )}
```

**Verify:**
```bash
npm run build
```

---

### Phase 4: Container State (ExploreShell.tsx)

**Step 4.1: Add state hook**

After the existing overlay state (~line 120), add:

```typescript
  // Hybrid search toggle (Sprint: hybrid-search-toggle-v1)
  const [useHybridSearch, setUseHybridSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('grove-hybrid-search') === 'true';
    }
    return false;
  });

  const handleHybridSearchToggle = useCallback(() => {
    setUseHybridSearch(prev => {
      const next = !prev;
      localStorage.setItem('grove-hybrid-search', String(next));
      console.log('[ExploreShell] Hybrid search:', next ? 'ON' : 'OFF');
      return next;
    });
  }, []);
```

**Step 4.2: Pass to useKineticStream**

Change:
```typescript
} = useKineticStream();
```

To:
```typescript
} = useKineticStream({ useHybridSearch });
```

**Step 4.3: Pass to KineticHeader**

Find the `<KineticHeader` JSX and add props:

```tsx
<KineticHeader
  lensName={lensData?.publicLabel || 'Choose Lens'}
  lensColor={lensData?.color}
  onLensClick={() => setOverlay({ type: 'lens-picker' })}
  journeyName={journey?.title || (isJourneyActive ? 'Guided' : 'Self-Guided')}
  onJourneyClick={() => setOverlay({ type: 'journey-picker' })}
  stage={stage}
  exchangeCount={exchangeCount}
  useHybridSearch={useHybridSearch}
  onHybridSearchToggle={handleHybridSearchToggle}
/>
```

**Verify:**
```bash
npm run build
npm run dev
# Visit localhost:8080/explore
# Verify toggle visible, click it, check console for log
```

---

### Phase 5: E2E Tests

**Create test file:**

```typescript
// tests/e2e/explore-hybrid-toggle.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Hybrid Search Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure consistent initial state
    await page.goto('/explore');
    await page.evaluate(() => localStorage.removeItem('grove-hybrid-search'));
    await page.reload();
  });

  test('toggle is visible in header', async ({ page }) => {
    await page.goto('/explore');
    const toggle = page.getByRole('button', { name: /RAG/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('OFF');
  });

  test('toggle changes state on click', async ({ page }) => {
    await page.goto('/explore');
    const toggle = page.getByRole('button', { name: /RAG/i });
    
    // Initially OFF
    await expect(toggle).toContainText('OFF');
    
    // Click to turn ON
    await toggle.click();
    await expect(toggle).toContainText('ON');
    
    // Click to turn OFF
    await toggle.click();
    await expect(toggle).toContainText('OFF');
  });

  test('toggle state persists after refresh', async ({ page }) => {
    await page.goto('/explore');
    const toggle = page.getByRole('button', { name: /RAG/i });
    
    // Turn ON
    await toggle.click();
    await expect(toggle).toContainText('ON');
    
    // Refresh
    await page.reload();
    
    // Should still be ON
    const toggleAfter = page.getByRole('button', { name: /RAG/i });
    await expect(toggleAfter).toContainText('ON');
  });
});
```

**Verify:**
```bash
npx playwright test tests/e2e/explore-hybrid-toggle.spec.ts
```

---

## Success Criteria

- [ ] Toggle visible in /explore header, right of stage badge
- [ ] Toggle shows "RAG OFF" by default (first visit)
- [ ] Click toggle → shows "RAG ON", console logs "Hybrid search: ON"
- [ ] Refresh page → toggle remembers ON state
- [ ] Submit query with toggle ON → network request includes `useHybridSearch: true`
- [ ] All E2E tests pass

## Forbidden Actions

- Do NOT use XState for this simple toggle
- Do NOT create a new React Context
- Do NOT add configuration files
- Do NOT test CSS classes (test visibility and text content)

## Troubleshooting

### If toggle doesn't appear
1. Check props are passed from ExploreShell to KineticHeader
2. Check `onHybridSearchToggle` exists (conditional render)

### If state doesn't persist
1. Check localStorage key matches: `grove-hybrid-search`
2. Check useState initializer reads from localStorage

### If flag doesn't reach backend
1. Add console.log in chatService.sendMessageStream to verify requestBody
2. Check useKineticStream passes option to sendMessageStream
