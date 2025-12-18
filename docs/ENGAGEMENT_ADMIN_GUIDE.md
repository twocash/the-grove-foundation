# Engagement Bus Admin Console Guide

> User documentation for the Engagement Bridge monitoring and testing interface

## Accessing the Admin Console

1. Navigate to your Grove app URL
2. Add `?admin=true` to the URL (e.g., `https://your-app.run.app?admin=true`)
3. Click the **Engagement** tab in the admin dashboard

## Understanding the Three Tabs

### Monitor Tab

The Monitor tab provides real-time visibility into user engagement metrics.

#### Live Metrics (Top Row)

| Metric | Description | Reveal Thresholds |
|--------|-------------|-------------------|
| **Exchanges** | Number of chat messages sent | 5+ triggers simulation reveal |
| **Journeys** | Completed narrative journeys | 1+ triggers simulation reveal |
| **Topics** | Unique topics explored | Used for depth tracking |
| **Minutes** | Time spent active in session | 3+ triggers simulation reveal |

#### Reveal Queue

Shows which reveals are waiting to be displayed:
- **Empty**: No reveals pending - thresholds not met yet
- **Items shown**: Reveals that should display (in priority order)

**If reveals appear here but users don't see them**, this indicates BUG-003 - the React components aren't responding to queue updates.

#### Reveals Shown

Historical record of which reveals have been displayed this session:
- `simulation` - The "you're in a simulation" reveal
- `customLensOffer` - Offer to create personalized lens
- `terminatorPrompt` - Unlock "no guardrails" mode
- `founderStory` - Personal narrative from founder
- `conversionCTA` - Final call-to-action

**If this is empty despite high engagement**, reveals are being queued but not shown (see Known Bugs).

#### Event Log

Live stream of engagement events (most recent at top):
- **Timestamp**: When the event occurred
- **Type**: Event name (e.g., `EXCHANGE_SENT`, `CARD_VISITED`)
- **Payload**: Event data (query text, card IDs, etc.)

Events you should see during normal usage:
- `EXCHANGE_SENT` - Each time user sends a message
- `CARD_VISITED` - Each time user clicks a narrative card
- `LENS_SELECTED` - When user picks or changes a lens
- `JOURNEY_STARTED` - When a new narrative thread begins

---

### Triggers Tab

Configure when reveals appear. Each trigger card shows:

#### Trigger Card Elements

- **Reveal Name** (green text): Which reveal this triggers
- **Priority**: Lower numbers fire first (100 = high priority)
- **Enabled Checkbox**: Toggle trigger on/off
- **Conditions Preview**: JSON snippet of the trigger logic

#### Default Trigger Conditions

| Reveal | Default Conditions |
|--------|-------------------|
| `simulation` | 5+ exchanges OR 3+ minutes OR 1+ journey |
| `customLensOffer` | Simulation acknowledged AND no custom lens |
| `terminatorPrompt` | 2+ journeys AND custom lens exists |
| `founderStory` | 3+ journeys completed |
| `conversionCTA` | 5+ journeys OR 30+ minutes |
| `journeyCompletion` | Any journey completed |

**Note**: Changes in the admin console currently apply only to the current session. Persistent configuration requires code changes to `utils/engagementTriggers.ts`.

---

### Simulate Tab

Manually trigger events to test the system without real user interaction.

#### Available Simulation Buttons

| Button | What It Does |
|--------|--------------|
| **Send Exchange** | Simulates a user sending a chat message (+1 exchange) |
| **Complete Journey** | Simulates completing a narrative journey |
| **Explore Topic** | Adds a new topic to explored topics |
| **+3 Minutes** | Advances the active time by 3 minutes |
| **Select Custom Lens** | Simulates selecting a custom lens |
| **Reset All** | Clears all engagement state (starts fresh) |

#### Testing Reveal Triggers

1. Click **Send Exchange** 5 times
2. Check the **REVEAL QUEUE** section
3. Should see `simulation` appear in the queue
4. If it appears but user doesn't see it = BUG-003

#### State Snapshot

Shows the raw JSON of current engagement state:

```json
{
  "sessionId": "abc123...",
  "exchangeCount": 5,
  "journeysCompleted": 0,
  "minutesActive": 2,
  "topicsExplored": [],
  "cardsVisited": [],
  "revealsShown": [],
  "acknowledgedReveals": [],
  "hasCustomLens": false,
  "lastActivity": 1734300000000
}
```

---

## Troubleshooting

### "Metrics are updating but reveals never appear"

**Symptom**: Exchange count, journeys, etc. increase but user never sees reveal overlays.

**Diagnosis**:
1. Open Simulate tab
2. Click buttons to meet thresholds
3. Check if REVEAL QUEUE populates

**If queue populates** but reveals don't show: This is BUG-003 - the React render cycle isn't responding to queue changes. The `useEngagementBridge` hook computes `shouldShowSimReveal` but `Terminal.tsx` isn't acting on it.

**If queue stays empty**: Triggers aren't evaluating. Check:
- Are triggers enabled in Triggers tab?
- Does STATE SNAPSHOT show correct values?
- Is `evaluateTriggers()` being called?

### "Custom Lens Offer never appears"

This is BUG-001. The custom lens offer requires:
1. Simulation reveal to be shown first
2. User to acknowledge (click Continue on) the simulation reveal
3. `hasCustomLens` to be false

Check:
- Is `simulation` in `acknowledgedReveals` array?
- Does `customLensOffer` appear in REVEAL QUEUE?

### "Events aren't logging"

If the Event Log is empty during normal usage:
1. Verify `emit.` calls exist in Terminal.tsx
2. Check browser console for errors
3. The singleton might not be initializing

### "State doesn't persist after refresh"

This is expected behavior currently. State persists in `localStorage` under:
- `grove-engagement-state` - Current metrics
- `grove-event-history` - Event log

If these don't exist, the bus isn't saving state.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              User Interactions                   │
│  (chat, card clicks, lens selection, time)       │
└──────────────────────┬──────────────────────────┘
                       │ emit events
                       ▼
┌─────────────────────────────────────────────────┐
│           EngagementBusSingleton                │
│  - Receives events                               │
│  - Updates state (exchangeCount, etc.)           │
│  - Evaluates triggers                            │
│  - Queues reveals                                │
└──────────────────────┬──────────────────────────┘
                       │ notifies subscribers
                       ▼
┌─────────────────────────────────────────────────┐
│              React Hooks                         │
│  - useEngagementState() reads state              │
│  - useRevealQueue() reads queue                  │
│  - useEngagementBridge() provides API            │
└──────────────────────┬──────────────────────────┘
                       │ computed booleans
                       ▼
┌─────────────────────────────────────────────────┐
│              Terminal.tsx                        │
│  - shouldShowSimReveal boolean                   │
│  - useEffect triggers overlay render             │
│  - <SimulationReveal /> component                │
└─────────────────────────────────────────────────┘
```

**Current Bug Location**: The connection between "React Hooks" and "Terminal.tsx" is broken. The hooks compute the correct booleans, but the Terminal doesn't respond.

---

## Related Documentation

- `docs/KNOWN_BUGS.md` - Current bug list with root causes
- `docs/ENGAGEMENT_BUS_INTEGRATION.md` - Developer integration guide
- `ARCHITECTURE_NOTES.md` - Full system architecture

---

*Last updated: December 16, 2025 (Sprint 8)*
