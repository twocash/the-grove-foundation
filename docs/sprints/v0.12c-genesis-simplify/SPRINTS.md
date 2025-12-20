# Sprint Stories — v0.12c Genesis Simplify

## Epic 1: ProductReveal Simplification (P0)

### Story 1.1: Remove Animation Phases
**File:** `src/surface/components/genesis/ProductReveal.tsx`
**Lines:** 31, 57-87
**Task:** 
- Remove animation phase type (keep only 'hidden' | 'revealed')
- Remove pixelating, sprouting, knocking, settled phases
- Remove pixel progress state
- Remove animation timers
**Commit:** `refactor(genesis): remove ProductReveal animation phases`

### Story 1.2: Simplify Headline to Static
**File:** `src/surface/components/genesis/ProductReveal.tsx`
**Lines:** 115-156
**Task:** Replace complex animated headline with static:
```tsx
<h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
  <span className="text-grove-forest">STEP INTO </span>
  <span className="text-grove-clay">YOUR GROVE</span>
</h2>
```
**Commit:** `style(genesis): static headline with orange YOUR GROVE`

### Story 1.3: Update ProductReveal CTA
**File:** `src/surface/components/genesis/ProductReveal.tsx`
**Lines:** 189-196
**Task:** Change "See it in action" to "Consult the Grove"
**Commit:** `content(genesis): ProductReveal CTA to Consult the Grove`

---

## Epic 2: CTA Standardization (P0)

### Story 2.1: Update AhaDemo CTA
**File:** `src/surface/components/genesis/AhaDemo.tsx`
**Lines:** 78-83
**Task:** Change "Go deeper" to "Consult the Grove"
**Commit:** `content(genesis): AhaDemo CTA to Consult the Grove`

### Story 2.2: Update Foundation Main CTA
**File:** `src/surface/components/genesis/Foundation.tsx`
**Lines:** 101-107
**Task:** Change "Explore" to "Consult the Grove"
**Commit:** `content(genesis): Foundation CTA to Consult the Grove`

### Story 2.3: Reorder Foundation Deep Dive Buttons
**File:** `src/surface/components/genesis/Foundation.tsx`
**Lines:** 78-96
**Task:** Reorder buttons: Vision → Ratchet → Economics
**Commit:** `style(genesis): reorder Foundation buttons for narrative arc`

---

## Epic 3: Terminal Welcome Flow (P1)

### Story 3.1: Create Welcome Message Constant
**File:** `components/Terminal.tsx`
**Lines:** Near top of file (after imports)
**Task:** Add welcome message constant:
```typescript
const FIRST_TIME_WELCOME = `Welcome to your Grove.

This Terminal is where you interact with your AI village — trained on your data, running on your hardware, owned by you.

Think of it as ChatGPT, but private. Your Grove never leaves your machine. That's **intellectual independence**: AI that enriches *you*, not corporate shareholders.

**One thing to try:** Lenses let you explore the same knowledge from different perspectives — skeptic, enthusiast, or your own custom view.`;
```
**Commit:** `content(terminal): add first-time welcome message`

### Story 3.2: Inject Welcome Message on First Open
**File:** `components/Terminal.tsx`
**Lines:** 348-395 (welcome flow)
**Task:** 
- Before showing LensPicker, inject welcome message as assistant message
- Add message to messages state array
- Use new localStorage key 'grove-terminal-welcome-shown'
**Commit:** `feat(terminal): inject welcome message on first open`

### Story 3.3: Update LensPicker CTA Copy
**File:** `components/Terminal/LensPicker.tsx`
**Task:** Update button labels:
- Primary: "Try an existing Lens"
- Secondary: "Create your own"
**Commit:** `content(terminal): update LensPicker button labels`

---

## Epic 4: Code Cleanup (P2)

### Story 4.1: Remove Unused Animation Code
**File:** `src/surface/components/genesis/ProductReveal.tsx`
**Task:** Remove any leftover:
- pixelProgress state
- blur calculations
- unused phase transitions
**Commit:** `chore(genesis): remove unused animation code`

### Story 4.2: Remove Animation Phase Type
**File:** `src/surface/components/genesis/ProductReveal.tsx`
**Lines:** 31
**Task:** Simplify type or remove entirely if not needed
**Commit:** `chore(genesis): simplify ProductReveal types`

---

## Epic 5: Lens Selector Redesign (P1)

### Story 5.1: Redesign Lens Selector as Pill
**File:** `components/Terminal/TerminalControls.tsx`
**Lines:** 32-48
**Task:** Replace colored dot + arrow with pill button:
```tsx
<button
  onClick={onSwitchLens}
  className="flex items-center space-x-1.5 px-3 py-1 border border-ink/20 rounded-full hover:border-grove-forest hover:text-grove-forest transition-colors"
>
  <span className="text-xs">🔎</span>
  <span className="text-[11px] font-sans font-medium text-ink">
    {persona?.publicLabel || 'Choose Lens'}
  </span>
  <span className="text-[9px] text-ink-muted">▾</span>
</button>
```
**Commit:** `style(terminal): redesign lens selector as pill button`

---

## Commit Sequence

```
1. refactor(genesis): remove ProductReveal animation phases (Epic 1)
2. style(genesis): static headline with orange YOUR GROVE (Epic 1)
3. content(genesis): ProductReveal CTA to Consult the Grove (Epic 1)
4. content(genesis): AhaDemo CTA to Consult the Grove (Epic 2)
5. content(genesis): Foundation CTA to Consult the Grove (Epic 2)
6. style(genesis): reorder Foundation buttons for narrative arc (Epic 2)
7. content(terminal): add first-time welcome message (Epic 3)
8. feat(terminal): inject welcome message on first open (Epic 3)
9. content(terminal): update LensPicker button labels (Epic 3)
10. style(terminal): redesign lens selector as pill button (Epic 5)
11. chore(genesis): remove unused animation code (Epic 4)
12. docs: update DEVLOG with v0.12c completion
```

## Build Gates
- After Epic 1: `npm run build` ✓
- After Epic 2: `npm run build` ✓
- After Epic 3: `npm run build` ✓
- After Epic 5: `npm run build` ✓
- After Epic 4: `npm run build` ✓

## Smoke Test Checklist
- [ ] ProductReveal headline shows "STEP INTO YOUR GROVE" with orange "YOUR GROVE"
- [ ] No animation glitches or layout shifts
- [ ] "Consult the Grove" appears on ProductReveal CTA
- [ ] "Consult the Grove" appears on AhaDemo CTA
- [ ] "Consult the Grove" appears on Foundation main CTA
- [ ] Foundation buttons ordered: Vision → Ratchet → Economics
- [ ] First Terminal open shows welcome message in chat
- [ ] Welcome message only shows once (clear localStorage, refresh, open Terminal twice)
- [ ] LensPicker appears after welcome message
- [ ] Lens selector shows as pill: [🔎 Lens Name ▾]
- [ ] Lens pill has hover state (border turns grove-forest)
- [ ] Build passes with no errors
- [ ] No console errors in browser
