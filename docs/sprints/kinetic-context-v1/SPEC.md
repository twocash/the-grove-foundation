# SPEC.md — kinetic-context-v1

## Quick Reference

### KineticHeader Props
```typescript
interface KineticHeaderProps {
  // Lens context
  lensId?: string | null;
  lensName?: string;
  lensColor?: string;
  onLensClick?: () => void;
  
  // Journey context
  journeyId?: string | null;
  journeyName?: string;
  onJourneyClick?: () => void;
  
  // Stage
  stage?: 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';
  exchangeCount?: number;
  
  // Streak (optional)
  currentStreak?: number;
  showStreak?: boolean;
  onStreakClick?: () => void;
}
```

### KineticWelcome Props
```typescript
interface KineticWelcomeProps {
  content: TerminalWelcome;
  lensId?: string | null;
  lensName?: string;
  onPromptClick: (prompt: string, command?: string, journeyId?: string) => void;
  stage?: string;
  exchangeCount?: number;
}
```

### TerminalWelcome Structure (from quantum-content)
```typescript
interface TerminalWelcome {
  heading: string;
  thesis: string;
  prompts: string[];
  footer?: string;
  placeholder?: string;
}
```

### Overlay State
```typescript
type KineticOverlayType = 
  | 'none' 
  | 'lens-picker' 
  | 'journey-picker'
  | 'welcome';

interface KineticOverlayState {
  type: KineticOverlayType;
}
```

### useKineticContext Hook (if created)
```typescript
function useKineticContext() {
  return {
    // Lens
    lens: string | null,
    lensData: Persona | null,
    selectLens: (id: string) => void,
    
    // Journey
    journey: Journey | null,
    isJourneyActive: boolean,
    startJourney: (journey: Journey) => void,
    exitJourney: () => void,
    
    // Stage
    stage: string,
    exchangeCount: number,
    
    // Welcome
    welcomeContent: TerminalWelcome,
    
    // Prompts
    suggestedPrompts: Prompt[],
    refreshPrompts: () => void,
  };
}
```

### Component Hierarchy
```
ExploreShell
├── KineticHeader
│   ├── LensPill (opens lens-picker)
│   ├── JourneyPill (opens journey-picker)
│   └── StageIndicator
├── [Overlay]
│   ├── LensPicker
│   └── JourneyPicker
├── StreamArea
│   ├── KineticWelcome (when items.length === 0)
│   └── KineticRenderer
└── CommandConsole
```

### Visual Design

**Header Pills:**
- Glass elevated background
- 11px font, medium weight
- Lens pill: colored dot indicator
- Journey pill: hidden on smaller screens
- Dropdown indicator (▾)

**Welcome Card:**
- Glass surface with border
- Stage emoji + label
- Bold heading
- Thesis paragraph
- 3 clickable prompts (→ prefix)
- Subtle footer

**Stage Colors:**
- ARRIVAL: 👋 emerald-800/emerald-300
- ORIENTED: 🧭 emerald-800/emerald-300
- EXPLORING: 🔍 emerald-800/emerald-300
- ENGAGED: 🌲 emerald-800/emerald-300
