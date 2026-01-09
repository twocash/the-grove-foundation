# Feature: System Prompt Integration v1

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Planning Complete |
| **Status** | 🟡 Ready for Execution |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-09T03:15:00Z |
| **Next Action** | Execute SQL migration in Supabase |
| **Attention Anchor** | Connect ExperiencesConsole to server via Supabase |

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Supabase-backed system prompt storage with GCS fallback
- **Success looks like:** Chat at `/explore` uses prompts managed in ExperiencesConsole
- **We are NOT:** Migrating legacy v1-v9 prompts from GCS
- **Current phase:** Ready for execution
- **Next action:** Run SQL migration in Supabase dashboard

---

## Pattern Check (Abbreviated)

**Existing pattern to extend:** GroveDataProvider / SupabaseAdapter
**Canonical home for this feature:** 
- Server: `server.js` → `fetchActiveSystemPrompt()`
- Client: Already wired via `useGroveData<SystemPromptPayload>('system-prompt')`

The frontend is correctly implemented. The gap is purely server-side: server reads GCS while client writes Supabase.

---

## Goal

Wire ExperiencesConsole to actual system prompt delivery by:
1. Creating `system_prompts` table in Supabase
2. Seeding Grove Narrator v2.0 as active prompt
3. Updating server to read Supabase first, GCS as fallback
4. Adding cache invalidation endpoint

## Non-Goals

- ❌ Migrating v1-v9 from GCS narratives.json (legacy stays legacy)
- ❌ Real-time subscriptions
- ❌ Multi-tenant / user-scoped prompts
- ❌ Provenance UI display (schema supports it, UI deferred)
- ❌ Frontend changes (already correct)

---

## Acceptance Criteria

### Functional Requirements
- [ ] AC-1: `system_prompts` table exists in Supabase with correct schema
- [ ] AC-2: Grove Narrator v2.0 seeded with `status = 'active'`
- [ ] AC-3: Only one prompt can be active (unique constraint)
- [ ] AC-4: Server logs "Loaded from Supabase" when fetching prompt
- [ ] AC-5: Server falls back to GCS when Supabase unavailable
- [ ] AC-6: `/api/cache/invalidate` endpoint returns 200
- [ ] AC-7: Activating prompt in ExperiencesConsole changes chat voice

### DEX Compliance
- [ ] AC-D1: Prompt content assembled from structured payload sections (declarative)
- [ ] AC-D2: Server behavior controlled by `status` field, not hardcoded IDs
- [ ] AC-D3: Fallback chain is configurable (Supabase → GCS → static)

### Test Requirements
- [ ] AC-T1: Manual verification: Chat uses v2.0 voice
- [ ] AC-T2: Manual verification: Create/edit prompt in ExperiencesConsole persists
- [ ] AC-T3: Manual verification: Activate new prompt changes chat behavior
- [ ] AC-T4: Graceful degradation: System never 500s, always has a prompt

---

## Architecture

### Current State (Broken)
```
┌─────────────────────────┐     ┌─────────────────────────┐
│  ExperiencesConsole     │     │  Server /api/chat       │
├─────────────────────────┤     ├─────────────────────────┤
│  Writes: Supabase       │     │  Reads: GCS             │
│  Table: system_prompts  │     │  File: narratives.json  │
│  Status: ❌ NOT EXISTS  │     │  Status: ✅ Working     │
└─────────────────────────┘     └─────────────────────────┘
         ↓                                ↓
    No persistence                   v9 "Added lenses"
```

### Target State
```
┌─────────────────────────┐     ┌─────────────────────────┐
│  ExperiencesConsole     │     │  Server /api/chat       │
├─────────────────────────┤     ├─────────────────────────┤
│  Writes: Supabase       │     │  Reads: Supabase (1st)  │
│  Table: system_prompts  │     │  Fallback: GCS (2nd)    │
│  Status: ✅ EXISTS      │     │  Fallback: Static (3rd) │
└──────────┬──────────────┘     └──────────┬──────────────┘
           │                               │
           └───────────┬───────────────────┘
                       ↓
              ┌─────────────────┐
              │    Supabase     │
              │  system_prompts │
              │  ✅ Source of   │
              │     Truth       │
              └─────────────────┘
```

---

## Implementation Plan

### Step 1: Create Supabase Table

Run in Supabase SQL Editor:

```sql
-- system_prompts table
-- Matches GroveObject<SystemPromptPayload> schema

CREATE TABLE IF NOT EXISTS system_prompts (
  -- Meta fields (GroveObject.meta)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'system-prompt',
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'smart_toy',
  color TEXT,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('active', 'draft', 'archived', 'pending')),
  tags TEXT[] DEFAULT '{}',
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Payload (SystemPromptPayload) - stored as JSONB
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Provenance fields (DEX Pillar III)
  created_by_user_id TEXT,
  updated_by_user_id TEXT,
  activated_by_user_id TEXT,
  activated_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_system_prompts_status ON system_prompts(status);
CREATE INDEX idx_system_prompts_updated_at ON system_prompts(updated_at DESC);

-- Constraint: Only one active prompt at a time
CREATE UNIQUE INDEX idx_system_prompts_single_active 
  ON system_prompts(status) 
  WHERE status = 'active';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_system_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_system_prompts_updated_at();

-- RLS policies
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON system_prompts
  FOR SELECT TO authenticated USING (true);

-- Allow anon to read (for server-side fetch without auth)
CREATE POLICY "Allow anon read" ON system_prompts
  FOR SELECT TO anon USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role all" ON system_prompts
  FOR ALL TO service_role USING (true);
```

### Step 2: Seed Grove Narrator v2.0

See `SEED_DATA.sql` for full INSERT statement with v2.0 payload.

### Step 3: Update server.js

Replace `fetchActiveSystemPrompt()` with Supabase-first implementation.
Add `/api/cache/invalidate` endpoint.

See `EXECUTION_PROMPT.md` for exact code changes.

### Step 4: Verify End-to-End

1. Check server logs for "Loaded from Supabase"
2. Chat at `/explore` - verify voice matches v2.0
3. Create new prompt in ExperiencesConsole
4. Activate it and verify chat changes

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase connection fails | Low | Medium | GCS fallback ensures continuity |
| Schema mismatch payload/assembler | Medium | High | Test with actual v2.0 JSON before deploy |
| RLS blocks server fetch | Low | High | Added `anon` read policy |
| Cache not invalidating | Medium | Low | Manual restart clears cache |

---

## Dependencies

| Resource | Purpose | Status |
|----------|---------|--------|
| Supabase project | Database hosting | ✅ Available |
| GCS bucket | Legacy fallback | ✅ Contains v9 |
| Grove Narrator v2.0 JSON | Seed data | ✅ Uploaded |

---

## Out of Scope

- Frontend changes (already correctly wired)
- Legacy prompt migration
- Real-time subscriptions
- Multi-user prompt management
- Provenance UI display
