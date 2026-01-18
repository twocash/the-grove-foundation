# Repository Audit — Command Palette Sprint (v0.16)

## Stack
- Framework: React 18
- Language: TypeScript 5.x
- Build: Vite
- Styling: Tailwind v4 + CSS variables (grove tokens)
- Server: Express + Google Cloud Run

## Key Locations

### Terminal Input (Primary Target)
| Concern | File | Lines |
|---------|------|-------|
| Terminal component | `components/Terminal.tsx` | 1-1368 |
| Input element | `components/Terminal.tsx` | 1249-1260 |
| Placeholder text | `components/Terminal.tsx` | 1256 |
| handleSend() | `components/Terminal.tsx` | ~560 |
| Input state | `components/Terminal.tsx` | ~295 |

### Modal Patterns (Reference)
| Concern | File | Lines |
|---------|------|-------|
| WelcomeInterstitial | `components/Terminal/WelcomeInterstitial.tsx` | 1-83 |
| Welcome copy pattern | `components/Terminal/WelcomeInterstitial.tsx` | 22-26 |
| LensPicker modal | `components/Terminal/LensPicker.tsx` | — |
| CustomLensWizard modal | `components/Terminal/CustomLensWizard.tsx` | — |
| CognitiveBridge reveal | `components/Terminal/CognitiveBridge.tsx` | — |

### Terminal Subcomponents
| Concern | File | Lines |
|---------|------|-------|
| Index barrel | `components/Terminal/index.ts` | — |
| LensPicker | `components/Terminal/LensPicker.tsx` | — |
| LensGrid | `components/Terminal/LensGrid.tsx` | — |
| JourneyCard | `components/Terminal/JourneyCard.tsx` | — |
| TerminalControls | `components/Terminal/TerminalControls.tsx` | — |

### Existing Hooks
| Concern | File | Lines |
|---------|------|-------|
| Narrative engine | `hooks/useNarrativeEngine.ts` | — |
| Custom lens | `hooks/useCustomLens.ts` | — |
| Streak tracking | `hooks/useStreakTracking.ts` | — |
| Engagement bridge | `hooks/useEngagementBridge.ts` | — |
| Feature flags | `hooks/useFeatureFlags.ts` | — |

### Schema/Types
| Concern | File | Lines |
|---------|------|-------|
| Core types | `types.ts` | — |
| Lens types | `types/lens.ts` | — |
| Narrative schema | `data/narratives-schema.ts` | — |

### Analytics
| Concern | File | Lines |
|---------|------|-------|
| Funnel analytics | `utils/funnelAnalytics.ts` | — |

## Patterns Observed

### Modal Pattern
Modals in Terminal use boolean state toggles with conditional rendering:
```tsx
const [showLensPicker, setShowLensPicker] = useState(false);
// ...
{showLensPicker && <LensPicker ... />}
```

### Input Handling Pattern
Current input is a simple controlled component:
```tsx
<input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
  placeholder="Write a query..."
/>
```

### Styling Pattern
Grove uses semantic color tokens via Tailwind:
- `text-ink`, `text-ink-muted` — text colors
- `bg-paper`, `bg-white` — backgrounds
- `border-ink/20` — borders with opacity
- `text-grove-forest`, `text-grove-clay` — accent colors

### Component Organization
Terminal subcomponents live in `components/Terminal/` and are exported via barrel file.

## Gaps/Debt
- No command parsing infrastructure exists
- Input is a simple `<input>`, not a composite component
- No autocomplete/dropdown pattern in Terminal currently
- Streak data exists (`useStreakTracking`) but no `/stats` display component

## Build/Test Commands
```bash
npm run dev          # Local development
npm run build        # Production build
npm run type-check   # TypeScript validation
```
