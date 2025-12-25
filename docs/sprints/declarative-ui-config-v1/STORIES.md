# STORIES: Declarative UI Config v1

**Sprint:** Declarative UI Config v1
**Total Estimated:** 2 hours

---

## Story 1: Extend LensReality Type

**Estimate:** 15 min

### Task
Add `navigation` and `foundation` optional fields to existing LensReality interface.

### Location
`src/core/schema/narrative.ts`

### Changes

```typescript
export interface LensReality {
  // EXISTING - DO NOT MODIFY
  hero: HeroContent;
  problem: TensionContent;
  terminal?: TerminalWelcome;
  
  // NEW (Sprint: declarative-ui-config-v1)
  navigation?: {
    ctaLabel?: string;
    ctaSubtext?: string;
    skipLabel?: string;
  };
  foundation?: {
    sectionLabels?: {
      explore?: string;
      cultivate?: string;
      grove?: string;
    };
  };
}
```

Also add `placeholder` to TerminalWelcome if not present:

```typescript
export interface TerminalWelcome {
  heading: string;
  thesis: string;
  prompts: string[];
  footer: string;
  placeholder?: string;  // NEW
}
```

### Acceptance
- [ ] Type compiles without errors
- [ ] All fields optional (backward compatible)
- [ ] Existing code unaffected

---

## Story 2: Update SUPERPOSITION_MAP Personas

**Estimate:** 30 min

### Task
Add new fields to existing persona entries in SUPERPOSITION_MAP.

### Location
`src/data/quantum-content.ts`

### Personas to Update

**freestyle:**
```typescript
navigation: {
  ctaLabel: "Begin",
  skipLabel: "Skip to Terminal"
},
foundation: {
  sectionLabels: {
    explore: "Explore",
    cultivate: "Cultivate",
    grove: "Grove Project"
  }
}
```

**concerned-citizen:**
```typescript
navigation: {
  ctaLabel: "Start Exploring",
  ctaSubtext: "Learn what this means for you",
  skipLabel: "Skip to chat"
},
foundation: {
  sectionLabels: {
    explore: "Discover",
    cultivate: "Participate",
    grove: "The Grove"
  }
}
```

**researcher:**
```typescript
navigation: {
  ctaLabel: "Access Research",
  skipLabel: "Skip to Terminal"
},
foundation: {
  sectionLabels: {
    explore: "Research",
    cultivate: "Methodology",
    grove: "Infrastructure"
  }
}
```

**engineer:** (if exists)
```typescript
navigation: {
  ctaLabel: "View Architecture",
  skipLabel: "Jump to Terminal"
},
foundation: {
  sectionLabels: {
    explore: "Architecture",
    cultivate: "Implementation",
    grove: "System"
  }
}
```

### Acceptance
- [ ] At least 3 personas updated
- [ ] No TypeScript errors
- [ ] Existing fields unchanged

---

## Story 3: Wire HeroHook CTA

**Estimate:** 15 min

### Task
Make HeroHook CTA button read label from reality config.

### Location
`src/surface/components/genesis/HeroHook.tsx`

### Current
```tsx
<button>Begin</button>
```

### After
```tsx
// Already has access to reality via props or useQuantumInterface
const ctaLabel = reality?.navigation?.ctaLabel ?? 'Begin';

<button>{ctaLabel}</button>
```

### Acceptance
- [ ] CTA reads from config
- [ ] Falls back to "Begin" if not set
- [ ] Changes when lens changes

---

## Story 4: Wire Terminal Placeholder

**Estimate:** 15 min

### Task
Make terminal input placeholder configurable.

### Location
`components/Terminal/CommandInput/CommandInputField.tsx` (or parent)

### Current
```tsx
placeholder="What would you like to explore?"
```

### After
```tsx
// Get from reality.terminal.placeholder
const placeholder = reality?.terminal?.placeholder ?? "What would you like to explore?";
```

### Acceptance
- [ ] Placeholder reads from config
- [ ] Falls back gracefully
- [ ] researcher: "Enter your research query..."
- [ ] citizen: "Ask me anything..."

---

## Story 5: Wire Foundation Nav Labels (Optional)

**Estimate:** 20 min

### Task
Make Foundation sidebar navigation labels configurable.

### Location
`src/workspace/components/WorkspaceSidebar.tsx` or navigation component

### Current
Hardcoded "Explore", "Cultivate", "Grove Project"

### After
```tsx
const labels = reality?.foundation?.sectionLabels ?? {
  explore: 'Explore',
  cultivate: 'Cultivate',
  grove: 'Grove Project'
};
```

### Acceptance
- [ ] Labels read from config
- [ ] Falls back to current defaults
- [ ] Changes visible when lens changes

---

## Story 6: Verify & Document

**Estimate:** 15 min

### Task
Test all lenses, verify touchpoints respond, update DEV_LOG.

### Test Matrix

| Lens | CTA Label | Placeholder | Nav Labels |
|------|-----------|-------------|------------|
| (none) | Begin | Default | Default |
| freestyle | Begin | Default | Default |
| concerned-citizen | Start Exploring | Ask me anything... | Discover/Participate |
| researcher | Access Research | Research query... | Research/Methodology |

### Acceptance
- [ ] All lenses tested
- [ ] No regressions
- [ ] DEV_LOG updated

---

## Execution Order

```
1. Extend type (Story 1)
   ↓
2. Update SUPERPOSITION_MAP (Story 2)
   ↓
3. Wire touchpoints (Stories 3, 4, 5) — can parallelize
   ↓
4. Verify & document (Story 6)
```

---

## Definition of Done

- [ ] LensReality type extended
- [ ] 3+ personas have new fields
- [ ] CTA label is lens-reactive
- [ ] Terminal placeholder is lens-reactive
- [ ] `npm run build` succeeds
- [ ] Existing functionality preserved
