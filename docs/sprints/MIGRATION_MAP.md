# MIGRATION_MAP.md — Grove Main Page Voice Revision
**Generated:** 2025-12-19

---

## 1. CHANGE SUMMARY

| File | Change Type | Risk | LOC Delta |
|------|-------------|------|-----------|
| `App.tsx` | Content edit | Low | ~100 lines modified |
| `components/WhatIsGroveCarousel.tsx` | Content edit | Low | ~80 lines modified |
| `constants.ts` | Content edit | Low | ~60 lines modified |
| `utils/funnelAnalytics.ts` | Addition | Low | +15 lines |

**Total estimated changes:** ~260 lines

---

## 2. FILE-BY-FILE MIGRATION

### 2.1 `constants.ts`

**Location:** `C:\Github\the-grove-foundation\constants.ts`

| Section | Lines | Action |
|---------|-------|--------|
| `SECTION_HOOKS[SectionId.STAKES]` | 28-40 | Replace hook text/prompts |
| `SECTION_HOOKS[SectionId.RATCHET]` | 41-53 | Replace hook text/prompts |
| `SECTION_HOOKS[SectionId.WHAT_IS_GROVE]` | 54-66 | Replace hook text/prompts |
| `SECTION_HOOKS[SectionId.ARCHITECTURE]` | 67-79 | Replace hook text/prompts |
| `SECTION_HOOKS[SectionId.ECONOMICS]` | 80-92 | Replace hook text/prompts |
| `SECTION_HOOKS[SectionId.DIFFERENTIATION]` | 93-105 | Replace hook text/prompts |
| `SECTION_HOOKS[SectionId.NETWORK]` | 106-118 | Replace hook text/prompts |
| `SECTION_HOOKS[SectionId.GET_INVOLVED]` | 119-125 | Replace + add 1 hook |
| `INITIAL_TERMINAL_MESSAGE` | 127-137 | Replace entire string |

---

### 2.2 `App.tsx`

**Location:** `C:\Github\the-grove-foundation\App.tsx`

| Section | Lines | Action |
|---------|-------|--------|
| Import statement | ~15 | Add `trackPromptHookClicked` import |
| `handlePromptHook` | 87-90 | Add telemetry call, add sectionId param |
| Hero section content | 246-282 | Replace headline, lead, body text |
| Ratchet section content | 293-311 | Replace headline, lead, body text |
| Architecture section content | 336-350 | Replace headline, body text |
| Economics section content | 367-380 | Replace headline, body text |
| Network section content | 460-475 | Replace body text |
| Get Involved section content | 525-545 | Replace headline, lead, body text |
| PromptHooks calls | Multiple | Add sectionId to callback |

**Specific Code Change — `handlePromptHook`:**

**Before (`App.tsx:87-90`):**
```typescript
const handlePromptHook = (data: { nodeId?: string; display: string; query: string }) => {
  setTerminalState(prev => ({ ...prev, isOpen: true }));
  setExternalQuery(data);
};
```

**After:**
```typescript
const handlePromptHook = (data: { nodeId?: string; display: string; query: string }, sectionId?: SectionId) => {
  trackPromptHookClicked({
    sectionId: sectionId || 'unknown',
    hookText: data.display,
    nodeId: data.nodeId
  });
  setTerminalState(prev => ({ ...prev, isOpen: true }));
  setExternalQuery(data);
};
```

**PromptHooks Calls — Before:**
```tsx
<PromptHooks sectionId={SectionId.STAKES} onHookClick={handlePromptHook} />
```

**After:**
```tsx
<PromptHooks sectionId={SectionId.STAKES} onHookClick={(data) => handlePromptHook(data, SectionId.STAKES)} />
```

---

### 2.3 `components/WhatIsGroveCarousel.tsx`

**Location:** `C:\Github\the-grove-foundation\components\WhatIsGroveCarousel.tsx`

| Slide | Lines | Action |
|-------|-------|--------|
| Slide 1 (simple-answer) | 12-37 | Replace headline, body, micro-CTA |
| Slide 2 (message-top) | 38-65 | Replace headline |
| Slide 3 (horses) | 66-86 | Replace headline, body |
| Slide 4 (question) | 87-123 | Replace headline, body, kicker |
| Slide 5 (structure) | 124-163 | Replace headline, pillar descriptions |
| Slide 6 (vision) | 164-196 | Replace headline, body |

---

### 2.4 `utils/funnelAnalytics.ts`

**Location:** `C:\Github\the-grove-foundation\utils\funnelAnalytics.ts`

Add after line 162:

```typescript
// Prompt hook clicks from landing page
export const trackPromptHookClicked = (data: {
  sectionId: string;
  hookText: string;
  nodeId?: string;
}): void => {
  trackFunnelEvent('prompt_hook_clicked', {
    sectionId: data.sectionId,
    hookText: data.hookText,
    nodeId: data.nodeId || null,
    source: 'landing_page'
  });
};
```

Add `trackPromptHookClicked` to default export object.

---

## 3. ROLLBACK PLAN

If issues arise:
1. Revert `constants.ts` to previous content
2. Revert `App.tsx` section content and `handlePromptHook` signature
3. Revert `WhatIsGroveCarousel.tsx` slide content
4. Remove `trackPromptHookClicked` from `funnelAnalytics.ts`

**All changes are content-level and independently revertible.**

---

## 4. VERIFICATION CHECKLIST

- [ ] `npm run build` succeeds
- [ ] Page loads without console errors
- [ ] All 8 sections render with new content
- [ ] Carousel navigates through 6 slides
- [ ] Hook clicks fire `prompt_hook_clicked` events
- [ ] Terminal opens with new initial message

---

## MIGRATION MAP STATUS: COMPLETE ✓
