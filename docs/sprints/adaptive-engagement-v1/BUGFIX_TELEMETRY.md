# Bug Fix: Adaptive Engagement Telemetry Not Tracking

## Problem

User has sent multiple messages (>3) but:
1. Stage remains at ARRIVAL (should advance to ORIENTED)
2. No stage indicator visible in Terminal
3. Console shows no telemetry logging
4. Prompts not changing based on engagement

## Diagnosis Steps

First, check current telemetry state:

```bash
# In browser console:
localStorage.getItem('grove-telemetry')
```

If null or exchangeCount is 0, telemetry isn't being tracked.

## Root Cause Investigation

### 1. Check Terminal.tsx Integration

The sprint was supposed to add telemetry tracking to Terminal.tsx. Verify this exists:

```bash
grep -n "trackExchange\|useSessionTelemetry\|telemetry" src/components/Terminal/Terminal.tsx
```

**Expected:** Should find `useSessionTelemetry` hook and `trackExchange` calls.

### 2. Check TerminalWelcome.tsx Stage Display

```bash
grep -n "stage\|useSessionTelemetry\|useSuggestedPrompts" src/components/Terminal/TerminalWelcome.tsx
```

**Expected:** Should find stage indicator rendering and adaptive prompts.

### 3. Check TelemetryCollector Singleton

```bash
cat src/lib/telemetry/collector.ts | head -100
```

**Expected:** Singleton pattern with `trackExchange()` method.

## Fix Implementation

### Fix 1: Wire Telemetry to Chat Handler

In `Terminal.tsx` (or wherever chat messages are sent), add:

```typescript
import { useSessionTelemetry } from '@/hooks/useSessionTelemetry';

// Inside component:
const { trackExchange, trackTopic } = useSessionTelemetry();

// After successful message send:
const handleSendMessage = async (message: string) => {
  // ... existing send logic ...
  
  // Track the exchange
  trackExchange();
  
  // If message mentions a hub/topic, track it
  // trackTopic('hub-id');
  
  console.log('[Telemetry] Exchange tracked');
};
```

### Fix 2: Add Stage Indicator to TerminalWelcome

In `TerminalWelcome.tsx`, ensure stage is displayed:

```typescript
import { useSessionTelemetry } from '@/hooks/useSessionTelemetry';
import { useSuggestedPrompts } from '@/hooks/useSuggestedPrompts';

export function TerminalWelcome({ lensId, lensName }: Props) {
  const { telemetry } = useSessionTelemetry();
  const { prompts } = useSuggestedPrompts(lensId, lensName);
  
  const stageEmoji = {
    ARRIVAL: '🌱',
    ORIENTED: '🌿',
    EXPLORING: '🌳',
    ENGAGED: '🌲'
  };

  return (
    <div>
      {/* Stage indicator */}
      <div className="text-xs text-muted-foreground mb-2">
        {stageEmoji[telemetry.stage]} {telemetry.stage} 
        • {telemetry.exchangeCount} exchanges
      </div>
      
      {/* Adaptive prompts */}
      <div className="flex flex-wrap gap-2">
        {prompts.map(prompt => (
          <button key={prompt.id} onClick={() => handlePromptClick(prompt)}>
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Fix 3: Add Debug Logging to Collector

In `src/lib/telemetry/collector.ts`, add logging:

```typescript
trackExchange(): void {
  console.log('[TelemetryCollector] trackExchange called');
  this.telemetry.exchangeCount++;
  this.telemetry.totalExchangeCount++;
  this.recomputeStage();
  this.persist();
  this.notifySubscribers();
  console.log('[TelemetryCollector] New state:', this.telemetry);
}
```

## Verification

After fixes:

```bash
# 1. Build
npm run build

# 2. Start dev server
npm run dev

# 3. Clear state
# In browser: localStorage.clear(); location.reload();

# 4. Send 3 messages
# Watch console for: [TelemetryCollector] trackExchange called

# 5. Check localStorage
localStorage.getItem('grove-telemetry')
# Should show: {"exchangeCount": 3, "stage": "ORIENTED", ...}

# 6. Verify UI shows stage indicator and new prompts
```

## Success Criteria

- [ ] Console shows `[TelemetryCollector] trackExchange called` on each message
- [ ] `localStorage.getItem('grove-telemetry')` shows incrementing exchangeCount
- [ ] After 3 exchanges, stage changes from ARRIVAL to ORIENTED
- [ ] Stage indicator visible in Terminal (e.g., "🌿 ORIENTED • 3 exchanges")
- [ ] Prompts change from orientation ("What is Grove?") to discovery ("Go deeper")

## Files to Check/Modify

1. `src/components/Terminal/Terminal.tsx` - Wire telemetry tracking
2. `src/components/Terminal/TerminalWelcome.tsx` - Display stage + adaptive prompts
3. `src/lib/telemetry/collector.ts` - Add debug logging
4. `hooks/useSessionTelemetry.ts` - Verify hook exports trackExchange

Start by running the grep commands to see what's currently wired up.
