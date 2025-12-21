# Sprout System Specification

## Overview
The Sprout System transforms the Grove Terminal from a content delivery interface into a content refinement engine. Users can capture valuable LLM responses as "sprouts" that enter a lifecycle toward potential inclusion in the Knowledge Commons.

## Goals
1. Enable users to capture LLM responses via `/sprout` command with zero friction
2. Preserve sprouts verbatim with full generation context (provenance)
3. Provide `/garden` modal for quick view of session contributions
4. Extend `/stats` page with sprout statistics and feedback loop
5. Design data model that supports future Grove ID and Knowledge Commons integration

## Non-Goals
- Server-side sprout storage (MVP uses localStorage)
- Grove ID integration (future phase)
- Admin review/promotion workflow (future phase)
- Network-wide sprout propagation (future phase)
- Credit/attribution system (future phase)

## Current State Inventory

### Command System
- **Location:** `components/Terminal/CommandInput/CommandRegistry.ts`
- **Current behavior:** Registers slash commands, handles execution
- **Existing commands:** `/help`, `/journeys`, `/stats`, `/lens`, `/welcome`

### Stats Modal
- **Location:** `components/Terminal/Modals/StatsModal.tsx`
- **Current behavior:** Shows engagement level, streaks, journey progress
- **Issues:** No sprout/contribution tracking

### Message State
- **Location:** `components/Terminal.tsx:225`
- **Current behavior:** Messages in React state, not easily accessible from commands
- **Issues:** Commands don't have direct access to last response

## Target State

### Command System
- **New commands:** `/sprout`, `/garden`
- **Enhanced context:** Access to last response and generation metadata

### Garden Modal
- **New component:** `GardenModal.tsx`
- **Behavior:** Quick view of session sprouts, link to full stats

### Stats Modal
- **Extended:** New "Garden" section showing sprout lifecycle
- **Feedback:** Notifications when sprouts advance

### Sprout Storage
- **MVP:** localStorage with `grove-sprouts` key
- **Schema:** Full provenance chain preserved

## Acceptance Criteria

### Functional
- [ ] AC-1: `/sprout` captures last bot response with toast confirmation
- [ ] AC-2: `/sprout --tag=X` associates sprout with topic hub
- [ ] AC-3: `/sprout --note="X"` adds human annotation
- [ ] AC-4: `/garden` opens modal showing session sprouts
- [ ] AC-5: `/stats` shows sprout statistics in new Garden section
- [ ] AC-6: Sprouts persist in localStorage across sessions
- [ ] AC-7: Sprout includes provenance: query, persona, journey, hub, RAG files

### Visual
- [ ] AC-8: Garden modal matches existing modal styling
- [ ] AC-9: Sprout count visible in stats engagement badge
- [ ] AC-10: Toast uses 🌱 emoji for brand consistency

### Performance
- [ ] AC-11: Build completes without errors
- [ ] AC-12: No console errors in browser
- [ ] AC-13: localStorage operations don't block UI

### Quality
- [ ] AC-14: Sprout type exported from schema
- [ ] AC-15: Hook follows existing patterns (useXxx naming)

## Dependencies
- Existing command registry infrastructure (v0.16)
- Existing stats modal and hook
- localStorage (browser API)

## Risks
- **Risk 1:** Command context doesn't expose last message
  - **Mitigation:** Extend CommandContext interface or use ref
- **Risk 2:** RAG context not available client-side
  - **Mitigation:** Store basic context (persona, journey) initially
