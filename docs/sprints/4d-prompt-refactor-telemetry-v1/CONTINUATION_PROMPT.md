# Continuation Prompt: 4D Prompt Telemetry Sprint
**Sprint:** 4d-prompt-refactor-telemetry-v1  
**Last Updated:** 2025-01-05

---

## Quick Context

You are continuing implementation of **prompt telemetry infrastructure** for the Grove Terminal. This creates the foundation for data-driven prompt improvement.

**Reference Implementation**: This is building toward Grove 1.0, following Trellis/DEX principles.

**Strangler Fig**: Marketing MVP (Terminal/Foundation) is LIVE—don't break it.

---

## Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| Sprint artifacts | ✅ Complete | 9 documents in `docs/sprints/4d-prompt-refactor-telemetry-v1/` |
| Database schema | 🔲 Not started | `006_prompt_telemetry.sql` |
| Core types | 🔲 Not started | `src/core/telemetry/types.ts` |
| API client | 🔲 Not started | `src/core/telemetry/client.ts` |
| Server endpoints | 🔲 Not started | `server.js` additions |
| React hook | 🔲 Not started | `src/core/telemetry/usePromptTelemetry.ts` |
| Integration | 🔲 Not started | Wire into prompt display |

---

## Next Action

**Start with Story 1.1: Create Telemetry Schema**

1. Create `supabase/migrations/006_prompt_telemetry.sql`
2. Copy schema from `ARCHITECTURE.md` Section 3.1
3. Run `npx supabase db push`
4. Verify table exists

---

## Key Files to Read

**Start here:**
- `docs/sprints/4d-prompt-refactor-telemetry-v1/EXECUTION_PROMPT.md` — Step-by-step guide

**For details:**
- `ARCHITECTURE.md` — Full code specifications
- `SPEC.md` — Requirements and API contracts
- `DECISIONS.md` — Why we made certain choices

**For context:**
- `REPO_AUDIT.md` — Current prompt system inventory
- `SPRINTS.md` — Story breakdown

---

## Attention Anchors

Before each action, verify:

1. **Am I in bedrock?** New code goes in `src/core/telemetry/`
2. **Am I touching MVP?** Don't modify `src/data/prompts/*.json`
3. **Is this non-blocking?** Telemetry failures → log, don't throw
4. **Is this declarative?** Const arrays, not enums

---

## Repository Location

```
C:\GitHub\the-grove-foundation\
├── docs/sprints/4d-prompt-refactor-telemetry-v1/  # Sprint docs
├── src/core/telemetry/                             # NEW: Telemetry module
├── src/data/prompts/                               # DO NOT MODIFY
├── supabase/migrations/                            # Database schemas
└── server.js                                       # API endpoints
```

---

## If You're Confused

1. Read `EXECUTION_PROMPT.md` for step-by-step instructions
2. Check `DEVLOG.md` for what's been done
3. Reference `ARCHITECTURE.md` for exact code patterns
4. Ask: "Does this break the marketing MVP?" (If yes, find another way)

---

## Session Handoff Protocol

When ending a session:

1. Update `DEVLOG.md` with completed work
2. Update status table in this file
3. Note any blockers or open questions
4. Commit with message: `chore(telemetry): [what was done]`
