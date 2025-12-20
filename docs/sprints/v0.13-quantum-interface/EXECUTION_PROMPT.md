# Execution Prompt — v0.13 Quantum Interface

## Context
This sprint activates the **Reality Tuner** — connecting the static Genesis landing page to the Narrative Engine. When a user selects a lens, the landing page content morphs to match their perspective.

**Metaphor:** The page exists in "superposition" (all possible contents) until a lens is selected (observation), which "collapses" it into a specific reality.

**Deliverables:**
1. Data layer: `quantum-content.ts` with lens → content mapping
2. State layer: `useQuantumInterface` hook
3. Visual layer: `WaveformCollapse` animation component
4. Integration: GenesisPage wired to pass content props

## Documentation
All sprint documentation is in `docs/sprints/v0.13-quantum-interface/`:
- `REPO_AUDIT.md` — Current state of affected files
- `SPEC.md` — Goals, acceptance criteria, scope
- `DECISIONS.md` — 8 ADRs for architecture choices
- `SPRINTS.md` — Story breakdown with code snippets
- `TARGET_CONTENT.md` — Complete code for new files

## Repository Intelligence

| Concern | File | Notes |
|---------|------|-------|
| Lens state | `hooks/useNarrativeEngine.ts` | `session.activeLens` |
| Genesis page | `src/surface/pages/GenesisPage.tsx` | Integration target |
| HeroHook | `src/surface/components/genesis/HeroHook.tsx` | Accepts content prop |
| ProblemStatement | `src/surface/components/genesis/ProblemStatement.tsx` | Accepts quotes prop |
| Archetype types | `types/lens.ts` → `src/core/schema/lens.ts` | ArchetypeId union |
| Content interfaces | `src/surface/components/genesis/index.ts` | HeroContent, Quote exports |

---

## Phase 1: Data Layer

### Step 1.1: Create Data Directory (if needed)
```bash
# Check if src/data exists
ls src/data 2>/dev/null || mkdir src/data
```

### Step 1.2: Create Quantum Content File
1. Create file: `src/data/quantum-content.ts`
2. Copy full content from `TARGET_CONTENT.md` → "NEW FILE: quantum-content.ts"
3. Key exports:
   - `LensReality` interface
   - `DEFAULT_REALITY` constant
   - `SUPERPOSITION_MAP` partial record
   - `getReality(lensId)` function

### Step 1.3: Verify Types
```bash
npm run build
```
Should compile without errors.

---

## Phase 2: State Layer (Hook)

### Step 2.1: Create Hook File
1. Create file: `src/surface/hooks/useQuantumInterface.ts`
2. Copy content from `TARGET_CONTENT.md` → "NEW FILE: useQuantumInterface.ts"

### Step 2.2: Verify Hook Compiles
```bash
npm run build
```

**Build Gate:** ✅ Must pass before continuing

---

## Phase 3: Visual Layer (Animation)

### Step 3.1: Create Effects Directory
```bash
mkdir -p src/surface/components/effects
```

### Step 3.2: Create Barrel Export
1. Create file: `src/surface/components/effects/index.ts`
2. Content:
```typescript
export { WaveformCollapse } from './WaveformCollapse';
```

### Step 3.3: Create WaveformCollapse Component
1. Create file: `src/surface/components/effects/WaveformCollapse.tsx`
2. Copy content from `TARGET_CONTENT.md` → "NEW FILE: WaveformCollapse.tsx"

### Step 3.4: Verify Animation Compiles
```bash
npm run build
```

**Build Gate:** ✅ Must pass before continuing

---

## Phase 4: Component Updates

### Step 4.1: Update HeroHook
**File:** `src/surface/components/genesis/HeroHook.tsx`

**4.1.1: Update Interface (around line 23)**
Find:
```typescript
interface HeroHookProps {
  onScrollNext?: () => void;
  content?: HeroContent;
}
```

Replace with:
```typescript
interface HeroHookProps {
  onScrollNext?: () => void;
  content?: HeroContent;
  trigger?: any;  // Triggers animation restart on lens change
}
```

**4.1.2: Update Component Signature (around line 28)**
Find:
```typescript
export const HeroHook: React.FC<HeroHookProps> = ({
  onScrollNext,
  content = DEFAULT_CONTENT
}) => {
```

Replace with:
```typescript
export const HeroHook: React.FC<HeroHookProps> = ({
  onScrollNext,
  content = DEFAULT_CONTENT,
  trigger
}) => {
```

**4.1.3: Update useEffect Dependencies (around line 35)**
Find the useEffect that animates subtext. Update its dependency array:
```typescript
}, [content.subtext, trigger]);  // Add trigger
```

Also add reset at start of effect:
```typescript
useEffect(() => {
  setVisibleSubtext([]);  // Reset on trigger change
  
  const timers: NodeJS.Timeout[] = [];
  // ... rest of effect
}, [content.subtext, trigger]);
```

---

### Step 4.2: Update ProblemStatement
**File:** `src/surface/components/genesis/ProblemStatement.tsx`

**4.2.1: Add Default Tension (after DEFAULT_QUOTES, around line 33)**
```typescript
// Default tension text
const DEFAULT_TENSION = [
  "They're building the future of intelligence.",
  "And they're telling you to get comfortable being a guest in it."
];
```

**4.2.2: Update Interface (around line 36)**
Find:
```typescript
interface ProblemStatementProps {
  className?: string;
  quotes?: Quote[];
}
```

Replace with:
```typescript
interface ProblemStatementProps {
  className?: string;
  quotes?: Quote[];
  tension?: string[];
  trigger?: any;
}
```

**4.2.3: Update Component Signature (around line 42)**
Find:
```typescript
export const ProblemStatement: React.FC<ProblemStatementProps> = ({
  className = '',
  quotes = DEFAULT_QUOTES
}) => {
```

Replace with:
```typescript
export const ProblemStatement: React.FC<ProblemStatementProps> = ({
  className = '',
  quotes = DEFAULT_QUOTES,
  tension = DEFAULT_TENSION,
  trigger
}) => {
```

**4.2.4: Update useEffect to Reset on Trigger (around line 50)**
At start of the observer useEffect:
```typescript
useEffect(() => {
  // Reset animations on content/trigger change
  setVisibleCards(new Set());
  setShowTension(false);
  
  // ... rest of observer setup
}, [quotes, trigger]);  // Add trigger to dependencies
```

**4.2.5: Update Tension Rendering (around line 122)**
Find the hardcoded tension paragraphs and replace with dynamic:
```typescript
<div ref={tensionRef} className={`...`}>
  {tension.map((line, index) => (
    <p 
      key={index}
      className="font-serif text-xl md:text-2xl text-ink leading-relaxed mb-4"
    >
      {line}
    </p>
  ))}
  
  {/* Hook question stays static */}
  <p className="font-serif text-2xl md:text-3xl text-grove-clay font-semibold">
    What if there was another way?
  </p>
  {/* ... scroll indicator */}
</div>
```

### Step 4.3: Verify Component Updates
```bash
npm run build
```

**Build Gate:** ✅ Must pass before continuing

---

## Phase 5: Integration

### Step 5.1: Wire GenesisPage
**File:** `src/surface/pages/GenesisPage.tsx`

**5.1.1: Add Import (after other imports, around line 12)**
```typescript
import { useQuantumInterface } from '../hooks/useQuantumInterface';
```

**5.1.2: Add Hook Call (inside component, around line 34)**
```typescript
const GenesisPage: React.FC = () => {
  // Quantum Interface - lens-reactive content
  const { reality, quantumTrigger } = useQuantumInterface();
  
  const [activeSection] = useState<SectionId>(SectionId.STAKES);
  // ... rest
```

**5.1.3: Update HeroHook Props (around line 120)**
Find:
```typescript
<HeroHook />
```

Replace with:
```typescript
<HeroHook 
  content={reality.hero}
  trigger={quantumTrigger}
/>
```

**5.1.4: Update ProblemStatement Props (around line 126)**
Find:
```typescript
<ProblemStatement />
```

Replace with:
```typescript
<ProblemStatement 
  quotes={reality.problem.quotes}
  tension={reality.problem.tension}
  trigger={quantumTrigger}
/>
```

### Step 5.2: Verify Integration
```bash
npm run build
```

**Build Gate:** ✅ Must pass before continuing

---

## Phase 6: Verification

### Step 6.1: Start Dev Server
```bash
npm run dev
```

### Step 6.2: Manual Tests

| Test | Expected | Pass? |
|------|----------|-------|
| Visit `/` | Shows "YOUR AI." | ⬜ |
| Open Terminal, select "Engineer" | Headline changes to "LATENCY IS THE MIND KILLER." | ⬜ |
| Text animates (un-type/re-type) | Visible backspace then typing | ⬜ |
| Select "Academic" | Headline changes to "THE EPISTEMIC COMMONS." | ⬜ |
| Deselect lens (Freestyle) | Returns to "YOUR AI." | ⬜ |
| Refresh with lens persisted | Correct reality loads immediately | ⬜ |
| Visit `?experience=classic` | Classic page, unchanged | ⬜ |
| Check console | No errors | ⬜ |

### Step 6.3: Final Build
```bash
npm run build
```

**Sprint Complete:** ✅ All tests pass, build succeeds

---

## Troubleshooting

### "Cannot find module '../hooks/useQuantumInterface'"
- Check file is at `src/surface/hooks/useQuantumInterface.ts`
- Check export is `export const useQuantumInterface`

### "Type 'string | null' is not assignable to type 'ArchetypeId'"
- Use type assertion in getReality: `lensId as ArchetypeId`
- Or check `SUPERPOSITION_MAP[lensId as ArchetypeId]`

### Animation Not Triggering
- Verify `trigger` prop is passed to components
- Check `trigger` is in useEffect dependency array
- Confirm `quantumTrigger` value actually changes (log it)

### Content Not Changing
- Verify `reality` object has correct structure
- Check `getReality()` returns correct content for lens ID
- Log `session.activeLens` to verify lens is selected

---

## Commit Messages

```
1. feat(quantum): create quantum-content.ts with superposition map
2. feat(quantum): create useQuantumInterface hook  
3. feat(effects): create WaveformCollapse animation component
4. refactor(genesis): add trigger prop to HeroHook
5. refactor(genesis): add trigger and tension props to ProblemStatement
6. feat(genesis): wire GenesisPage to quantum interface
7. docs: add v0.13 sprint documentation
```
