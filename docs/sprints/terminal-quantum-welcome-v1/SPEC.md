# Specification: Terminal Quantum Welcome

**Sprint:** terminal-quantum-welcome-v1
**Author:** Foundation Loop
**Date:** 2024-12-25

## Problem Statement

Terminal's welcome experience is disconnected from the Quantum Interface pattern. When a user selects a lens, the Terminal should display lens-specific welcome content (heading, thesis, prompts, footer) styled with the glass theme. Currently, Terminal doesn't consume `useQuantumInterface()` at all.

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Terminal consumes `useQuantumInterface()` hook | P0 |
| FR-2 | When messages.length === 0 AND lens is selected, show TerminalWelcome | P0 |
| FR-3 | TerminalWelcome displays reality.terminal content | P0 |
| FR-4 | Clicking a prompt sends it to handleSend | P0 |
| FR-5 | Fallback to DEFAULT_TERMINAL_WELCOME if reality.terminal undefined | P1 |
| FR-6 | Custom lenses get generated welcome via realityCollapser | P1 |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Glass styling matches Lenses page aesthetic | P0 |
| NFR-2 | No new configuration systems created | P0 |
| NFR-3 | Works in both overlay and embedded variants | P1 |

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Lens-reactive welcome | Pattern 1: Quantum Interface | Consume existing hook in Terminal |
| Glass styling | Pattern 4: Token Namespaces | Use existing `--glass-*` tokens |
| Welcome content | Pattern 3: Narrative Schema | TerminalWelcome type already defined |

## New Patterns Proposed

**None required.** All needs met by existing patterns.

## API Contract

### TerminalWelcome Component Props

```typescript
interface TerminalWelcomeProps {
  welcome: TerminalWelcome;
  onPromptClick: (prompt: string) => void;
  variant?: 'overlay' | 'embedded';
}
```

### Consumed from useQuantumInterface

```typescript
const { reality, activeLens, isCollapsing } = useQuantumInterface();

// reality.terminal exists when lens is selected
// Falls back to DEFAULT_TERMINAL_WELCOME if undefined
```

## Acceptance Criteria

1. [ ] Terminal imports and calls `useQuantumInterface()`
2. [ ] When no messages and lens selected, TerminalWelcome renders
3. [ ] TerminalWelcome displays heading, thesis, prompts, footer from reality.terminal
4. [ ] Clicking a prompt chip calls handleSend with that prompt
5. [ ] Styling uses `--glass-*` tokens (matches Lenses page)
6. [ ] Works with predefined lenses (concerned-citizen, engineer, etc.)
7. [ ] Works with custom lenses (generated via realityCollapser)
8. [ ] Graceful fallback when reality.terminal is undefined

## Out of Scope

- Changing the Quantum Interface hook itself
- Modifying SUPERPOSITION_MAP content
- Terminal message styling (separate sprint: terminal-glass-v1)
- WelcomeInterstitial component (separate flow)

## Test Strategy

### Manual Verification

1. Select "Concerned Citizen" lens → See lens-specific welcome
2. Select "Engineer" lens → See different welcome content
3. Click a prompt → Message sent, welcome disappears
4. Custom lens → Generated welcome appears

### Automated (if time permits)

```typescript
// E2E: Verify welcome content matches lens
test('terminal welcome reflects lens selection', async ({ page }) => {
  await page.goto('/terminal');
  await selectLens('concerned-citizen');
  await expect(page.getByText('Plain-language explanations')).toBeVisible();
});
```
