# CONTINUATION_PROMPT.md

Copy everything below this line into a new Claude context window:

---

## Session Continuation: Grove Development Sprint Planning

I'm continuing a productive development session for The Grove AI Foundation project. I need to plan and potentially execute the next sprint: `moment-ui-integration-v1`.

### Quick Context

**Repository:** `C:\GitHub\the-grove-foundation`

**What just completed:**
- `kinetic-context-v1` sprint (commit ad0b8b7) - Created KineticHeader, KineticWelcome
- `engagement-orchestrator-v1` sprint (commit c1df11b) - Created declarative moment system with:
  - Moment schema following GroveObject pattern
  - Trigger evaluator with stage/range/flag/schedule logic
  - 5 moment JSON files (welcome, simulation-reveal, custom-lens-offer, entropy-journey, first-sprout)
  - useMoments hook + MomentRenderer components
  - XState integration with flags/cooldowns
  - @data path alias configured

**What's next:**
- `moment-ui-integration-v1` - Wire moments to actual UI surfaces

### Critical Handoff Document

Please read this first:
```
docs/sprints/SESSION_HANDOFF_2024-12-29.md
```

This contains:
- Full architectural context
- Key decisions made (ADR-012: GroveObject pattern, ADR-013: file-based storage)
- Known limitations (journey start is TODO stub)
- Expected files from engagement-orchestrator-v1
- Next sprint scope outline

### Sprint Documentation to Review

The engagement-orchestrator-v1 sprint docs are the foundation for this next sprint:
```
docs/sprints/engagement-orchestrator-v1/
├── SPEC.md           # Full schema + component specs
├── ADR.md            # Architecture decisions
├── MIGRATION_MAP.md  # File structure
└── FOUNDATION_LOOP.md # Summary
```

### Key Schema Pattern

Moments follow `GroveObject<MomentPayload>`:
```typescript
// Access pattern (important!)
moment.meta.id          // NOT moment.id
moment.meta.status      // 'active' | 'draft' | 'archived'
moment.payload.trigger  // NOT moment.trigger
moment.payload.surface  // 'overlay' | 'inline' | 'welcome' | 'toast' | etc.
moment.payload.actions  // Array of MomentAction
```

### First Steps

1. **Read the handoff doc:**
```bash
cat docs/sprints/SESSION_HANDOFF_2024-12-29.md
```

2. **Quick verification (optional):**
```bash
cd C:\GitHub\the-grove-foundation
npm run typecheck
ls src/data/moments/core/
```

3. **Plan moment-ui-integration-v1** - Run Foundation Loop to create sprint artifacts

### What I Need Help With

1. **Plan moment-ui-integration-v1** - Run Foundation Loop to create sprint artifacts
2. **Key focus areas:**
   - Wire MomentOverlay to ExploreShell for overlay moments (simulation-reveal)
   - Connect KineticWelcome to useMoments({ surface: 'welcome' })
   - Add MomentInline injection to stream
   - Wire startJourney action to actual journey system (resolve TODO from kinetic-context-v1)
3. **Execute when ready** - Generate EXECUTION_PROMPT.md for Claude Code CLI

### Foundation Loop Process

For new sprints, we follow this artifact sequence:
1. REPO_AUDIT.md - Current state analysis
2. SPEC.md - Technical specification
3. ADR.md - Architecture decisions
4. MIGRATION_MAP.md - File operations
5. STORY_BREAKDOWN.md - Implementation tasks
6. EXECUTION_PROMPT.md - Claude Code handoff
7. DEV_LOG.md - Created during execution
8. FOUNDATION_LOOP.md - Summary

### Project Custom Instructions

This project uses:
- Grove Advisory Council (9 expert perspectives weighted by domain)
- Jim's writing style (strategic, concise, McKinsey-style)
- Skills in `/mnt/skills/user/` especially `grove-foundation-loop`

### Ready?

Please start by reading the handoff document and then begin the Foundation Loop for `moment-ui-integration-v1`. Let's keep the momentum going!
