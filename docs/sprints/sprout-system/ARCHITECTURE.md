# Sprout System Architecture

## System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                         TERMINAL                                 │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Messages   │───▶│  Commands   │───▶│   Sprouts   │         │
│  │   (state)   │    │  (registry) │    │  (capture)  │         │
│  └─────────────┘    └─────────────┘    └──────┬──────┘         │
│                                               │                 │
│                                               ▼                 │
│                                        ┌─────────────┐         │
│                                        │ localStorage │         │
│                                        │grove-sprouts │         │
│                                        └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Future: API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE COMMONS                             │
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                │
│   │  Sprout  │───▶│ Sapling  │───▶│   Tree   │                │
│   │ (staged) │    │(reviewed)│    │(published)│                │
│   └──────────┘    └──────────┘    └──────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Relationships

### Capture Flow
```
Terminal.tsx
    │
    ├── terminalState.messages (last response)
    │
    ├── CommandInput
    │       │
    │       └── CommandRegistry
    │               │
    │               └── sproutCommand
    │                       │
    │                       ├── useSproutCapture()
    │                       │       │
    │                       │       └── localStorage
    │                       │
    │                       └── showToast("🌱 Sprout planted!")
    │
    └── session (persona, journey context)
```

### Display Flow
```
/garden command
    │
    └── GardenModal
            │
            └── useSproutStats()
                    │
                    └── localStorage (grove-sprouts)

/stats command
    │
    └── StatsModal
            │
            ├── useExplorationStats() (existing)
            │
            └── useSproutStats() (new section)
```

## Data Model

### Sprout Interface
```typescript
interface Sprout {
  id: string;                    // UUID
  capturedAt: string;            // ISO timestamp
  
  // Preserved content (VERBATIM)
  response: string;              // Exact LLM output
  query: string;                 // What user asked
  
  // Generation context (provenance)
  personaId: string | null;      // Lens active
  journeyId: string | null;      // If in journey mode
  hubId: string | null;          // Topic hub matched
  nodeId: string | null;         // Card/node that triggered
  
  // Lifecycle
  status: 'sprout';              // MVP: always 'sprout'
  tags: string[];                // User annotations
  notes: string | null;          // Human commentary
  
  // Attribution (future-ready)
  sessionId: string;             // Anonymous session ID
  creatorId: string | null;      // Grove ID (future)
}
```

### Storage Schema (localStorage)
```typescript
interface SproutStorage {
  version: 1;
  sprouts: Sprout[];
  sessionId: string;             // Generated once per browser
}
```

## Interface Contracts

### CommandContext Extension
```typescript
interface CommandContext {
  // Existing
  openModal: (modal: 'help' | 'journeys' | 'stats' | 'garden') => void;
  showToast: (message: string) => void;
  
  // New for Sprout
  getLastResponse: () => { text: string; query: string } | null;
  getSessionContext: () => {
    personaId: string | null;
    journeyId: string | null;
    hubId: string | null;
    nodeId: string | null;
  };
}
```

### useSproutCapture Hook
```typescript
interface SproutCaptureHook {
  capture: (options?: { tags?: string[]; notes?: string }) => Sprout | null;
  getSprouts: () => Sprout[];
  getSessionSprouts: () => Sprout[];
  clearSession: () => void;
}
```

### useSproutStats Hook
```typescript
interface SproutStats {
  totalSprouts: number;
  sessionSprouts: number;
  sproutsByHub: Record<string, number>;
  recentSprouts: Sprout[];       // Last 5
}
```

## Styling Tokens

Garden Modal uses existing Grove design system:
- Background: `bg-paper`
- Border: `border-ink/10`
- Text: `text-ink`, `text-ink-muted`
- Accent: `text-grove-forest`, `bg-grove-forest/5`
- Mono: `font-mono text-[10px] uppercase tracking-widest`

## Future Integration Points

### Grove ID (Phase 2)
- `creatorId` field in Sprout
- Claim anonymous sprouts on login
- Attribution chain linking

### Knowledge Commons (Phase 3)
- API endpoint for sprout submission
- Status progression: sprout → sapling → tree
- Notification when sprouts are promoted

### Network Propagation (Phase 4)
- Sprout sync across Grove network
- Credit flow when trees influence responses
- Derivative tracking
