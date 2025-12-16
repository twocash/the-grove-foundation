# Engagement Bus Integration Guide

> Sprint 7: Migrating from scattered state to unified Engagement Bus

## Overview

The Engagement Bus provides a centralized, event-driven system for tracking user engagement and triggering reveals. This guide shows how to migrate from the existing `useRevealState` and `useNarrativeEngine` hooks.

## Quick Start

### 1. Use the Bridge Hook (Backward Compatible)

The easiest migration path is to swap `useRevealState` for `useEngagementBridge`:

```tsx
// Before
import { useRevealState } from '../hooks/useRevealState';
const { showSimulationReveal, acknowledgeSimulationReveal } = useRevealState();

// After
import { useEngagementBridge } from '../hooks/useEngagementBridge';
const { showSimulationReveal, acknowledgeSimulationReveal } = useEngagementBridge();
```

The bridge hook provides the same API but uses the Engagement Bus internally.

### 2. Emit Events on User Actions

Instead of calling increment functions, emit events:

```tsx
// Before
incrementJourneysCompleted();

// After
const { emit } = useEngagementEmit();
emit.journeyCompleted(lensId, durationMinutes, cardsVisited);
```

### 3. Track Exchanges

In your chat handler:

```tsx
const { emit } = useEngagementEmit();

const handleSend = async (query: string) => {
  // ... send to API ...
  emit.exchangeSent(query, response.length, currentCardId);
};
```

### 4. Track Card Navigation

```tsx
const { emit } = useEngagementEmit();

const handleCardClick = (card: Card) => {
  emit.cardVisited(card.id, card.label, previousCardId);
  // ... rest of handler
};
```

## Available Hooks

| Hook | Purpose |
|------|---------|
| `useEngagementBus()` | Full API access |
| `useEngagementState()` | Read-only state with auto-updates |
| `useRevealQueue()` | Current reveal queue |
| `useNextReveal()` | Next reveal to show (or null) |
| `useEngagementEmit()` | Convenience emitters |
| `useRevealCheck(type)` | Check if specific reveal should show |
| `useEngagementBridge()` | Backward-compatible bridge |

## Event Types

```typescript
// User actions
emit.exchangeSent(query, responseLength, cardId?)
emit.journeyStarted(lensId, threadLength)
emit.journeyCompleted(lensId, durationMinutes, cardsVisited)
emit.topicExplored(topicId, topicLabel)
emit.cardVisited(cardId, cardLabel, fromCard?)
emit.lensSelected(lensId, isCustom, archetypeId?)

// Reveal lifecycle
emit.revealShown(revealType)
emit.revealDismissed(revealType, action)
```

## Admin Console

Access the Engagement Bridge console at `?admin=true` → Engagement tab:

- **Monitor**: Live metrics, event log, reveal queue status
- **Triggers**: Configure reveal conditions (declarative)
- **Simulate**: Manually emit events for testing

## Configuring Triggers

Triggers are defined declaratively in `utils/engagementTriggers.ts`:

```typescript
{
  id: 'simulation-reveal',
  reveal: 'simulation',
  priority: 100,
  enabled: true,
  conditions: {
    OR: [
      { field: 'journeysCompleted', value: { gte: 1 } },
      { field: 'exchangeCount', value: { gte: 5 } },
      { field: 'minutesActive', value: { gte: 3 } }
    ]
  },
  requiresAcknowledgment: []
}
```

## Migration Checklist

- [x] Replace `useRevealState` with `useEngagementBridge` in Terminal.tsx
- [x] Add `emit.exchangeSent()` call in chat handler
- [x] Add `emit.cardVisited()` call in card navigation
- [x] Add `emit.lensSelected()` call in lens picker
- [x] Add `emit.journeyStarted()` call in thread initialization
- [ ] Test reveal triggers in admin console
- [ ] Remove old state management code (Phase 3)

## Debugging

1. Open admin console (`?admin=true` → Engagement tab)
2. Watch the Event Log in real-time
3. Use Simulate tab to test trigger conditions
4. Check STATE SNAPSHOT for current engagement state
