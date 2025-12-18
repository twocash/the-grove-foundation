#!/usr/bin/env npx ts-node
/**
 * migrate-hubs.ts
 *
 * Merges the Knowledge Registry (hubs.json) into the Narrative Registry (narratives.json)
 * to create a Single Source of Truth (SSOT) for the application's "Brain."
 *
 * This is a ONE-TIME migration script for Sprint 1 of the "Narrative Registry" project.
 *
 * What it does:
 * 1. Reads docs/knowledge/hubs.json (file paths, byte budgets, GCS mapping)
 * 2. Reads data/narratives.json (if V2 exists) or creates new V2.1 structure
 * 3. Merges hubs into narratives with status: 'active'
 * 4. Outputs the merged narratives.json
 *
 * Usage:
 *   npx ts-node scripts/migrate-hubs.ts          # Dry run (shows diff)
 *   npx ts-node scripts/migrate-hubs.ts --write  # Actually writes the file
 *   npx ts-node scripts/migrate-hubs.ts --gcs    # Generates JSON for GCS upload
 *
 * Prerequisites:
 *   - docs/knowledge/hubs.json exists
 *   - TypeScript types in src/core/schema/narrative.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const HUBS_JSON_PATH = path.join(__dirname, '../docs/knowledge/hubs.json');
const NARRATIVES_JSON_PATH = path.join(__dirname, '../data/narratives.json');
const OUTPUT_PATH = path.join(__dirname, '../data/narratives-v2.1.json');

// ============================================================================
// TYPES (mirrors src/core/schema/narrative.ts)
// ============================================================================

type HubStatus = 'active' | 'draft' | 'archived';

interface TopicHub {
  id: string;
  title: string;
  tags: string[];
  priority: number;
  enabled: boolean;
  path: string;
  primaryFile: string;
  supportingFiles: string[];
  maxBytes: number;
  expertFraming: string;
  keyPoints: string[];
  commonMisconceptions?: string[];
  personaOverrides?: Record<string, string>;
  status: HubStatus;
  createdAt: string;
  updatedAt: string;
}

interface DefaultContext {
  path: string;
  maxBytes: number;
  files: string[];
}

interface HubsJsonHub {
  title: string;
  path: string;
  maxBytes: number;
  primaryFile: string;
  supportingFiles: string[];
  tags: string[];
  triggerConditions?: Record<string, unknown>;
}

interface HubsJson {
  version: string;
  description: string;
  generatedAt: string;
  defaultContext: DefaultContext;
  hubs: Record<string, HubsJsonHub>;
  _meta: {
    totalHubs: number;
    notes: string[];
    gcsFileMapping: Record<string, string>;
  };
}

// Legacy TopicHub from globalSettings
interface LegacyTopicHub {
  id: string;
  title: string;
  tags: string[];
  priority: number;
  enabled: boolean;
  primarySource: string;
  supportingSources: string[];
  expertFraming: string;
  keyPoints: string[];
  commonMisconceptions?: string[];
  personaOverrides?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const mode = process.argv[2] || '--dry-run';

  console.log('=== Hub Migration Tool ===\n');
  console.log(`Mode: ${mode}`);
  console.log(`Hubs JSON: ${HUBS_JSON_PATH}`);
  console.log(`Output: ${mode === '--gcs' ? 'stdout (for GCS upload)' : OUTPUT_PATH}\n`);

  // 1. Load hubs.json
  if (!fs.existsSync(HUBS_JSON_PATH)) {
    console.error(`ERROR: hubs.json not found at ${HUBS_JSON_PATH}`);
    process.exit(1);
  }

  const hubsJson: HubsJson = JSON.parse(fs.readFileSync(HUBS_JSON_PATH, 'utf8'));
  console.log(`Loaded hubs.json: ${Object.keys(hubsJson.hubs).length} hubs\n`);

  // 2. Load existing narratives.json (if it exists and is V2)
  let existingNarratives: Record<string, unknown> | null = null;
  let legacyTopicHubs: LegacyTopicHub[] = [];

  if (fs.existsSync(NARRATIVES_JSON_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(NARRATIVES_JSON_PATH, 'utf8'));
    if (parsed.version === '2.0' || parsed.version === '2.1') {
      existingNarratives = parsed;
      legacyTopicHubs = parsed.globalSettings?.topicHubs || [];
      console.log(`Loaded narratives.json: V${parsed.version}`);
      console.log(`Found ${legacyTopicHubs.length} legacy topicHubs in globalSettings\n`);
    } else {
      console.log(`narratives.json is V1 (${parsed.version}), creating fresh V2.1 structure\n`);
    }
  } else {
    console.log('No narratives.json found, creating fresh V2.1 structure\n');
  }

  // 3. Merge hubs
  const mergedHubs: Record<string, TopicHub> = {};
  const now = new Date().toISOString();

  for (const [hubId, hubConfig] of Object.entries(hubsJson.hubs)) {
    // Find matching legacy hub for expertFraming, keyPoints, etc.
    const legacyHub = legacyTopicHubs.find(h => h.id === hubId);

    const mergedHub: TopicHub = {
      id: hubId,
      title: hubConfig.title,

      // Routing config (from legacy or defaults)
      tags: hubConfig.tags, // Use hubs.json tags as source of truth
      priority: legacyHub?.priority ?? 5,
      enabled: legacyHub?.enabled ?? true,

      // File path config (from hubs.json)
      path: hubConfig.path,
      primaryFile: hubConfig.primaryFile,
      supportingFiles: hubConfig.supportingFiles,
      maxBytes: hubConfig.maxBytes,

      // Expert framing (from legacy or generate placeholder)
      expertFraming: legacyHub?.expertFraming ?? `Expert context for ${hubConfig.title}`,
      keyPoints: legacyHub?.keyPoints ?? [],
      commonMisconceptions: legacyHub?.commonMisconceptions,
      personaOverrides: legacyHub?.personaOverrides,

      // Plugin lifecycle - all migrated hubs are active
      status: 'active',

      // Metadata
      createdAt: legacyHub?.createdAt ?? now,
      updatedAt: now
    };

    mergedHubs[hubId] = mergedHub;
    console.log(`  ✓ Merged: ${hubId} (${hubConfig.primaryFile})`);
  }

  console.log(`\nMerged ${Object.keys(mergedHubs).length} hubs\n`);

  // 4. Build the V2.1 schema
  const mergedSchema = {
    version: '2.1' as const,

    // Preserve existing V2 data or use empty defaults
    globalSettings: existingNarratives?.globalSettings ?? {
      defaultToneGuidance: '',
      scholarModePromptAddition: '',
      noLensBehavior: 'nudge-after-exchanges',
      nudgeAfterExchanges: 3,
      featureFlags: [],
      autoGeneratedJourneyDepth: 5,
      personaPromptVersions: [],
      topicHubs: [], // Will be empty - hubs now live at top level
      loadingMessages: [],
      systemPromptVersions: [],
      activeSystemPromptId: ''
    },
    personas: existingNarratives?.personas ?? {},
    cards: existingNarratives?.cards ?? {},

    // NEW V2.1 fields
    hubs: mergedHubs,
    journeys: existingNarratives?.journeys ?? {},
    defaultContext: hubsJson.defaultContext,
    gcsFileMapping: hubsJson._meta.gcsFileMapping
  };

  // Clear legacy topicHubs from globalSettings (they now live in `hubs`)
  if (mergedSchema.globalSettings && 'topicHubs' in mergedSchema.globalSettings) {
    (mergedSchema.globalSettings as Record<string, unknown>).topicHubs = [];
  }

  // 5. Output
  const output = JSON.stringify(mergedSchema, null, 2);

  if (mode === '--gcs') {
    // Output JSON to stdout for piping to gcloud storage cp
    console.log('\n=== V2.1 Schema (for GCS) ===\n');
    process.stdout.write(output);
  } else if (mode === '--write') {
    fs.writeFileSync(OUTPUT_PATH, output);
    console.log(`\n✓ Written to ${OUTPUT_PATH}`);
    console.log('\nNext steps:');
    console.log('1. Review the output file');
    console.log('2. Upload to GCS: gcloud storage cp data/narratives-v2.1.json gs://grove-assets/narratives.json');
    console.log('3. Delete docs/knowledge/hubs.json (it\'s now deprecated)');
  } else {
    // Dry run - show summary
    console.log('=== Migration Summary ===\n');
    console.log(`Hubs merged: ${Object.keys(mergedHubs).length}`);
    console.log(`Default context files: ${hubsJson.defaultContext.files.length}`);
    console.log(`GCS file mappings: ${Object.keys(hubsJson._meta.gcsFileMapping).length}`);
    console.log(`\nSchema version: ${mergedSchema.version}`);
    console.log('\nHub IDs:');
    Object.keys(mergedHubs).forEach(id => console.log(`  - ${id}`));
    console.log('\nRun with --write to save, or --gcs to output for GCS upload');
  }
}

// ============================================================================
// RUN
// ============================================================================

main().catch(console.error);
