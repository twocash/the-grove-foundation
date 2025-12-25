# EXECUTION PROMPT: Declarative UI Config v1

**Sprint:** Declarative UI Config v1
**Estimated Time:** 2 hours
**Prerequisite:** Sprint 4 complete (theme cleanup)

---

## Context

You are extending Grove's existing Quantum Interface pattern to make more UI touchpoints lens-reactive. The persona/lens system already exists—you're adding fields to the schema and wiring more components.

**Key Principle:** Extend what exists. No new hooks, no new config systems.

---

## Pre-Flight Checklist

```bash
cd C:\GitHub\the-grove-foundation
git checkout main
git pull origin main
git checkout -b feat/declarative-ui-config-v1

# Verify clean state
npm run build
npm run dev
# Test: http://localhost:3000 loads, lens selection works
```

---

## Phase 1: Extend LensReality Type (15 min)

### 1.1 Update Type Definition

**File:** `src/core/schema/narrative.ts`

Find the `LensReality` interface and add new optional fields at the end:

```typescript
export interface LensReality {
  // EXISTING - preserve exactly as-is
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

### 1.2 Add placeholder to TerminalWelcome

In the same file, find `TerminalWelcome` and add:

```typescript
export interface TerminalWelcome {
  heading: string;
  thesis: string;
  prompts: string[];
  footer: string;
  placeholder?: string;  // NEW - input field placeholder
}
```

### Verify

```bash
npm run build  # Should compile with no errors
```

---

## Phase 2: Update SUPERPOSITION_MAP (30 min)

**File:** `src/data/quantum-content.ts`

Find `SUPERPOSITION_MAP` and add `navigation` and `foundation` fields to existing personas.

### 2.1 Update 'freestyle' persona

Find the 'freestyle' entry and add after the `terminal` block:

```typescript
'freestyle': {
  hero: { ... },  // existing
  problem: { ... },  // existing
  terminal: { ... },  // existing
  
  // NEW
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
},
```

### 2.2 Update 'concerned-citizen' persona

```typescript
'concerned-citizen': {
  hero: { ... },
  problem: { ... },
  terminal: {
    ...existingFields,
    placeholder: "Ask me anything..."  // ADD this field
  },
  
  // NEW
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
},
```

### 2.3 Update 'researcher' persona

```typescript
'researcher': {
  hero: { ... },
  problem: { ... },
  terminal: {
    ...existingFields,
    placeholder: "Enter your research query..."
  },
  
  // NEW
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
},
```

### 2.4 Update any other personas (engineer, policymaker, etc.)

Apply same pattern—add `navigation` and `foundation` blocks with appropriate labels.

### Verify

```bash
npm run build  # Should compile
```

---

## Phase 3: Wire HeroHook CTA (15 min)

**File:** `src/surface/components/genesis/HeroHook.tsx`

### 3.1 Find CTA Button

Search for the primary CTA button (likely says "Begin" or similar).

### 3.2 Make it read from reality

The component should already have access to `reality` via props or context. Update:

```tsx
// Find where reality is available (props or useQuantumInterface)
const ctaLabel = reality?.navigation?.ctaLabel ?? 'Begin';
const ctaSubtext = reality?.navigation?.ctaSubtext;

// Update JSX
<button onClick={handleCTAClick}>
  {ctaLabel}
</button>
{ctaSubtext && <span className="...">{ctaSubtext}</span>}
```

### Verify

```bash
npm run dev
# Visit localhost:3000
# Select different lenses
# CTA label should change
```

---

## Phase 4: Wire Terminal Placeholder (15 min)

**File:** `components/Terminal/CommandInput/CommandInputField.tsx` or parent component

### 4.1 Find current placeholder

Search for `placeholder=` in Terminal-related files.

### 4.2 Make it configurable

The terminal should have access to `reality` from useQuantumInterface or props:

```tsx
const placeholder = reality?.terminal?.placeholder ?? "What would you like to explore?";

<input 
  placeholder={placeholder}
  ...
/>
```

If `reality` isn't available in this component, you may need to:
1. Pass it down as a prop from a parent
2. Or use the `useQuantumInterface` hook directly

### Verify

```bash
npm run dev
# Select researcher lens
# Placeholder should say "Enter your research query..."
```

---

## Phase 5: Wire Foundation Nav Labels (20 min) — Optional

**File:** Find the sidebar/navigation component for Foundation

Likely locations:
- `src/workspace/components/WorkspaceSidebar.tsx`
- `src/foundation/components/...`

### 5.1 Find hardcoded labels

Search for "Explore", "Cultivate", "Grove Project" strings.

### 5.2 Make them configurable

```tsx
// Import or access reality
const { reality } = useQuantumInterface();

const labels = {
  explore: reality?.foundation?.sectionLabels?.explore ?? 'Explore',
  cultivate: reality?.foundation?.sectionLabels?.cultivate ?? 'Cultivate',
  grove: reality?.foundation?.sectionLabels?.grove ?? 'Grove Project'
};

// Use in JSX
<NavItem label={labels.explore} ... />
```

---

## Phase 6: Test & Commit (15 min)

### 6.1 Test Matrix

| Action | Expected |
|--------|----------|
| Load page (no lens) | Default labels: "Begin", default placeholder |
| Select concerned-citizen | CTA: "Start Exploring", placeholder: "Ask me anything..." |
| Select researcher | CTA: "Access Research", placeholder: "Enter your research query..." |
| Refresh page | Lens persists, labels persist |

### 6.2 Build Check

```bash
npm run build
npm run lint  # Fix any issues
```

### 6.3 Commit

```bash
git add -A
git commit -m "feat: extend lens-reactive UI to more touchpoints

- Add navigation, foundation fields to LensReality type
- Update SUPERPOSITION_MAP personas with new fields
- Wire HeroHook CTA label to lens config
- Wire Terminal placeholder to lens config
- All changes backward compatible (optional fields)

Sprint: declarative-ui-config-v1"
```

### 6.4 Push & PR

```bash
git push -u origin feat/declarative-ui-config-v1
```

---

## Rollback Plan

All new fields are optional. If something breaks:

```bash
# Revert type changes
git checkout main -- src/core/schema/narrative.ts

# Or just remove the optional chaining usage in components
# They'll fall back to defaults
```

---

## Post-Sprint

1. Update `docs/sprints/declarative-ui-config-v1/DEV_LOG.md`
2. Update `docs/sprints/ROADMAP.md` — mark Sprint 5 complete
3. Visual verification after PR merge
