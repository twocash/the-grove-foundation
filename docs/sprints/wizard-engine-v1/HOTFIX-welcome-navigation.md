# Hotfix: WelcomeInterstitial Navigation Bug

## Problem

`WelcomeInterstitial` always uses `navigate('/lenses?returnTo=/terminal...')` when user clicks "Choose Your Lens". This breaks the flow when the component is embedded inside Terminal:

1. **Genesis (split mode):** Click "Choose Your Lens" → navigates away → loses split layout state → returns to landing page
2. **/terminal:** Click "Choose Your Lens" → routes back to landing page → loses terminal state

## Root Cause

`WelcomeInterstitial.tsx` line 17-19:
```typescript
const handleChooseLens = () => {
  navigate('/lenses?returnTo=/terminal&ctaLabel=Start%20Exploring');
};
```

## Fix

Make `WelcomeInterstitial` accept an `onChooseLens` callback prop. When provided, call it instead of navigating.

### File 1: `components/Terminal/WelcomeInterstitial.tsx`

```typescript
// WelcomeInterstitial - First-open experience for new Terminal users
// Sprint: route-selection-flow-v1 - Simplified to copy + CTA
// Hotfix: Accept callback to avoid navigation when embedded

import React from 'react';
import { useNavigate } from 'react-router-dom';

const WELCOME_COPY = `Welcome to The Grove.

You're inside the Terminal — engaging with your own personal AI. In this demo, we explore complex ideas through conversation. Everything written about The Grove Foundation is indexed here.

Choose a lens to shape how we explore the subject matter in a way most relevant to you. Each lens emphasizes different aspects of this groundbreaking initiative.`;

interface WelcomeInterstitialProps {
  onChooseLens?: () => void;  // Optional callback - if provided, use instead of navigation
}

const WelcomeInterstitial: React.FC<WelcomeInterstitialProps> = ({ onChooseLens }) => {
  const navigate = useNavigate();

  const handleChooseLens = () => {
    if (onChooseLens) {
      // Use callback when embedded in Terminal
      onChooseLens();
    } else {
      // Fallback to navigation (standalone usage)
      navigate('/lenses?returnTo=/terminal&ctaLabel=Start%20Exploring');
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      {/* Welcome Copy */}
      <div className="max-w-xl text-center space-y-4 mb-8">
        {WELCOME_COPY.split('\n\n').map((paragraph, i) => (
          <p
            key={i}
            className={`font-serif text-sm leading-relaxed ${
              i === 0
                ? 'text-[var(--glass-text-primary)] font-medium'
                : 'text-[var(--glass-text-muted)]'
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* CTA to Lenses */}
      <button
        onClick={handleChooseLens}
        className="glass-select-button glass-select-button--solid px-8 py-3 text-sm"
      >
        Choose Your Lens
      </button>
    </div>
  );
};

export default WelcomeInterstitial;
```

### File 2: `components/Terminal.tsx`

Find the WelcomeInterstitial rendering (around line 1044) and pass the callback:

**Before:**
```typescript
) : showWelcomeInterstitial ? (
  <WelcomeInterstitial />
)
```

**After:**
```typescript
) : showWelcomeInterstitial ? (
  <WelcomeInterstitial 
    onChooseLens={() => {
      actions.hideWelcomeInterstitial();
      actions.showLensPicker();
    }}
  />
)
```

## Verification

1. **Genesis flow:**
   - Load the-grove.ai
   - Click sapling → split layout appears
   - Click "Choose Your Lens" in right panel
   - ✓ LensPicker shows IN the terminal panel (no navigation)
   - Select a lens
   - ✓ Returns to chat mode with lens set

2. **/terminal flow:**
   - Navigate to /terminal directly
   - Click "Choose Your Lens" in welcome
   - ✓ LensPicker shows IN the terminal (no navigation)
   - Select a lens
   - ✓ Returns to chat mode with lens set

## Commit

```bash
git add components/Terminal/WelcomeInterstitial.tsx components/Terminal.tsx
git commit -m "fix(terminal): prevent WelcomeInterstitial from navigating away when embedded"
```
