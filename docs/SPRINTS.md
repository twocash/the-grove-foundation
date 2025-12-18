# SPRINT PLAN

## Sprint Strategy
- **Sprint Count:** 2 (moderate refactor touching engine, UI, admin).【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L185】
- **Definition of Done (per sprint):** Code merged with passing smoke checks, docs updated, and journey UI verified manually.

## Sprint 1: Journey Engine + Terminal Refactor
- **Epic:** Replace V2.0 threads with V2.1 journey navigation in engine and Terminal.
- **Stories:**
  1. **Engine V2.1-only loader** – Enforce schema loading without persona/card backfill; expose journey/node APIs; remove thread generator import.【F:hooks/useNarrativeEngine.ts†L18-L133】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L73-L98】
     - Acceptance: `useNarrativeEngine` surface includes journey state/methods only; localStorage payload excludes thread arrays.
     - Tests: unit coverage for start/advance/exit journey; manual `npm run dev` to verify state initialization.【F:hooks/useNarrativeEngine.ts†L134-L193】【F:package.json†L6-L10】
  2. **Terminal journey panel** – Swap thread-based UI for node-based journey display with primary/alternate navigation; remove suggested topics/lenses and JourneyEnd usage.【F:components/Terminal.tsx†L157-L324】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L108】
     - Acceptance: Journey panel shows current node label/context and advances via buttons; freestyle chat remains functional.
     - Tests: manual `npm run dev` journey traversal; confirm no thread props referenced in render path.【F:package.json†L6-L10】
  3. **Session persistence update** – Migrate session schema to journey fields and ensure entropy bridge still ticks/injects journeys.【F:hooks/useNarrativeEngine.ts†L134-L193】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L73-L86】
     - Acceptance: localStorage keys present without thread data; entropy cooldown/injection works post-migration.
     - Tests: manual conversation to trigger entropy injection; inspect stored session via browser devtools.
- **Done Criteria:** Terminal runs without thread-related errors; engine exports journey-only API; documentation updated.

## Sprint 2: Admin Alignment + Cleanup
- **Epic:** Align admin tools and storage paths to V2.1 and remove remaining V2.0 artifacts.
- **Stories:**
  1. **Admin V2.1 view/editor** – Replace card grid with journey/node/hub view (even read-only) and save V2.1 payloads without card backfill.【F:App.tsx†L90-L200】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】
     - Acceptance: Admin journey data loads/saves without converting to cards; UI no longer crashes on V2.1 schema.
     - Tests: manual save via `/api/admin/narrative` through UI; verify schema shape.
  2. **Dead code removal** – Delete `utils/threadGenerator.ts` and `components/Terminal/JourneyEnd.tsx`; remove imports/usages across repo.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L87-L108】【F:hooks/useNarrativeEngine.ts†L18-L32】
     - Acceptance: Build succeeds without deleted modules; no thread-related references remain.
     - Tests: `npm run build` to confirm clean compile.【F:package.json†L6-L9】
  3. **Docs/telemetry cleanup** – Update docs to reflect V2.1-only runtime and note removed session fields; ensure analytics events align with journey start/completion (no lens-change triggers).【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L155】【F:components/Terminal.tsx†L311-L324】
     - Acceptance: Updated docs merged; analytics journey events fire on journey start/completion only.
     - Tests: manual check in devtools console for analytics logs during journey traversal.
- **Done Criteria:** Admin saves V2.1 structures; repo free of V2.0 thread artifacts; docs current.

## Execution Prompt (for coding agent)
Follow this sequence strictly: audit artifacts already updated; implement Sprint 1 before Sprint 2. Respond in this structure:
1. **Findings:** note files touched and V2.0 artifacts removed/remaining (cite paths).
2. **Planned Changes:** list intended edits with scope and rationale.
3. **Diff Summary:** bullet actual edits per file.
4. **Tests:** commands run with results (include `npm run build` or `npm run dev` smoke as applicable).【F:package.json†L6-L10】
5. **Risks:** known follow-ups or regressions to watch.

Tripwires:
- Do not reintroduce `threadGenerator` or thread-based session fields.
- Ensure lens switching does not reset journey state.
- Reject V2.0 schemas; only journeys/nodes/hubs should drive navigation.
