# Knowledge Architecture v1 — Deployment Guide

> **Status:** Ready for deployment
> **Commit:** `8b4f6f4` (Refactor: Knowledge Architecture Rationalization)
> **Date:** 2025-12-21

This guide walks through activating the new split knowledge architecture in production.

---

## Overview

The codebase now contains a split file architecture that separates the monolithic `narratives.json` into domain-specific files. The server includes backward-compatible fallback logic:

1. **Try new structure first** → Load from `knowledge/`, `exploration/`, `infrastructure/`
2. **Fall back to legacy** → If new files missing, use `narratives.json`

To activate the new architecture, upload the new files to GCS.

---

## Prerequisites

- Google Cloud SDK installed and authenticated
- Access to the `grove-assets` GCS bucket
- Terminal with `gcloud` and `gsutil` commands available

### Verify Authentication

```bash
# Check current auth
gcloud auth list

# If needed, authenticate
gcloud auth login

# Set project (if not default)
gcloud config set project <your-project-id>
```

---

## Step 1: Verify Local Files

Before uploading, confirm all files exist and are valid:

```bash
# Navigate to repository root
cd C:\GitHub\the-grove-foundation

# Run schema validation
node scripts/validate-knowledge-schema.js

# Expected output:
# ✅ Schema validation passed
#    - 6 hubs
#    - 6 journeys
#    - 24 nodes
```

### Files to Upload

| Local Path | GCS Destination |
|------------|-----------------|
| `data/knowledge/hubs.json` | `gs://grove-assets/knowledge/hubs.json` |
| `data/knowledge/default-context.json` | `gs://grove-assets/knowledge/default-context.json` |
| `data/exploration/journeys.json` | `gs://grove-assets/exploration/journeys.json` |
| `data/exploration/nodes.json` | `gs://grove-assets/exploration/nodes.json` |
| `data/infrastructure/gcs-mapping.json` | `gs://grove-assets/infrastructure/gcs-mapping.json` |
| `data/infrastructure/feature-flags.json` | `gs://grove-assets/infrastructure/feature-flags.json` |
| `data/presentation/lenses.json` | `gs://grove-assets/presentation/lenses.json` |
| `data/schema/grove-knowledge-ontology.md` | `gs://grove-assets/schema/grove-knowledge-ontology.md` |

---

## Step 2: Upload Files to GCS

### Option A: Upload All Files (Recommended)

```bash
# From repository root
cd C:\GitHub\the-grove-foundation

# Upload knowledge layer
gsutil cp data/knowledge/hubs.json gs://grove-assets/knowledge/hubs.json
gsutil cp data/knowledge/default-context.json gs://grove-assets/knowledge/default-context.json

# Upload exploration layer
gsutil cp data/exploration/journeys.json gs://grove-assets/exploration/journeys.json
gsutil cp data/exploration/nodes.json gs://grove-assets/exploration/nodes.json

# Upload infrastructure layer
gsutil cp data/infrastructure/gcs-mapping.json gs://grove-assets/infrastructure/gcs-mapping.json
gsutil cp data/infrastructure/feature-flags.json gs://grove-assets/infrastructure/feature-flags.json

# Upload presentation layer
gsutil cp data/presentation/lenses.json gs://grove-assets/presentation/lenses.json

# Upload schema documentation (also RAG content)
gsutil cp data/schema/grove-knowledge-ontology.md gs://grove-assets/schema/grove-knowledge-ontology.md
```

### Option B: Single Command (Batch Upload)

```bash
# Upload all new directories at once
gsutil -m cp -r data/knowledge gs://grove-assets/
gsutil -m cp -r data/exploration gs://grove-assets/
gsutil -m cp -r data/infrastructure gs://grove-assets/
gsutil -m cp -r data/presentation gs://grove-assets/
gsutil -m cp -r data/schema gs://grove-assets/
```

**Note:** The `-m` flag enables parallel uploads for faster transfer.

---

## Step 3: Verify Upload

```bash
# List uploaded files
gsutil ls gs://grove-assets/knowledge/
gsutil ls gs://grove-assets/exploration/
gsutil ls gs://grove-assets/infrastructure/
gsutil ls gs://grove-assets/presentation/
gsutil ls gs://grove-assets/schema/

# Verify specific file contents
gsutil cat gs://grove-assets/knowledge/hubs.json | head -20
```

### Expected GCS Structure After Upload

```
gs://grove-assets/
├── knowledge/
│   ├── hubs.json              ← NEW
│   ├── default-context.json   ← NEW
│   └── _default/              ← (existing Tier 1 files)
│       ├── grove-overview.md
│       ├── key-concepts.md
│       └── visionary-narrative.md
├── exploration/
│   ├── journeys.json          ← NEW
│   └── nodes.json             ← NEW
├── infrastructure/
│   ├── gcs-mapping.json       ← NEW
│   └── feature-flags.json     ← NEW
├── presentation/
│   └── lenses.json            ← NEW
├── schema/
│   └── grove-knowledge-ontology.md  ← NEW
├── hubs/                      ← (existing hub content)
│   ├── ratchet-effect/
│   ├── infrastructure-bet/
│   └── ...
└── narratives.json            ← (legacy, kept for fallback)
```

---

## Step 4: Test in Production

### 4.1 Check Server Logs

After uploading, the server should start using the new file structure. Check Cloud Run logs:

```bash
gcloud logging read "resource.type=cloud_run_revision AND textPayload:RAG" --limit=20 --format="value(textPayload)"
```

**Expected log pattern (new structure active):**
```
[RAG] Loaded from new file structure
[RAG] Loading Tier 1 (budget: 15000 bytes)
[RAG] Tier 1 loaded: 12333 bytes from 3 files
```

**Fallback pattern (if new files missing):**
```
[RAG] New structure not found, falling back to narratives.json
```

### 4.2 Manual Smoke Test

Open the live site and test these scenarios:

| Test | Action | Expected Result |
|------|--------|-----------------|
| Default context | Ask any general question | Response uses grove-overview, key-concepts |
| Hub routing | Ask "Tell me about the Ratchet" | Matches `ratchet-effect` hub |
| Journey context | Start "The Ratchet" journey | Uses `ratchet-effect` hub context |
| New hub | Start "Under the Hood" journey | Uses new `technical-architecture` hub |

### 4.3 Verify Hub Routing

Test these queries to confirm hub matching:

| Query | Expected Hub Match |
|-------|-------------------|
| "What is the 7-month doubling cycle?" | `ratchet-effect` |
| "$380 billion infrastructure bet" | `infrastructure-bet` |
| "How do agents write diaries?" | `diary-system` |
| "What runs on local hardware?" | `technical-architecture` |
| "Emergence pattern in LLMs" | `translation-emergence` |

---

## Step 5: Validate Cache Behavior

The server caches GCS files. After upload, caches will expire based on TTL:

| Cache | TTL | Notes |
|-------|-----|-------|
| Manifest (hubs.json) | 5 minutes | Auto-refreshes |
| Knowledge files | 10 minutes | Per-file cache |

To force immediate refresh, you can redeploy the Cloud Run service:

```bash
# Force new revision (clears in-memory caches)
gcloud run services update grove-foundation --region=us-central1 --no-traffic
gcloud run services update grove-foundation --region=us-central1 --to-latest
```

Or simply wait 5-10 minutes for caches to expire naturally.

---

## Rollback Procedure

If issues occur, the system automatically falls back to `narratives.json`. To force rollback:

### Option 1: Delete New Files (Server Falls Back)

```bash
# Remove new structure files
gsutil rm gs://grove-assets/knowledge/hubs.json
gsutil rm gs://grove-assets/exploration/journeys.json
# ... etc

# Server will automatically use narratives.json
```

### Option 2: Restore Previous narratives.json

```bash
# If narratives.json was modified, restore from git
git show HEAD~1:data/narratives.json > /tmp/narratives-backup.json
gsutil cp /tmp/narratives-backup.json gs://grove-assets/narratives.json
```

### Option 3: Redeploy Previous Commit

```bash
# Revert to previous commit
git revert 8b4f6f4

# Rebuild and deploy
gcloud builds submit --config cloudbuild.yaml
```

---

## Post-Deployment Checklist

- [ ] All 8 files uploaded to GCS
- [ ] Schema validation passes locally
- [ ] Cloud Run logs show "Loaded from new file structure"
- [ ] General queries work (Tier 1 context)
- [ ] Hub-specific queries route correctly (Tier 2 context)
- [ ] All 6 journeys load with correct hub context
- [ ] "Under the Hood" journey uses new `technical-architecture` hub
- [ ] No errors in Cloud Run logs

---

## File Reference

### New Files Created

| File | Size | Content |
|------|------|---------|
| `knowledge/hubs.json` | ~2.5 KB | 6 hub definitions |
| `knowledge/default-context.json` | ~150 B | Tier 1 config |
| `exploration/journeys.json` | ~2 KB | 6 journey definitions |
| `exploration/nodes.json` | ~12 KB | 24 node definitions |
| `infrastructure/gcs-mapping.json` | ~1.5 KB | 12 file path mappings |
| `infrastructure/feature-flags.json` | ~1 KB | 8 feature flags |
| `presentation/lenses.json` | ~5 KB | 7 lens realities |
| `schema/grove-knowledge-ontology.md` | ~8 KB | Architecture docs |

### Server Changes (Already Deployed)

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `server.js:881-925` | +45 | `loadJsonFromGCS()`, `loadKnowledgeConfig()` |
| `server.js:1170-1183` | +8 | Config loading in `fetchRagContext()` |
| `server.js:1229-1239` | +4 | Support `hubId` and `linkedHubId` |

---

## Troubleshooting

### "New structure not found" in logs

**Cause:** One or more required files missing from GCS.

**Fix:** Verify all 4 core files exist:
```bash
gsutil ls gs://grove-assets/knowledge/hubs.json
gsutil ls gs://grove-assets/exploration/journeys.json
gsutil ls gs://grove-assets/knowledge/default-context.json
gsutil ls gs://grove-assets/infrastructure/gcs-mapping.json
```

### Hub not matching queries

**Cause:** Hub tags don't match query keywords.

**Fix:** Check hub tags in `hubs.json` and add relevant keywords.

### Journey shows wrong context

**Cause:** Journey `hubId` points to wrong hub.

**Fix:** Verify journey's `hubId` in `journeys.json` matches intended hub in `hubs.json`.

### 403 Permission Denied on GCS

**Cause:** Service account lacks storage permissions.

**Fix:**
```bash
# Grant storage access to Cloud Run service account
gcloud projects add-iam-policy-binding <project-id> \
  --member="serviceAccount:<service-account>@<project>.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

---

## Support

- **Schema Issues:** Run `node scripts/validate-knowledge-schema.js`
- **Logs:** `gcloud logging read "resource.type=cloud_run_revision" --limit=50`
- **Documentation:** `docs/sprints/knowledge-architecture-v1/`

---

*Last updated: 2025-12-21*
