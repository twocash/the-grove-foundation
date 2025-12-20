# Repository Audit — Terminal UX Sprint v0.12

## Stack
- Framework: React 18 + TypeScript 5.x
- Build: Vite 6.x
- Styling: Tailwind CSS v4 (CSS-based config)
- Package Manager: npm

## Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
```

---

## Terminal Component Architecture

### Primary File
| File | Lines | Purpose |
|------|-------|---------|
| `components/Terminal.tsx` | 1267 | Main Terminal component — monolithic, handles all state and rendering |

### Subcomponents (`components/Terminal/`)
| File | Lines | Purpose |
|------|-------|---------|
| `index.ts` | 10 | Barrel exports for Terminal subcomponents |
| `LensPicker.tsx` | 307 | Persona selection UI — full overlay with cards |
| `LensBadge.tsx` | ~50 | Small badge showing current lens |
| `JourneyNav.tsx` | 180 | Top navigation bar — lens, progress dots, streak |
| `JourneyCard.tsx` | ~100 | Inline journey continuation card |
| `JourneyCompletion.tsx` | ~150 | Modal for journey completion with rating |
| `LoadingIndicator.tsx` | ~50 | ASCII loading messages during AI response |
| `CognitiveBridge.tsx` | ~200 | Inline journey offer based on topic detection |

### Subfolders
| Folder | Contents |
|--------|----------|
| `Terminal/Reveals/` | SimulationReveal, CustomLensOffer, FounderStory, TerminatorMode |
| `Terminal/ConversionCTA/` | BriefingRequest, EmailSignup, NominationForm, ShareFlow, CTAModal |
| `Terminal/CustomLensWizard/` | Multi-step custom lens creation wizard |

---

## State Management Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useNarrativeEngine` | `hooks/useNarrativeEngine.ts:604` | Core state: lens, journey, session persistence |
| `useNarrative` | `hooks/useNarrative.ts` | Legacy schema loading (V2.0 compat) |
| `useCustomLens` | `hooks/useCustomLens.ts` | Custom lens CRUD operations |
| `useEngagementBridge` | `hooks/useEngagementBridge.ts` | Cognitive bridge injection logic |
| `useRevealState` | `hooks/useRevealState.ts` | Reveal triggers (simulation, terminator, founder) |
| `useStreakTracking` | `hooks/useStreakTracking.ts` | Streak display logic |
| `useFeatureFlags` | `hooks/useFeatureFlags.ts` | Feature flag access from schema |
| `useEngagementBus` | `hooks/useEngagementBus.ts` | Event emission to Engagement Bus |

---

## Type Definitions

### Core Types (`src/core/schema/base.ts`)
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isStreaming?: boolean;
}

interface TerminalState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
}
```

### Terminal Session (`data/narratives-schema.ts:308-330`)
```typescript
interface TerminalSession {
  activeLens: string | null;
  scholarMode: boolean;
  activeJourneyId: string | null;
  currentNodeId: string | null;
  visitedNodes: string[];
  // ... legacy fields
}
```

### Lens Types (`types/lens.ts`)
- `CustomLens` — User-created lens with archetypeId
- `LensCandidate` — During creation flow
- `UserInputs` — Custom lens form state

---

## Design Tokens (Tailwind + CSS)

### Surface Palette (`tailwind.config.ts`, `styles/globals.css`)
```css
--color-paper: #FBFBF9;
--color-paper-dark: #F2F0E9;
--color-ink: #1C1C1C;
--color-ink-muted: #575757;
--color-grove-forest: #2F5C3B;
--color-grove-clay: #D95D39;
```

### Terminal-Specific
```css
--color-terminal-bg: #FFFFFF;
--color-terminal-phosphor: #1C1C1C;
--color-terminal-border: #E5E5E0;
--color-terminal-highlight: #D95D39;
```

### Fonts
```css
--font-serif: 'Lora', serif;           /* Body text */
--font-display: 'Playfair Display';    /* Headlines */
--font-sans: 'Inter', sans-serif;      /* UI elements */
--font-mono: 'JetBrains Mono';         /* Code, meta */
```

---

## Current Terminal Structure (Line References)

### FAB Button (`Terminal.tsx:848-861`)
```tsx
<button
  onClick={toggleTerminal}
  className={`fixed bottom-8 right-8 z-50 p-4 rounded-full ...`}
>
  {terminalState.isOpen ? <CloseIcon /> : `>_`}
</button>
```

### Drawer Container (`Terminal.tsx:864-872`)
```tsx
<div className={`fixed inset-y-0 right-0 z-[60] w-full md:w-[480px] ...`}>
```
- Slides from right
- 480px on desktop, full width on mobile
- No minimize capability currently

### Header (`Terminal.tsx:889-901`)
```tsx
<div className="px-4 py-2 border-b border-ink/5 ...">
  <div className="font-display font-bold text-base text-ink">The Terminal 🌱</div>
  {/* Scholar Mode badge */}
  <div className="text-[9px] ... text-ink-muted">CTX: {SECTION_CONFIG[...]}</div>
</div>
```
- Title: "The Terminal 🌱"
- Right: Context indicator (CTX: STAKES, etc.)
- Scholar Mode badge when active

### JourneyNav Bar (`Terminal.tsx:904-924`)
- Left: Lens badge + [Switch] button
- Center: Journey progress dots
- Right: Streak display

### Messages Area (`Terminal.tsx:927-1000`)
- `terminal-scroll` class for styling
- User messages: right-aligned, paper-dark bg, rounded
- Model messages: left-aligned, grove-forest border-left

### Input Area (`Terminal.tsx:1146-1165`)
```tsx
<input
  placeholder="Write a query..."
  className="w-full bg-white border border-ink/20 p-3 ..."
/>
```
- Single line input
- Send button on right

### Controls Above Input (`Terminal.tsx:1128-1144`)
- Scholar Mode toggle button
- Current topic reference

---

## Patterns Observed

### Message Rendering (`Terminal.tsx:47-160`)
- `MarkdownRenderer` component parses:
  - `**bold**` → orange bold
  - `*italic*` → ink italic
  - `→ prompt` → clickable prompt buttons
  - Lists with custom bullet styling

### Prompt Parsing
Prompts starting with `→ ` are rendered as clickable buttons:
```tsx
<button onClick={() => onPromptClick?.(prompt)}>
  <span className="text-grove-clay mr-2">→</span>
  {prompt}
</button>
```
These ARE currently clickable when `onPromptClick` is provided.

### Journey Flow
1. LensPicker shows on first open or "Switch" click
2. Selecting a lens triggers thread generation
3. JourneyNav shows progress dots
4. JourneyCard prompts continuation
5. JourneyCompletion modal on finish

---

## Key Gaps/Technical Debt

### 1. No Minimize Capability
- FAB toggles open/closed, no middle state
- No way to collapse Terminal while preserving state
- Users must close entirely to see main content

### 2. Controls Location
- Lens picker trigger is in JourneyNav (top of messages)
- Scholar Mode toggle is below messages, above input
- Inconsistent control placement

### 3. Header Complexity
- "The Terminal 🌱" + Scholar badge + CTX indicator
- Three competing elements
- CTX indicator value unclear to users

### 4. Monolithic Component
- `Terminal.tsx` is 1267 lines
- Mixes rendering, state management, event handlers
- Hard to refactor individual UX elements

### 5. Reveal System Complexity
- Multiple overlays: SimulationReveal, CustomLensOffer, TerminatorMode, FounderStory, ConversionCTA, JourneyCompletion
- All managed in Terminal.tsx with boolean state flags
- Complex conditional rendering

---

## Feature Flags (Current)

From `data/narratives.json`:
```json
{
  "id": "custom-lens-in-picker",
  "name": "Show \"Create Your Own\" in Lens Picker",
  "enabled": false
},
{
  "id": "genesis-landing",
  "name": "Genesis Landing Experience",
  "enabled": false
}
```

---

## Dependencies (External)

- No external UI component libraries
- Custom icons (inline SVG in LensPicker, JourneyNav)
- Services: `chatService.ts` for API calls
- Telemetry: `funnelAnalytics.ts` for event tracking

---

## Entry Points for Changes

| Goal | Files to Modify |
|------|-----------------|
| Add minimize | `Terminal.tsx:848-872` (FAB + Drawer) |
| Move controls below input | `Terminal.tsx:1128-1165` |
| Change header | `Terminal.tsx:889-901` |
| Rename "The Terminal" | `Terminal.tsx:893` |
| Add clickable suggestions | `Terminal.tsx:47-160` (MarkdownRenderer) |
| New feature flags | `data/narratives.json` |
