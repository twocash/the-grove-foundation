# SPEC: Explore Pool Filtering v1

**Sprint ID:** `explore-pool-filtering-v1`
**Branch:** `bedrock`
**Created:** 2026-01-09
**Author:** Claude (Planning) / Jim Calhoun (Direction)

---

## Problem Statement

The `/explore` route currently draws navigation prompts from a mixed pool that includes legacy "library" prompts (shipped with Grove MVP). These legacy prompts cause architectural drift, pulling the experience away from the clean DEX/Trellis 1.0 system.

Additionally, users sometimes see the same prompt suggested repeatedly in quick succession, creating a poor experience.

**User Stories:**
1. As an admin, I want to toggle off library prompts in `/explore` so the experience uses only DEX-compliant prompts
2. As a user, I want prompts to rotate naturally without seeing the same suggestion twice in a row

---

## Domain Contract

**Applicable contract:** Bedrock Sprint Contract
**Contract version:** 1.0
**Additional requirements:** Strangler fig compliance (no destruction of legacy code)

---

## Solution Overview

### 1. DEX Mode Toggle (Header UI)

Add a `DEX` toggle pill in `KineticHeader.tsx` alongside existing RAG and JOURNEY toggles:

```
[Explore The Grove] [🔍 Exploring • 5] [● RAG ON] [● JOURNEY ON] [● DEX ON]
```

- **ON (default):** Excludes prompts with `source === 'library'`
- **OFF:** Includes all prompts (legacy behavior for testing)

### 2. History Filter (Repetition Prevention)

Add universal filtering in `useNavigationPrompts.ts` to exclude prompts the user has already selected, using `context.promptsSelected` from the 4D engagement state.

### 3. Feature Flag Registration

Register `dex-mode` in `DEFAULT_FEATURE_FLAGS` for admin control, while UI toggle uses localStorage for user preference (matching RAG/JOURNEY pattern).

---

## Architecture

### Existing Pattern: Header Toggles

The existing RAG and JOURNEY toggles in `KineticHeader.tsx` use this pattern:
- State managed in `ExploreShell.tsx` via `useState` + localStorage
- Passed as props to `KineticHeader`
- Toggle callback passed down for user interaction

**Extension:** Add a third toggle (`dexMode`) following identical pattern.

### Existing Pattern: Prompt Filtering

`useNavigationPrompts.ts` already filters by:
- `meta.status === 'active'`
- Library prompt status overrides (localStorage)
- Genesis phase (interaction count)

**Extension:** Add two new filters:
1. Source filter: `payload.source !== 'library'` (when DEX mode ON)
2. History filter: `!context.promptsSelected.includes(id)`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/surface/components/KineticStream/KineticHeader.tsx` | Add DEX toggle UI |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Add dexMode state + toggle handler |
| `src/explore/hooks/useNavigationPrompts.ts` | Add source filter + history filter |
| `src/data/narratives-schema.ts` | Register `dex-mode` feature flag |
| `src/core/config/defaults.ts` | Add to DEFAULT_FEATURE_FLAGS |

---

## DEX Compliance Matrix

| Principle | How This Sprint Satisfies |
|-----------|--------------------------|
| **Declarative Sovereignty** | Toggle is user preference (localStorage), not hardcoded behavior |
| **Capability Agnosticism** | Filters work regardless of prompt source or model |
| **Provenance** | Prompts retain source attribution; filter is transparent |
| **Organic Scalability** | Toggle allows gradual migration; no destruction of legacy |

---

## Testing Strategy

### Unit Tests
- `useNavigationPrompts` returns only non-library prompts when dexMode=true
- `useNavigationPrompts` excludes prompts in `promptsSelected` history

### E2E Tests
- Toggle DEX pill → prompts change (no library prompts visible)
- Submit multiple prompts → no repeated suggestions

### Manual Verification
- Fresh session in incognito
- Toggle DEX ON/OFF → observe prompt pool changes
- Click through 5+ prompts → never see same prompt twice

---

## Success Criteria

1. ✅ DEX toggle visible in header next to JOURNEY pill
2. ✅ DEX ON excludes all `source: 'library'` prompts from pool
3. ✅ Previously selected prompts never re-appear in suggestions
4. ✅ Legacy library prompts survive (strangler fig compliance)
5. ✅ Toggle state persists across page refreshes (localStorage)

---

## Out of Scope

- Moving feature flags to `/experiences` route (future sprint)
- Deleting legacy prompt files
- Admin UI for feature flag management
- Telemetry for DEX mode usage

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Empty prompt pool if all prompts are library | Genesis prompts are `source: 'user'`; Supabase prompts exist |
| History filter too aggressive | Only filters `promptsSelected`, not all impressions |
| Toggle state confusion | Clear visual feedback (green = ON) matches existing pills |
