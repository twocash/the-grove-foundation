# Production Hotfix Session - 2026-01-30

**Status:** COMPLETE
**Duration:** ~2 hours
**Agent:** Claude Opus 4.5

---

## Summary

Emergency production debugging and fixes for 1.0 release checkpoint. All critical issues resolved.

## Issues Fixed

### 1. Missing RPC Functions (404 Error)
**Symptom:** `POST .../rpc/get_active_writer_agent_config 404 (Not Found)`

**Root Cause:** Migration 012 was partially applied - tables and triggers created, but RPC helper functions at end of migration were never created.

**Fix:** Applied migration `012_agent_configs_rpc_functions` to create:
- `get_active_research_agent_config()`
- `get_active_writer_agent_config()`

### 2. Status Constraint Violation (400 Error)
**Symptom:** `research_sprouts_status_check constraint violation`

**Root Cause:** Code expects `'promoted'` status but database constraint only allowed: `pending, active, paused, blocked, completed, archived`

**Fix:** Applied migration `add_promoted_status_to_research_sprouts` to add `'promoted'` to allowed values.

### 3. Missing Anthropic API Key (503 Error)
**Symptom:** `ANTHROPIC_API_KEY environment variable is not set`

**Root Cause:** Secret never added to GCP Secret Manager or GitHub Actions deploy.

**Fix:**
- Created `ANTHROPIC_API_KEY` secret in GCP Secret Manager
- Updated `deploy.yml` to mount all required secrets:
  - `GEMINI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`

### 4. Frontend Supabase Config (Build-time vars)
**Symptom:** `Supabase URL configured: false`

**Root Cause:** `VITE_*` variables must be passed at Docker build time, not runtime.

**Fix:** Updated `cloudbuild.yaml` to pass build args:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## E2E Test Results (Production)

| Test Suite | Result |
|------------|--------|
| Smoke Tests | 7/7 passed |
| Writer Pipeline | 2/2 passed |
| Bedrock Debug | 1/1 passed |
| Nursery Core | 7/11 passed |
| Research Lifecycle | 1/2 passed |

**Production Status:** HEALTHY

## Commits

1. `217625a` - fix(config-loader): Use RPC functions for JSONB queries
2. `56fe4e3` - fix(cloudbuild): Add Supabase build args and Anthropic secret
3. `0a8c93b` - fix(deploy): Add Supabase and Anthropic secrets to Cloud Run deployment

## Database Migrations Applied

1. `012_agent_configs_rpc_functions` - Missing RPC functions
2. `add_promoted_status_to_research_sprouts` - Status constraint fix

## Files Modified

- `.github/workflows/deploy.yml`
- `cloudbuild.yaml`
- `src/explore/services/config-loader.ts`
- `src/explore/utils/notion-export.ts`

---

**Next Steps:** Production is stable for 1.0 release. Grove Network vision document published to Notion for future planning.
