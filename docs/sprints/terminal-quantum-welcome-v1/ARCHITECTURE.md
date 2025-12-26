# Architecture: Terminal Quantum Welcome

**Sprint:** terminal-quantum-welcome-v1

## Overview

This sprint wires Terminal to the existing Quantum Interface pattern, enabling declarative, lens-reactive welcome experiences.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QUANTUM INTERFACE DATA FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User Action: Select Lens                                            │
│       ↓                                                              │
│  engSelectLens('concerned-citizen')                                  │
│       ↓                                                              │
│  useQuantumInterface() observes lens change                          │
│       ↓                                                              │
│  resolveReality() executes:                                          │
│       ├── Check effectiveRealities[lensId]                           │
│       │       ├── schema.lensRealities (GCS, precedence)             │
│       │       └── SUPERPOSITION_MAP (fallback)                       │
│       └── If custom lens: realityCollapser.collapse()                │
│       ↓                                                              │
│  Returns: reality.terminal = {                                       │
│    heading: "The Terminal.",                                         │
│    thesis: "Plain-language explanations...",                         │
│    prompts: ["Why should I care...", ...],                           │
│    footer: "No jargon. Just answers.",                               │
│    placeholder: "Ask me anything..."                                 │
│  }                                                                   │
│       ↓                                                              │
│  Terminal.tsx consumes reality.terminal                              │
│       ↓                                                              │
│  <TerminalWelcome welcome={reality.terminal} />                      │
│       ↓                                                              │
│  Glass-styled card renders with lens-specific content                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### New Component: TerminalWelcome

```
components/Terminal/TerminalWelcome.tsx
├── Props: { welcome, onPromptClick, variant }
├── Consumes: TerminalWelcome type from schema
├── Renders:
│   ├── Heading (h2, glass-text-primary)
│   ├── Thesis (p, glass-text-body)
│   ├── Prompts (buttons, glass-suggestion-chip)
│   └── Footer (p, glass-text-subtle)
└── Styling: --glass-* tokens exclusively
```

### Modified Component: Terminal.tsx

```typescript
// ADD: Import hook
import { useQuantumInterface } from '../src/surface/hooks/useQuantumInterface';
import { DEFAULT_TERMINAL_WELCOME } from '../src/data/quantum-content';
import TerminalWelcome from './Terminal/TerminalWelcome';

// ADD: In component body
const { reality, activeLens, isCollapsing } = useQuantumInterface();

// ADD: Derive welcome content
const welcomeContent = reality?.terminal ?? DEFAULT_TERMINAL_WELCOME;

// ADD: In render, when messages empty and lens selected
{terminalState.messages.length === 0 && activeLens && (
  <TerminalWelcome
    welcome={welcomeContent}
    onPromptClick={handleSend}
    variant={variant}
  />
)}
```

## CSS Token Usage

All styling uses existing `--glass-*` tokens from globals.css:

| Element | Token |
|---------|-------|
| Card background | `--glass-panel` |
| Card border | `--glass-border` |
| Heading text | `--glass-text-primary` |
| Body text | `--glass-text-body` |
| Footer text | `--glass-text-subtle` |
| Prompt chips | `--glass-elevated`, `--neon-green` |

### New CSS Classes (Optional)

```css
/* If needed for semantic clarity */
.glass-welcome-card {
  background: var(--glass-panel);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
}

.glass-welcome-prompt {
  background: var(--glass-elevated);
  border: 1px solid var(--glass-border);
  color: var(--glass-text-primary);
  transition: all 0.2s ease;
}

.glass-welcome-prompt:hover {
  border-color: var(--neon-green);
  color: var(--neon-green);
}
```

## DEX Compliance

### Declarative Sovereignty

**How domain experts can modify welcome behavior:**
1. Edit `narratives.json` → `lensRealities[lensId].terminal`
2. Upload to GCS → Schema loads on app init
3. No code changes required

### Capability Agnosticism

**How this works regardless of model:**
- Predefined lenses: Content from SUPERPOSITION_MAP (no LLM needed)
- Custom lenses: realityCollapser generates content (model-agnostic API)
- Fallback: DEFAULT_TERMINAL_WELCOME always available

### Provenance

**How we track attribution:**
- Content source: schema.lensRealities or SUPERPOSITION_MAP
- Lens selection: Tracked via engagement state machine
- Generation: realityCollapser logs generation time, cache status

### Organic Scalability

**How this grows without restructuring:**
- New lens → Add entry to lensRealities → Welcome appears automatically
- New fields → Extend TerminalWelcome type → Component renders new fields
- New styling → Add tokens → All welcomes update

## State Dependencies

```
┌─────────────────────────────────────────────┐
│          STATE DEPENDENCY GRAPH              │
├─────────────────────────────────────────────┤
│                                              │
│  engSelectLens() ─────┐                      │
│                       ↓                      │
│              engagement.lens                 │
│                       ↓                      │
│           useQuantumInterface()              │
│                       ↓                      │
│              reality.terminal                │
│                       ↓                      │
│            <TerminalWelcome />               │
│                                              │
│  terminalState.messages.length ─────────────┤
│         (controls visibility)                │
│                                              │
└─────────────────────────────────────────────┘
```

## Integration Points

| System | Integration |
|--------|-------------|
| Engagement Machine | Provides lens via `useLensState` |
| Quantum Interface | Provides reality.terminal |
| Narrative Engine | Provides schema.lensRealities |
| Glass Theme | Provides CSS tokens |
| Reality Collapser | Generates custom lens content |
