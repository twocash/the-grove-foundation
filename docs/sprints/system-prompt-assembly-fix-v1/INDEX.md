# Sprint Index: system-prompt-assembly-fix-v1

**Status:** READY FOR EXECUTION  
**Date:** January 10, 2026

---

## Sprint Artifacts

| Phase | Artifact | Status |
|-------|----------|--------|
| 0 | Pattern Check | ✅ Documented in SPEC.md |
| 0.5 | Canonical Source Audit | ✅ Documented in SPEC.md |
| 1 | [REPO_AUDIT.md](./REPO_AUDIT.md) | ✅ Complete |
| 2 | [SPEC.md](./SPEC.md) | ✅ Complete |
| 3 | [ARCHITECTURE.md](./ARCHITECTURE.md) | ✅ Complete |
| 4 | [MIGRATION_MAP.md](./MIGRATION_MAP.md) | ✅ Complete |
| 5 | [DECISIONS.md](./DECISIONS.md) | ✅ Complete |
| 6 | [SPRINTS.md](./SPRINTS.md) | ✅ Complete |
| 7 | [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | ✅ Complete |
| 8 | DEVLOG.md | 🔜 Created during execution |

---

## Quick Summary

**Problem:** `/explore` route ignores `closingBehavior: 'open'` from Supabase. LLM ends responses with questions.

**Solution:** Modify `server.js` to return behavioral metadata from `fetchActiveSystemPrompt()` and use it as defaults in `buildSystemPrompt()`.

**Scope:** Single file change (`server.js`), ~11 edits, 1-2 hours estimated.

---

## Handoff Command

```
Read C:\GitHub\the-grove-foundation\docs\sprints\system-prompt-assembly-fix-v1\EXECUTION_PROMPT.md and implement the changes.
```

---

## Domain Contract

**Applicable:** BEDROCK_SPRINT_CONTRACT.md v1.1  
**Type:** Core infrastructure fix (Article VI Section 6.3)

---

*Sprint planning complete. Ready for Claude Code execution.*
