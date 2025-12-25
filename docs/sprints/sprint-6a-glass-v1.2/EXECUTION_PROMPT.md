# Sprint 6A + Quantum Glass v1.2
## EXECUTION_PROMPT.md

**Date:** 2025-12-25
**Repository:** C:\GitHub\the-grove-foundation

---

## Pre-Flight

```bash
cd C:\GitHub\the-grove-foundation
git status
git pull origin main
npm run build
```

---

## Phase 1: Analytics Verification (Sprint 6A)

### Step 1.1: Verify Bridge Events

**Goal:** Confirm Cognitive Bridge events fire correctly.

**Manual Test:**
1. Start dev server: `npm run dev`
2. Open http://localhost:3000/terminal
3. Open browser console
4. Have a 3+ message conversation
5. Check if bridge appears (entropy threshold)
6. Click accept or dismiss
7. Run in console:
```javascript
JSON.parse(localStorage.getItem('grove-analytics-events'))
  .filter(e => e.event.includes('bridge'))
```

**Expected:** Events with journeyId, entropyScore, cluster, exchangeCount

**If Missing:** Check `components/Terminal/CognitiveBridge.tsx` for tracking calls.

### Step 1.2: Consolidate ENTROPY_CONFIG

**File 1:** `constants.ts` (keep as canonical)

Find existing ENTROPY_CONFIG and ensure it has all properties:
```typescript
export const ENTROPY_CONFIG = {
  THRESHOLDS: {
    LOW: 30,
    MEDIUM: 60,
  },
  LIMITS: {
    MAX_INJECTIONS_PER_SESSION: 2,
    COOLDOWN_EXCHANGES: 5,
  },
  SCORING: {
    EXCHANGE_DEPTH_BONUS: 30,
    TAG_MATCH_POINTS: 15,
    MAX_TAG_MATCHES: 3,
    DEPTH_MARKER_POINTS: 20,
    REFERENCE_CHAIN_POINTS: 25,
  },
  // Merged from engagement/config.ts:
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
};
```

**File 2:** `src/core/engagement/config.ts`

Replace duplicate definition with re-export:
```typescript
// Re-export from canonical source
export { ENTROPY_CONFIG } from '../../../constants';
```

**Verify:** `npm run build` succeeds

---

## Phase 2: Chat Container + Welcome (v1.2.1)

### Step 2.1: Add CSS Classes

**File:** `styles/globals.css`

Add after existing glass classes:
```css
/* ============================================
   CHAT INTERFACE - Quantum Glass v1.2
   ============================================ */

.glass-chat-container {
  background: var(--glass-void);
  min-height: 100%;
}

.glass-welcome-card {
  background: var(--glass-panel);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 24px;
}

@supports (backdrop-filter: blur(8px)) {
  .glass-welcome-card {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

.glass-welcome-title {
  color: var(--glass-text-primary);
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.glass-welcome-body {
  color: var(--glass-text-body);
  font-size: 14px;
  line-height: 1.6;
}

.glass-suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.glass-suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--glass-solid);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--glass-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.glass-suggestion:hover {
  border-color: var(--glass-border-hover);
  background: var(--glass-elevated);
}

.glass-suggestion-icon {
  color: var(--glass-text-subtle);
  font-size: 16px;
}
```

### Step 2.2: Apply to Terminal

**File:** `components/Terminal.tsx`

Find the main chat container (around the message list area) and add class:
- Add `glass-chat-container` to the outer wrapper
- Update Welcome card styling

---

## Phase 3: Message Bubbles (v1.2.2)

### Step 3.1: Add Message CSS

**File:** `styles/globals.css`

Add:
```css
/* Message Bubbles */
.glass-message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.glass-message-user {
  margin-left: auto;
  background: var(--glass-elevated);
  border: 1px solid var(--glass-border);
  color: var(--glass-text-primary);
  border-radius: 12px 12px 4px 12px;
}

.glass-message-assistant {
  margin-right: auto;
  background: var(--glass-panel);
  border: 1px solid var(--glass-border);
  color: var(--glass-text-body);
  border-radius: 12px 12px 12px 4px;
}

@supports (backdrop-filter: blur(8px)) {
  .glass-message-assistant {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

/* Code blocks in messages */
.glass-message pre {
  background: var(--glass-solid);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 13px;
}

.glass-message code {
  font-family: var(--font-mono);
  font-size: 13px;
}

/* Inline code */
.glass-message :not(pre) > code {
  background: var(--glass-elevated);
  padding: 2px 6px;
  border-radius: 4px;
}
```

### Step 3.2: Apply to Message Components

Find where messages are rendered in Terminal.tsx and apply appropriate classes based on role (user vs assistant).

---

## Phase 4: Input Field (v1.2.3)

### Step 4.1: Add Input CSS

**File:** `styles/globals.css`

Add:
```css
/* Chat Input */
.glass-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--glass-solid);
  border-top: 1px solid var(--glass-border);
}

.glass-input-field {
  flex: 1;
  background: var(--glass-void);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--glass-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--duration-fast);
}

.glass-input-field::placeholder {
  color: var(--glass-text-subtle);
}

.glass-input-field:focus {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.15);
}

.glass-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--neon-green);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.glass-send-btn:hover {
  background: rgba(16, 185, 129, 0.85);
  box-shadow: var(--glow-green);
}

.glass-send-btn:disabled {
  background: var(--glass-border);
  cursor: not-allowed;
  box-shadow: none;
}
```

### Step 4.2: Apply to CommandInput

**File:** `components/Terminal/CommandInput.tsx`

Apply glass classes to input and button elements.

---

## Phase 5: Inspector Content (v1.2.4)

**Files:**
- `src/workspace/Inspector.tsx`
- `src/explore/JourneyInspector.tsx`
- `src/explore/LensInspector.tsx`

Update interior styling:
- Section headers: `glass-section-header`
- Property labels: `glass-text-muted`
- Property values: `glass-text-secondary`
- Buttons: `glass-btn-secondary`

---

## Phase 6: Diary + Sprout Views (v1.2.5, v1.2.6)

**Files:**
- `src/explore/DiaryList.tsx`
- `src/explore/DiaryInspector.tsx`
- `src/cultivate/SproutGrid.tsx`
- `src/cultivate/SproutInspector.tsx`

Apply same card pattern as Journeys/Lenses/Nodes:
- Container: `glass-card`
- Icon: `glass-card-icon`
- Footer: `glass-card-footer`
- Status: `status-badge-*`

---

## Verification

### Build Test
```bash
npm run build
```

### Visual Regression
1. Open /terminal — chat should be dark glass
2. Send a message — bubbles differentiated
3. Open inspector — content matches frame
4. Navigate to Diary — cards match pattern
5. Navigate to Sprouts — cards match pattern

### Analytics Test
```javascript
// In browser console after using app:
const report = JSON.parse(localStorage.getItem('grove-analytics-events'));
console.table(report.map(e => ({ event: e.event, time: e.timestamp })));
```

---

## Commit

```bash
git add -A
git commit -m "feat: Sprint 6A analytics + Quantum Glass v1.2

Sprint 6A - Analytics & Tuning:
- Verified Cognitive Bridge funnel events
- Consolidated ENTROPY_CONFIG to single source
- Documented baseline metrics

Quantum Glass v1.2 - Visual Unification:
- Terminal chat container with glass-void background
- Message bubbles (user vs assistant differentiation)
- Input field with glass styling
- Inspector content panels updated
- Diary and Sprout views unified

All workspace views now follow glass design system."

git push origin main
```

---

## Post-Sprint

Next up: Engagement Reveal Bug Fix sprint
- BUG-001: Custom Lens Reveal flow
- BUG-003: Engagement state → reveal trigger

With analytics in place, we can verify fixes with data.
