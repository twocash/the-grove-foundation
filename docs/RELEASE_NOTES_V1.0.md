# Grove Research Pipeline v1.0 - Release Notes

**Release Date:** 2026-01-14
**Codename:** Research Lifecycle 1.0

---

## Overview

The Grove Research Pipeline v1.0 transforms natural language questions into fully-cited research documents through a multi-agent architecture. This release marks the completion of the core research lifecycle from spark to scholarship.

---

## Features

### Research Agent
- Multi-branch parallel evidence collection
- Web search integration via Gemini Grounding API
- Relevance scoring and confidence metrics
- Source provenance tracking with URL verification
- Automatic query decomposition into research branches

### Writer Agent
- Evidence-to-prose transformation with Grove voice
- Configurable citation style and academic tone
- Inline citation linking with `[1]` notation
- Automatic summarization and position synthesis
- Limitations disclosure when evidence is partial

### Knowledge Base Integration
- One-click corpus promotion via "Add to KB" button
- Full provenance chain preservation
- Automatic embedding generation pipeline
- Toast feedback with "View in Corpus" action
- Research documents become reusable knowledge

### Progress Streaming UI
- Real-time phase indicators (Research → Writing → Complete)
- Branch completion tracking with visual progress
- Source discovery animation as evidence found
- Error state visualization with user-friendly messages
- Phase transition animations

### Results Display
- Position statement highlighting with confidence badge
- Markdown analysis rendering with inline citations
- Expandable citations section with source links
- Copy to clipboard functionality
- Mobile responsive layout
- Insufficient evidence handling

### Error Handling (v1.0 Polish)
- Timeout error display with retry option
- Empty state with query suggestions
- Partial results banner for failed branches
- Network error recovery UI
- Skeleton loading during data fetch

---

## Sprints Completed

| Sprint | Feature | Key Deliverables |
|--------|---------|------------------|
| 1 | Evidence Collection Engine | Research agent, search integration |
| 2 | Writer Agent Foundation | Document generation, citation linking |
| 3 | Pipeline Integration | Orchestration, progress streaming |
| 4 | Progress Streaming UI | Real-time progress, phase indicators |
| 5 | Results Display | Position card, analysis section, citations |
| 6 | Knowledge Base Integration | KB button, provenance, embedding trigger |
| 7 | Polish and Demo Prep | Error handling, demo video, release notes |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER QUERY (Spark)                        │
│         "What are the implications of local AI?"             │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   PROMPT ARCHITECT                           │
│   Infers research branches, validates scope, creates plan    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESEARCH AGENT                            │
│   Parallel branch execution, source discovery, evidence      │
│   collection, relevance scoring                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     WRITER AGENT                             │
│   Evidence synthesis, position formulation, citation         │
│   linking, document generation                               │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  RESEARCH DOCUMENT                           │
│   Position · Analysis · Citations · Limitations              │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   KNOWLEDGE BASE                             │
│   Corpus promotion, embedding, future retrieval              │
└─────────────────────────────────────────────────────────────┘
```

---

## Known Limitations

| Limitation | Details |
|------------|---------|
| Timeout | 90 second overall execution limit |
| API Calls | Max 20 calls per execution |
| Gemini Quota | Subject to model-specific rate limits |
| Query Scope | Very broad queries may timeout |
| Document Length | May truncate at ~5000 words |
| Languages | Optimized for English queries |

See `docs/sprints/polish-demo-prep-v1/LIMITATIONS.md` for full details.

---

## Demo Video

Generated via Playwright automated testing:
```
test-results/research-lifecycle-demo-*/video.webm
```

Demo script available at:
```
docs/sprints/polish-demo-prep-v1/DEMO_SCRIPT.md
```

---

## Bug Fixes in This Release

### KB Integration Embedding Trigger
- **File:** `src/core/data/adapters/supabase-adapter.ts`
- **Issue:** Sent `documentId` (singular) but API expected `documentIds` (array)
- **Fix:** Changed to `documentIds: [documentId]`
- **Impact:** Research documents now correctly trigger embedding pipeline

---

## Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| Search API timeout with retry | PASS |
| No results helpful message | PASS |
| Partial evidence produces document | PASS |
| Progress indicators visible | PASS |
| Demo video recorded | PASS |
| KB Integration embedding fix | PASS |
| Skeleton loading UI | PASS |
| Known limitations documented | PASS |

---

## Files Changed (Sprint 7)

### New Components
- `src/explore/components/ErrorDisplay.tsx`
- `src/explore/components/EmptyState.tsx`
- `src/explore/components/PartialResultsBanner.tsx`
- `src/explore/components/SkeletonCard.tsx`

### Modified Components
- `src/explore/components/ResearchProgressView.tsx` (PhaseProgressBar)
- `src/core/data/adapters/supabase-adapter.ts` (bug fix)

### New Documentation
- `docs/RELEASE_NOTES_V1.0.md` (this file)
- `docs/sprints/polish-demo-prep-v1/DEMO_SCRIPT.md`
- `docs/sprints/polish-demo-prep-v1/LIMITATIONS.md`

### New Tests
- `tests/demo/research-lifecycle-demo.spec.ts`
- `playwright.config.ts` (demo project with video)

---

## Contributors

- Research Lifecycle Developer Agent
- Sprintmaster Coordinator
- Test Infrastructure Agent

---

## What's Next

- User acceptance testing with demo video
- Production deployment to Cloud Run
- Monitoring and feedback collection
- v1.1 planning based on user feedback

---

Co-Authored-By: Claude <noreply@anthropic.com>
