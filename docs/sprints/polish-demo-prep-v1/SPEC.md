# SPEC: Polish and Demo Prep (polish-demo-prep-v1)

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | COMPLETE |
| **Status** | COMPLETE |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-14T00:15:00Z |
| **Next Action** | Record demo video, prepare v1.0 release |
| **Attention Anchor** | Error handling + Demo polish for v1.0 |

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Demo-ready error handling and polish for v1.0 proof of concept
- **Success looks like:** Complete lifecycle from sprout command to rendered document, <90s typical queries, demo video recorded
- **We are NOT:** Adding new features, refactoring architecture, or building infrastructure
- **Current phase:** Ready for Execution
- **Next action:** Implement timeout handling in research pipeline

---

## Constitutional Reference

Per Bedrock Sprint Contract v1.3:

- [x] Read: `docs/BEDROCK_SPRINT_CONTRACT.md` (Binding Contract v1.3)
- [x] Read: `src/explore/services/research-pipeline.ts` — Pipeline to extend
- [x] Read: `src/explore/hooks/useResearchProgress.ts` — Progress state hook
- [x] Read: `src/explore/GardenInspector.tsx` — UI integration point

**Note:** This is a **polish sprint**, not a new feature sprint. Article IX (Visual Verification) applies for UI changes.

---

## Goal

Prepare the Research Pipeline for demo readiness by handling edge cases gracefully, adding professional loading states, and creating demo materials.

## Non-Goals

- New feature development
- Performance optimization beyond timeout handling
- Refactoring core architecture
- Building new infrastructure
- Adding new UI panels or views

## Acceptance Criteria

### P0 (Must Have for Demo)

- [x] Search API timeout displays user-friendly message with retry option
- [x] "No results found" shows helpful message with query suggestions
- [x] Partial evidence (some branches fail) still produces document
- [x] Progress indicators visible during research and writing phases
- [ ] Demo video recorded showing complete lifecycle *(demo script ready, recording pending)*

### P1 (Should Have)

- [x] Writer timeout handled gracefully
- [x] Network disconnection shows reconnection UI
- [x] Skeleton loading UI during initial data fetch
- [x] Known limitations documented

---

## Pattern Check

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Error states | PipelineResult.error | Extend with user-friendly messages |
| Progress events | PipelineProgressEvent | Already exists, enhance UI display |
| Loading states | React Suspense | Use existing patterns |
| Retry mechanism | None | Add retry callback to error handlers |

## Canonical Source Audit

| Capability Needed | Canonical Home | Action |
|-------------------|----------------|--------|
| Error handling | `research-pipeline.ts:369-408` | EXTEND with UI-friendly messages |
| Progress streaming | `PipelineProgressEvent` | USE as-is |
| Loading states | Component-level | CREATE minimal skeleton components |
| Timeout config | `PipelineConfig.timeout` | USE as-is (90s default) |

---

## Technical Context

### Current Error Handling (research-pipeline.ts:369-408)

```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isTimeout = errorMessage.includes('timed out');
  const phase: 'research' | 'writing' | 'timeout' = isTimeout ? 'timeout' : ...;

  return {
    success: false,
    error: { phase, message: errorMessage },
    evidence: evidenceBundle, // Partial results available
  };
}
```

### Progress Events Already Defined

```typescript
export type PipelineProgressEvent =
  | { type: 'phase-started'; phase: 'research' | 'writing' }
  | { type: 'phase-completed'; phase: 'research' | 'writing'; duration: number }
  | { type: 'pipeline-complete'; totalDuration: number }
  | { type: 'pipeline-error'; phase: 'research' | 'writing' | 'timeout'; message: string }
  | ResearchProgressEvent
  | WriterProgress;
```

### Key Files

| File | Purpose |
|------|---------|
| `src/explore/services/research-pipeline.ts` | Main pipeline orchestration |
| `src/explore/services/research-agent.ts` | Research execution |
| `src/explore/services/writer-agent.ts` | Document generation |
| `src/explore/hooks/useResearchProgress.ts` | Progress state hook |
| `src/bedrock/consoles/ExperienceConsole/` | Config editors |

---

## DEX Alignment

| Pillar | How This Sprint Supports |
|--------|-------------------------|
| **Declarative Sovereignty** | Error messages from config, not hardcoded |
| **Capability Agnosticism** | Graceful degradation regardless of API response |
| **Provenance as Infrastructure** | Error events include full context chain |
| **Organic Scalability** | Error handling patterns extensible for future edge cases |
