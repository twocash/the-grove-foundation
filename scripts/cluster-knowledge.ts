#!/usr/bin/env npx ts-node
/**
 * cluster-knowledge.ts
 *
 * Validates and organizes knowledge files into hub clusters.
 * Cross-checks manifest against actual GCS files.
 *
 * Features:
 * - Validates every primaryFile in manifest exists in GCS
 * - Creates mapping from clean names to hashed GCS names
 * - Optionally reorganizes files into hub folders
 *
 * Usage:
 *   npx ts-node scripts/cluster-knowledge.ts --validate    # Validate only
 *   npx ts-node scripts/cluster-knowledge.ts --reorganize  # Copy to hub folders
 *   npx ts-node scripts/cluster-knowledge.ts --report      # Generate report
 *
 * Prerequisites:
 *   - gcloud auth configured for GCS access
 */

import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUCKET_NAME = 'grove-assets';
const KNOWLEDGE_PREFIX = 'knowledge/';

// Load mapping file - use the final manifest, not draft
const MAPPING_PATH = path.join(__dirname, '../docs/knowledge/gcs-file-mapping.json');
const MANIFEST_PATH = path.join(__dirname, '../docs/knowledge/hubs.json');

// Files to exclude from RAG
const EXCLUDED_PATTERNS = [
  /2c6780a78eef818eb98dd32985aa2182/, // 212KB white paper
];

// ============================================================================
// TYPES
// ============================================================================

interface GCSFile {
  name: string;
  size: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mappings: Record<string, string>; // cleanName -> gcsName
}

interface HubCluster {
  hubId: string;
  title: string;
  files: {
    cleanName: string;
    gcsName: string | null;
    bytes: number;
    status: 'found' | 'missing' | 'needs-creation';
  }[];
  totalBytes: number;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const mode = process.argv[2] || '--validate';

  console.log('=== Knowledge Cluster Tool ===\n');
  console.log(`Mode: ${mode}`);
  console.log(`Bucket: gs://${BUCKET_NAME}/${KNOWLEDGE_PREFIX}\n`);

  // Initialize storage
  const storage = new Storage();

  // Load GCS file list
  console.log('Fetching GCS file list...');
  const gcsFiles = await listGCSFiles(storage);
  console.log(`Found ${gcsFiles.length} files in GCS\n`);

  // Load manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  // Load explicit file mapping from manifest
  loadExplicitMapping(manifest);

  switch (mode) {
    case '--validate':
      await validateManifest(gcsFiles, manifest);
      break;
    case '--report':
      await generateReport(gcsFiles, manifest);
      break;
    case '--reorganize':
      await reorganizeFiles(storage, gcsFiles, manifest);
      break;
    default:
      console.log('Usage: cluster-knowledge.ts [--validate|--report|--reorganize]');
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

async function validateManifest(
  gcsFiles: GCSFile[],
  manifest: any
): Promise<ValidationResult> {
  console.log('=== Validating Manifest Against GCS ===\n');

  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    mappings: {},
  };

  // Build lookup for fuzzy matching
  const gcsLookup = buildFuzzyLookup(gcsFiles);

  // Validate each hub
  for (const [hubId, hubConfig] of Object.entries(manifest.hubs) as [string, any][]) {
    console.log(`\nHub: ${hubId} (${hubConfig.title})`);

    // Check primaryFile
    const primaryMatch = findGCSMatch(hubConfig.primaryFile, gcsLookup, gcsFiles);
    if (primaryMatch) {
      console.log(`  ✓ Primary: ${hubConfig.primaryFile}`);
      console.log(`    → ${primaryMatch.name} (${primaryMatch.size} bytes)`);
      result.mappings[hubConfig.primaryFile] = primaryMatch.name;
    } else {
      console.log(`  ✗ Primary: ${hubConfig.primaryFile} NOT FOUND`);
      result.errors.push(`Hub ${hubId}: primaryFile "${hubConfig.primaryFile}" not found in GCS`);
      result.valid = false;
    }

    // Check supportingFiles
    for (const supportingFile of hubConfig.supportingFiles || []) {
      const supportMatch = findGCSMatch(supportingFile, gcsLookup, gcsFiles);
      if (supportMatch) {
        console.log(`  ✓ Supporting: ${supportingFile}`);
        console.log(`    → ${supportMatch.name} (${supportMatch.size} bytes)`);
        result.mappings[supportingFile] = supportMatch.name;
      } else {
        console.log(`  ? Supporting: ${supportingFile} (not found, may need creation)`);
        result.warnings.push(`Hub ${hubId}: supportingFile "${supportingFile}" not found`);
      }
    }
  }

  // Check default context files
  console.log('\n\nDefault Context:');
  for (const file of manifest.defaultContext.files) {
    const match = findGCSMatch(file, gcsLookup, gcsFiles);
    if (match) {
      console.log(`  ✓ ${file} → ${match.name}`);
      result.mappings[file] = match.name;
    } else {
      console.log(`  ○ ${file} (needs generation)`);
      result.warnings.push(`Default: "${file}" needs to be generated`);
    }
  }

  // Summary
  console.log('\n\n=== Validation Summary ===');
  console.log(`Valid: ${result.valid}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }

  return result;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

async function generateReport(gcsFiles: GCSFile[], manifest: any) {
  console.log('=== Hub Cluster Report ===\n');

  const clusters: HubCluster[] = [];
  const gcsLookup = buildFuzzyLookup(gcsFiles);

  // Process each hub
  for (const [hubId, hubConfig] of Object.entries(manifest.hubs) as [string, any][]) {
    const cluster: HubCluster = {
      hubId,
      title: hubConfig.title,
      files: [],
      totalBytes: 0,
    };

    // Primary file
    const primaryMatch = findGCSMatch(hubConfig.primaryFile, gcsLookup, gcsFiles);
    cluster.files.push({
      cleanName: hubConfig.primaryFile,
      gcsName: primaryMatch?.name || null,
      bytes: primaryMatch?.size || 0,
      status: primaryMatch ? 'found' : 'missing',
    });
    if (primaryMatch) cluster.totalBytes += primaryMatch.size;

    // Supporting files
    for (const supportingFile of hubConfig.supportingFiles || []) {
      const supportMatch = findGCSMatch(supportingFile, gcsLookup, gcsFiles);
      cluster.files.push({
        cleanName: supportingFile,
        gcsName: supportMatch?.name || null,
        bytes: supportMatch?.size || 0,
        status: supportMatch ? 'found' : 'needs-creation',
      });
      if (supportMatch) cluster.totalBytes += supportMatch.size;
    }

    clusters.push(cluster);
  }

  // Print report
  console.log('| Hub | Files | Total Bytes | Status |');
  console.log('|-----|-------|-------------|--------|');

  for (const cluster of clusters) {
    const foundCount = cluster.files.filter(f => f.status === 'found').length;
    const totalCount = cluster.files.length;
    const status = foundCount === totalCount ? '✓ Complete' :
                   foundCount > 0 ? '⚠ Partial' : '✗ Missing';

    console.log(`| ${cluster.hubId} | ${foundCount}/${totalCount} | ${cluster.totalBytes.toLocaleString()} | ${status} |`);
  }

  // Unmapped files
  console.log('\n\n=== Unmapped GCS Files ===');
  const mappedNames = new Set(
    clusters.flatMap(c => c.files.map(f => f.gcsName).filter(Boolean))
  );

  const unmapped = gcsFiles.filter(f =>
    !mappedNames.has(f.name) &&
    !EXCLUDED_PATTERNS.some(p => p.test(f.name))
  );

  for (const file of unmapped) {
    console.log(`  - ${file.name} (${file.size.toLocaleString()} bytes)`);
  }

  console.log(`\nTotal unmapped: ${unmapped.length} files`);
}

// ============================================================================
// FILE REORGANIZATION
// ============================================================================

async function reorganizeFiles(storage: Storage, gcsFiles: GCSFile[], manifest: any) {
  console.log('=== Reorganizing Files into Hub Folders ===\n');
  console.log('NOTE: This copies files to new locations (does not delete originals)\n');

  const bucket = storage.bucket(BUCKET_NAME);
  const gcsLookup = buildFuzzyLookup(gcsFiles);
  let copiedCount = 0;

  // Process each hub
  for (const [hubId, hubConfig] of Object.entries(manifest.hubs) as [string, any][]) {
    console.log(`\nHub: ${hubId}`);
    const hubPath = hubConfig.path; // e.g., "hubs/ratchet-effect/"

    // Copy primary file
    const primaryMatch = findGCSMatch(hubConfig.primaryFile, gcsLookup, gcsFiles);
    if (primaryMatch) {
      const destPath = `knowledge/${hubPath}${hubConfig.primaryFile}`;
      console.log(`  Copying: ${primaryMatch.name}`);
      console.log(`       to: ${destPath}`);

      try {
        await bucket.file(`knowledge/${primaryMatch.name}`).copy(bucket.file(destPath));
        copiedCount++;
      } catch (error) {
        console.error(`  ERROR: ${error}`);
      }
    }

    // Copy supporting files
    for (const supportingFile of hubConfig.supportingFiles || []) {
      const supportMatch = findGCSMatch(supportingFile, gcsLookup, gcsFiles);
      if (supportMatch) {
        const destPath = `knowledge/${hubPath}${supportingFile}`;
        console.log(`  Copying: ${supportMatch.name}`);
        console.log(`       to: ${destPath}`);

        try {
          await bucket.file(`knowledge/${supportMatch.name}`).copy(bucket.file(destPath));
          copiedCount++;
        } catch (error) {
          console.error(`  ERROR: ${error}`);
        }
      }
    }
  }

  console.log(`\n=== Reorganization Complete ===`);
  console.log(`Files copied: ${copiedCount}`);
}

// ============================================================================
// HELPERS
// ============================================================================

async function listGCSFiles(storage: Storage): Promise<GCSFile[]> {
  const bucket = storage.bucket(BUCKET_NAME);
  const [files] = await bucket.getFiles({ prefix: KNOWLEDGE_PREFIX });

  return files
    .filter(f => f.name.endsWith('.md') || f.name.endsWith('.txt'))
    .map(f => ({
      name: f.name.replace(KNOWLEDGE_PREFIX, ''),
      size: parseInt(f.metadata.size as string) || 0,
    }));
}

function buildFuzzyLookup(files: GCSFile[]): Map<string, GCSFile> {
  const lookup = new Map<string, GCSFile>();

  for (const file of files) {
    // Extract key terms from filename (lowercase, remove hash)
    const cleanName = file.name
      .replace(/\s+[a-f0-9]{32}\.md$/, '') // Remove hash
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');

    lookup.set(cleanName, file);

    // Also map by significant keywords
    const keywords = file.name.split(/[\s_-]+/).filter(k => k.length > 3);
    for (const kw of keywords) {
      if (!lookup.has(kw.toLowerCase())) {
        lookup.set(kw.toLowerCase(), file);
      }
    }
  }

  return lookup;
}

// Global explicit mapping loaded from manifest
let gcsFileMapping: Record<string, string> = {};

function loadExplicitMapping(manifest: any): void {
  if (manifest._meta?.gcsFileMapping) {
    gcsFileMapping = manifest._meta.gcsFileMapping;
    console.log(`Loaded explicit mapping for ${Object.keys(gcsFileMapping).length} files`);
  }
}

function findGCSMatch(
  cleanName: string,
  lookup: Map<string, GCSFile>,
  files: GCSFile[]
): GCSFile | null {
  // 1. Check explicit mapping first (from manifest._meta.gcsFileMapping)
  if (gcsFileMapping[cleanName]) {
    const mappedName = gcsFileMapping[cleanName];
    const exactMatch = files.find(f => f.name === mappedName);
    if (exactMatch) return exactMatch;
  }

  // 2. Direct exact match by clean name
  const exactMatch = files.find(f => f.name === cleanName);
  if (exactMatch) return exactMatch;

  // 3. Lookup by normalized key
  const normalized = cleanName
    .replace(/\.md$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

  if (lookup.has(normalized)) {
    return lookup.get(normalized)!;
  }

  // 4. Fuzzy match - require ALL significant terms to match
  const searchTerms = normalized.split('_').filter(t => t.length > 3);

  let bestMatch: GCSFile | null = null;
  let bestScore = 0;

  for (const file of files) {
    const fileNormalized = file.name.toLowerCase();
    const matchCount = searchTerms.filter(t => fileNormalized.includes(t)).length;

    if (matchCount === searchTerms.length && matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = file;
    }
  }

  return bestMatch;
}

// ============================================================================
// RUN
// ============================================================================

main().catch(console.error);
