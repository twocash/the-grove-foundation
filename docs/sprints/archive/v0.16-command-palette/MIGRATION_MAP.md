# Migration Map — Command Palette (v0.16)

## Files to Create

### Infrastructure
| File | Purpose |
|------|---------|
| `components/Terminal/CommandInput/CommandRegistry.ts` | Command registration and lookup |
| `components/Terminal/CommandInput/useCommandParser.ts` | Input parsing hook |
| `components/Terminal/CommandInput/index.ts` | Barrel export |

### UI Components
| File | Purpose |
|------|---------|
| `components/Terminal/CommandInput/CommandInput.tsx` | Composite input component |
| `components/Terminal/CommandInput/CommandAutocomplete.tsx` | Dropdown component |
| `components/Terminal/Modals/HelpModal.tsx` | /help output |
| `components/Terminal/Modals/JourneysModal.tsx` | /journeys output |
| `components/Terminal/Modals/StatsModal.tsx` | /stats output |
| `components/Terminal/Modals/index.ts` | Barrel export |

### Hooks
| File | Purpose |
|------|---------|
| `hooks/useExplorationStats.ts` | Aggregated stats for /stats |

### Commands
| File | Purpose |
|------|---------|
| `components/Terminal/CommandInput/commands/help.ts` | /help command |
| `components/Terminal/CommandInput/commands/welcome.ts` | /welcome command |
| `components/Terminal/CommandInput/commands/lens.ts` | /lens command |
| `components/Terminal/CommandInput/commands/journeys.ts` | /journeys command |
| `components/Terminal/CommandInput/commands/stats.ts` | /stats command |
| `components/Terminal/CommandInput/commands/index.ts` | Registration barrel |

## Files to Modify

### Terminal.tsx
**Location:** `components/Terminal.tsx`
**Lines affected:** 1249-1260 (input element), ~15 (imports), ~295 (state)

**Changes:**
1. Add imports for CommandInput and modal components
2. Add modal state: `showHelpModal`, `showJourneysModal`, `showStatsModal`
3. Replace raw `<input>` with `<CommandInput>` component
4. Add modal handlers
5. Render modal components conditionally

**Before (lines 1249-1260):**
```tsx
<input
  ref={inputRef}
  type="text"
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
  placeholder="Write a query..."
  className="w-full bg-white border ..."
  disabled={terminalState.isLoading}
  autoComplete="off"
/>
```

**After:**
```tsx
<CommandInput
  ref={inputRef}
  onSubmitQuery={(q) => handleSend(q)}
  disabled={terminalState.isLoading}
  onOpenModal={handleOpenModal}
  onSwitchLens={handleCommandLensSwitch}
  onShowToast={handleToast}
  onShowWelcome={() => setShowWelcomeInterstitial(true)}
/>
```

### Terminal/index.ts
**Location:** `components/Terminal/index.ts`
**Changes:** Add exports for CommandInput, Modals

## Rollback Plan

If issues arise:
1. Revert Terminal.tsx to pre-modification state
2. Delete new files in CommandInput/ and Modals/
3. Build should pass with original behavior

The changes are additive with a single integration point (Terminal.tsx input replacement). Safe rollback to previous commit.

## Directory Structure After Sprint

```
components/Terminal/
├── index.ts                    # Updated: add new exports
├── Terminal.tsx                # Updated: use CommandInput
├── WelcomeInterstitial.tsx
├── LensPicker.tsx
├── LensGrid.tsx
├── JourneyCard.tsx
├── CognitiveBridge.tsx
├── TerminalControls.tsx
├── CommandInput/               # NEW
│   ├── index.ts
│   ├── CommandInput.tsx
│   ├── CommandAutocomplete.tsx
│   ├── CommandRegistry.ts
│   ├── useCommandParser.ts
│   └── commands/
│       ├── index.ts
│       ├── help.ts
│       ├── welcome.ts
│       ├── lens.ts
│       ├── journeys.ts
│       └── stats.ts
├── Modals/                     # NEW
│   ├── index.ts
│   ├── HelpModal.tsx
│   ├── JourneysModal.tsx
│   └── StatsModal.tsx
└── Reveals/
    ├── SimulationReveal.tsx
    ├── CustomLensOffer.tsx
    └── ...

hooks/
├── useNarrativeEngine.ts
├── useStreakTracking.ts
├── useExplorationStats.ts      # NEW
└── ...
```
