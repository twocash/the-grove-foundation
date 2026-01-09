# System Prompt Integration v1 — Sprint Index

**Sprint:** system-prompt-integration-v1  
**Tier:** Feature (1-4 hours)  
**Status:** 🟡 Ready for Execution  
**Created:** 2026-01-09

---

## Quick Links

| Artifact | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Goals, acceptance criteria, architecture |
| [MIGRATION.sql](./MIGRATION.sql) | Supabase table creation |
| [SEED_DATA.sql](./SEED_DATA.sql) | Grove Narrator v2.0 seeding |
| **[EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md)** | **Claude Code handoff** |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking |

---

## Sprint Summary

**Objective:** Connect ExperiencesConsole to server via Supabase system_prompts table

**The Problem:**
- ExperiencesConsole writes to Supabase `system_prompts` table
- Server reads from GCS `narratives.json`
- Table doesn't exist → UI is a "ship in a bottle"

**The Fix:**
1. Create `system_prompts` table in Supabase
2. Seed Grove Narrator v2.0 as active prompt
3. Update server to read Supabase first, GCS fallback
4. Add cache invalidation endpoint

**Duration:** ~2 hours

**Success Criteria:**
- Chat at `/explore` uses prompts from Supabase
- ExperiencesConsole manages real system prompts
- Graceful degradation to GCS when Supabase unavailable

---

## How to Execute

### Manual Steps (Supabase Dashboard)
1. Run `MIGRATION.sql` in SQL Editor
2. Run `SEED_DATA.sql` in SQL Editor

### Code Changes (Claude Code CLI)
```bash
cd C:\github\the-grove-foundation
cat docs/sprints/system-prompt-integration-v1/EXECUTION_PROMPT.md
```

Follow the phased execution plan in EXECUTION_PROMPT.md.

---

## DEX Compliance

| Pillar | Status | Implementation |
|--------|--------|----------------|
| Declarative Sovereignty | ✅ | Prompt content in structured payload, assembled by engine |
| Capability Agnosticism | ✅ | Works with any model; prompt is just text |
| Provenance | ✅ | Schema includes created_by_user_id, activated_at |
| Organic Scalability | ✅ | Table supports unlimited prompts, single-active constraint |
