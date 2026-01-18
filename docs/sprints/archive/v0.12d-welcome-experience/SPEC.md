# Welcome Experience Specification — v0.12d

## Overview
Split the LensPicker into two distinct experiences: a Welcome Interstitial for first-time users that establishes product context, and a streamlined Lens Switcher for returning users. Enable the Create Your Own Lens feature by default.

## Goals
1. **Create WelcomeInterstitial component** — First-open experience with product context
2. **Refactor LensPicker for switching** — Remove welcome copy, streamline for quick lens changes
3. **Enable Create Your Own by default** — This is a killer feature, shouldn't be hidden
4. **Update welcome copy** — Establish that user is actively using the product
5. **Differentiate trigger paths** — First open vs. pill click lead to different UIs

## Non-Goals
- Adding new lens types or personas
- Modifying the CustomLensWizard flow
- Changing the chat API or backend
- Redesigning the lens pill button (done in v0.12c)
- Adding new analytics events (use existing patterns)

## Current State Inventory

### LensPicker Component
- **Location:** `components/Terminal/LensPicker.tsx:1-307`
- **Current behavior:** Shows welcome header + lens list + optional Create Your Own
- **Issues:** Same component serves welcome AND switching; no mode awareness

### Terminal Welcome Flow
- **Location:** `components/Terminal.tsx:361-384`
- **Current behavior:** Injects chat message, then shows LensPicker after 500ms
- **Issues:** Welcome message hidden behind LensPicker; no visual hierarchy

### Feature Flag
- **Location:** `src/core/config/defaults.ts:115-120`
- **Current behavior:** `custom-lens-in-picker` is `false` by default
- **Issues:** Hides killer feature from all users

## Target State

### WelcomeInterstitial (New Component)
- **Purpose:** First-open experience that establishes product context
- **Triggers:** Terminal opens AND `grove-terminal-welcomed` not set
- **Content:**
  - Welcome copy (see TARGET_CONTENT.md)
  - Lens selection grid
  - Create Your Own option (always visible)
  - "You can switch anytime" reassurance
- **Actions:**
  - Select lens → close interstitial, start exploring
  - Create Your Own → open CustomLensWizard

### LensPicker (Refactored)
- **Purpose:** Quick lens switching for engaged users
- **Triggers:** User clicks lens pill button in TerminalControls
- **Content:**
  - Minimal header ("Switch Lens" or similar)
  - Lens selection grid (same as today)
  - Create Your Own option (always visible)
  - Current lens indicator
- **Actions:**
  - Select lens → close picker, continue conversation
  - Create Your Own → open CustomLensWizard

### Feature Flag Change
- **Change:** `custom-lens-in-picker` default from `false` to `true`
- **Rationale:** Create Your Own is a differentiating feature

## Target Content

### Welcome Interstitial Copy
```
Welcome to The Grove.

You're inside the Terminal — engaging with your own personal AI. In this demo, we explore complex ideas through conversation. Everything written about The Grove Foundation is indexed here.

Choose a lens to shape how we explore the subject matter in a way most relevant to you. Each lens emphasizes different aspects of this groundbreaking initiative. You can switch lenses anytime in your journey. And we recommend it!
```

### Lens Switcher Header
```
Switch Lens
```

### Lens Switcher Footer
```
Your current lens shapes how we explore topics together.
```

## Acceptance Criteria

### Functional
- [ ] AC-1: First Terminal open shows WelcomeInterstitial (not LensPicker)
- [ ] AC-2: WelcomeInterstitial displays approved welcome copy
- [ ] AC-3: Selecting a lens from WelcomeInterstitial closes it and starts chat
- [ ] AC-4: Clicking lens pill shows LensPicker (not WelcomeInterstitial)
- [ ] AC-5: LensPicker shows "Switch Lens" header (not "Welcome to The Grove")
- [ ] AC-6: Create Your Own option visible in both components
- [ ] AC-7: Welcome only shows once (localStorage check works)
- [ ] AC-8: CustomLensWizard accessible from both entry points

### Visual
- [ ] AC-9: WelcomeInterstitial has clear visual hierarchy (copy → lenses → CTA)
- [ ] AC-10: LensPicker is streamlined (no welcome paragraph)
- [ ] AC-11: Current lens highlighted in LensPicker
- [ ] AC-12: Create Your Own card has clay orange dashed border

### Technical
- [ ] AC-13: Build completes without errors
- [ ] AC-14: No console errors in browser
- [ ] AC-15: Feature flag `custom-lens-in-picker` defaults to `true`
- [ ] AC-16: Both components share lens rendering logic (DRY)

## Dependencies
- v0.12c must be complete (lens pill redesign)
- CustomLensWizard must remain functional

## Risks
- **Risk:** Breaking CustomLensWizard flow
  - **Mitigation:** Both components call same handlers
- **Risk:** Welcome showing repeatedly
  - **Mitigation:** Same localStorage key, same check logic
- **Risk:** Code duplication between components
  - **Mitigation:** Extract shared LensGrid component
