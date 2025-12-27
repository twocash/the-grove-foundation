# Migration Map — adaptive-engagement-v1

**Sprint:** `adaptive-engagement-v1`  
**Created:** 2025-12-27

---

## Overview

This map defines the file-by-file execution order for implementing adaptive engagement. Each phase is independently deployable with its own build gate.

---

## Phase 1: Session Telemetry Infrastructure

**Goal:** Create telemetry collection and storage foundation.

### Files to Create

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 1.1 | `src/core/schema/session-telemetry.ts` | Type definitions | None |
| 1.2 | `src/lib/telemetry/stage-computation.ts` | Stage calculation | 1.1 |
| 1.3 | `src/lib/telemetry/storage.ts` | localStorage persistence | 1.1 |
| 1.4 | `src/lib/telemetry/collector.ts` | TelemetryCollector class | 1.1, 1.2, 1.3 |
| 1.5 | `src/lib/telemetry/index.ts` | Barrel export | 1.1-1.4 |
| 1.6 | `hooks/useSessionTelemetry.ts` | React hook | 1.5 |

### Verification

```bash
# Unit tests pass
npm test -- --grep "telemetry"

# TypeScript compiles
npm run build

# Manual: Check localStorage contains telemetry
```

---

## Phase 2: Adaptive Prompts

**Goal:** Create stage-aware prompt system.

### Files to Create

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 2.1 | `src/core/schema/suggested-prompts.ts` | Prompt type definitions | None |
| 2.2 | `src/data/prompts/stage-prompts.ts` | Stage prompt config | 2.1 |
| 2.3 | `hooks/useSuggestedPrompts.ts` | Prompt selection hook | 1.6, 2.1, 2.2 |

### Files to Modify

| Order | File | Changes |
|-------|------|---------|
| 2.4 | `components/Terminal/TerminalWelcome.tsx` | Use `useSuggestedPrompts()` |

### Verification

```bash
# Build passes
npm run build

# E2E: New user sees ARRIVAL prompts
npx playwright test --grep "adaptive prompts"
```

---

## Phase 3: Journey Framework

**Goal:** Create declarative journey system with implicit entry.

### Files to Create

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 3.1 | `src/core/schema/journey.ts` | Journey/waypoint types | None |
| 3.2 | `src/data/journeys/grove-fundamentals.ts` | First journey | 3.1 |
| 3.3 | `src/data/journeys/index.ts` | Journey registry | 3.2 |
| 3.4 | `hooks/useJourneyProgress.ts` | Journey tracking hook | 1.6, 3.1, 3.3 |
| 3.5 | `components/Terminal/JourneyProgressIndicator.tsx` | Progress UI | 3.4 |
| 3.6 | `components/Terminal/JourneyCompletionCard.tsx` | Completion UI | 3.4 |

### Verification

```bash
# Build passes
npm run build

# E2E: Journey progress tracks
npx playwright test --grep "journey"
```

---

## Phase 4: Server Persistence

**Goal:** Sync telemetry to Supabase for cross-device continuity.

### Database Migrations

| Order | Action | SQL |
|-------|--------|-----|
| 4.0a | Create session_telemetry table | See ARCHITECTURE.md |
| 4.0b | Create journey_progress table | See ARCHITECTURE.md |

### Files to Create

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 4.1 | `src/lib/telemetry/server-sync.ts` | Supabase sync logic | 1.5, lib/supabase.js |

### Files to Modify

| Order | File | Changes |
|-------|------|---------|
| 4.2 | `server.js` | Add telemetry API routes |
| 4.3 | `src/lib/telemetry/storage.ts` | Add server sync calls |

### Verification

```bash
# Server starts without errors
npm run dev

# API responds
curl http://localhost:3000/api/telemetry/session

# Build passes
npm run build
```

---

## Phase 5: Lens Integration

**Goal:** Wire lens context to prompt selection.

### Files to Modify

| Order | File | Changes |
|-------|------|---------|
| 5.1 | `hooks/useSuggestedPrompts.ts` | Accept lensId, filter by affinity |
| 5.2 | `components/Terminal/TerminalWelcome.tsx` | Pass lens context |
| 5.3 | `src/data/prompts/stage-prompts.ts` | Add lens affinity/exclude |

### Verification

```bash
# Build passes
npm run build

# E2E: Lens switch updates prompts
npx playwright test --grep "lens.*prompt"
```

---

## Phase 6: Chat Integration

**Goal:** Track exchanges and topics from chat.

### Files to Modify

| Order | File | Changes |
|-------|------|---------|
| 6.1 | Chat handler (identify exact file) | Emit exchange event |
| 6.2 | Navigation handler (if applicable) | Emit topic event |
| 6.3 | `hooks/useSproutStorage.ts` | Emit sprout event |

### Verification

```bash
# Build passes
npm run build

# E2E: Stage advances on engagement
npx playwright test --grep "stage advancement"
```

---

## Rollback Plan

### Per-Phase Rollback

| Phase | Rollback Action |
|-------|-----------------|
| 1 | Delete `src/lib/telemetry/`, `hooks/useSessionTelemetry.ts` |
| 2 | Revert TerminalWelcome.tsx, delete prompt files |
| 3 | Delete journey files and hooks |
| 4 | Drop Supabase tables, remove server routes |
| 5 | Revert lens integration changes |
| 6 | Revert chat handler changes |

### Full Rollback

```bash
git revert HEAD~N  # Where N is commits since sprint start
# OR
git checkout main -- components/Terminal/TerminalWelcome.tsx
git checkout main -- hooks/useSproutStorage.ts
rm -rf src/lib/telemetry src/data/prompts src/data/journeys
rm hooks/useSessionTelemetry.ts hooks/useSuggestedPrompts.ts hooks/useJourneyProgress.ts
```

---

## File Dependency Graph

```
                    session-telemetry.ts (schema)
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    stage-computation.ts  storage.ts   suggested-prompts.ts
            │               │               │
            └───────┬───────┘               │
                    ▼                       │
              collector.ts                  │
                    │                       │
                    ▼                       ▼
            useSessionTelemetry.ts   stage-prompts.ts
                    │                       │
                    └───────────┬───────────┘
                                ▼
                      useSuggestedPrompts.ts
                                │
                                ▼
                      TerminalWelcome.tsx
```

---

## Build Gates Summary

| Phase | Gate Command | Expected Result |
|-------|--------------|-----------------|
| 1 | `npm run build && npm test` | Pass, telemetry types work |
| 2 | `npm run build` | Pass, prompts render |
| 3 | `npm run build` | Pass, journey UI renders |
| 4 | `npm run dev` | Server starts, API responds |
| 5 | `npm run build` | Pass, lens integration works |
| 6 | `npm run build` | Pass, events flow |

---

*Foundation Loop v2.0 — Phase 4: Migration Planning*
