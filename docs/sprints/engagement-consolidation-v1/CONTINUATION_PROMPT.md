# Continuation Prompt: engagement-consolidation-v1

## For Claude CLI Session Handoff

Copy this to continue in a new session:

```
SPRINT: engagement-consolidation-v1
GOAL: Consolidate EngagementBus and TelemetryCollector into single source of truth

CURRENT STATE:
Check docs/sprints/engagement-consolidation-v1/DEVLOG.md for progress.

KEY FILES:
- Sprint docs: docs/sprints/engagement-consolidation-v1/
- Main execution: EXECUTION_PROMPT.md
- Architecture decisions: DECISIONS.md

PHASE CHECKLIST:
1. Schema Consolidation - Add SessionStage to engagement.ts
2. Utility Migration - Create utils/stageComputation.ts
3. Hook Consolidation - Extend useEngagementBus.ts
4. UI Wiring - Update TerminalWelcome
5. Cleanup - Delete telemetry files
6. Test - Verify all works

If resuming mid-sprint:
1. Read DEVLOG.md to see where we left off
2. Continue from next incomplete phase
3. Update DEVLOG as you progress

COMMANDS:
npm run test -- stageComputation  # Test stage computation
npx tsc --noEmit                   # Type check
npm run build                      # Full build
npm run dev                        # Dev server

After completion:
1. Update DEVLOG.md with final status
2. Commit with message from EXECUTION_PROMPT.md
3. Push to origin
```

---

## Quick Status Check

Run this to see current state:

```bash
# Check if telemetry files still exist
ls -la src/lib/telemetry/ 2>/dev/null || echo "Telemetry directory deleted ✅"

# Check if stage types exist
grep -l "SessionStage" src/core/schema/engagement.ts && echo "Stage types added ✅"

# Check if stage computation exists
ls utils/stageComputation.ts 2>/dev/null && echo "Stage computation created ✅"

# Check localStorage key
# (manual: DevTools → Application → localStorage)
```
