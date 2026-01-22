// scripts/seed-output-templates.ts
// Seed output templates into Supabase from JSON file
// Sprint: prompt-template-architecture-v1
//
// Usage:
//   npx tsx scripts/seed-output-templates.ts
//
// Options:
//   --dry-run    Show what would be seeded without making changes
//   --force      Overwrite existing templates (default: skip existing)
//
// Requires:
//   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
//   (or SUPABASE_SERVICE_ROLE_KEY for admin operations)
//
// This script can be called:
//   1. Manually for initial seeding
//   2. From E2E tests before assertions
//   3. In CI/CD pipelines

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import outputTemplateSeeds from '../data/seeds/output-templates.json';

// =============================================================================
// Types
// =============================================================================

interface OutputTemplateSeed {
  id: string;
  meta: {
    type: string;
    title: string;
    description?: string;
    icon?: string;
    status: string;
    tags?: string[];
  };
  payload: {
    version: number;
    name: string;
    description: string;
    agentType: 'writer' | 'research';
    systemPrompt: string;
    config: Record<string, unknown>;
    status: string;
    isDefault: boolean;
    source: 'system-seed' | 'user-created' | 'forked' | 'imported';
    forkedFromId?: string;
  };
}

interface OutputTemplateRow {
  id: string;
  meta: {
    id: string;
    type: string;
    title: string;
    description?: string;
    icon?: string;
    status: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
  };
  payload: OutputTemplateSeed['payload'];
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Transform
// =============================================================================

function transformTemplate(seed: OutputTemplateSeed): OutputTemplateRow {
  const now = new Date().toISOString();

  return {
    id: generateUUID(seed.id),
    meta: {
      id: seed.id,
      type: 'output-template',
      title: seed.meta.title,
      description: seed.meta.description,
      icon: seed.meta.icon,
      status: seed.meta.status || 'active',
      tags: seed.meta.tags || [],
      createdAt: now,
      updatedAt: now,
    },
    payload: seed.payload,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Generate a deterministic UUID from a seed ID
 * This ensures the same seed always gets the same UUID
 */
function generateUUID(seedId: string): string {
  // Map known seed IDs to fixed UUIDs (matching migration 031)
  const seedIdToUUID: Record<string, string> = {
    'ot-seed-engineering': 'a1b2c3d4-e5f6-7890-abcd-100000000001',
    'ot-seed-vision': 'a1b2c3d4-e5f6-7890-abcd-100000000002',
    'ot-seed-higher-ed': 'a1b2c3d4-e5f6-7890-abcd-100000000003',
    'ot-seed-blog': 'a1b2c3d4-e5f6-7890-abcd-100000000004',
    'ot-seed-deep-dive': 'a1b2c3d4-e5f6-7890-abcd-100000000005',
    'ot-seed-quick-scan': 'a1b2c3d4-e5f6-7890-abcd-100000000006',
    'ot-seed-academic': 'a1b2c3d4-e5f6-7890-abcd-100000000007',
    'ot-seed-trends': 'a1b2c3d4-e5f6-7890-abcd-100000000008',
  };

  return seedIdToUUID[seedId] || crypto.randomUUID();
}

// =============================================================================
// CLI
// =============================================================================

interface CLIOptions {
  dryRun: boolean;
  force: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };
}

// =============================================================================
// Main
// =============================================================================

async function seed(options: CLIOptions) {
  console.log('🌱 Output Template Seed Loader');
  console.log('   Sprint: prompt-template-architecture-v1\n');

  if (options.dryRun) {
    console.log('   Mode: DRY RUN (no changes will be made)\n');
  }

  // Support both NEXT_PUBLIC_ and VITE_ prefixes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  // Service role key for admin operations (bypasses RLS)
  // Falls back to anon key if service role not available (works for public tables)
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                      process.env.VITE_SUPABASE_SERVICE_KEY ||
                      process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:');
    if (!supabaseUrl) console.error('   - VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
    console.log('\n   Set these environment variables and try again.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connection
  console.log('📡 Connecting to Supabase...');
  const { data: testData, error: testError } = await supabase
    .from('output_templates')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Connection failed:', testError.message);
    if (testError.code === '42P01') {
      console.error('   Table "output_templates" does not exist.');
      console.error('   Run migration 031_output_templates.sql first.');
    }
    process.exit(1);
  }

  console.log(`   Connected! Found ${testData?.length ?? 0} existing templates.\n`);

  // Get existing template IDs
  const { data: existingData } = await supabase
    .from('output_templates')
    .select('id, meta->id');

  const existingIds = new Set(
    (existingData || []).map((row: { id: string }) => row.id)
  );

  // Load seeds
  const seeds = (outputTemplateSeeds as { templates: OutputTemplateSeed[] }).templates;
  console.log(`📦 Processing ${seeds.length} seed templates...\n`);

  let created = 0;
  let skipped = 0;
  let updated = 0;
  let failed = 0;

  for (const seed of seeds) {
    const row = transformTemplate(seed);
    const exists = existingIds.has(row.id);

    if (options.dryRun) {
      if (exists && !options.force) {
        console.log(`⏭️  [SKIP] ${seed.meta.title} (already exists)`);
        skipped++;
      } else if (exists && options.force) {
        console.log(`🔄 [UPDATE] ${seed.meta.title}`);
        updated++;
      } else {
        console.log(`✨ [CREATE] ${seed.meta.title}`);
        created++;
      }
      continue;
    }

    // Skip existing unless force mode
    if (exists && !options.force) {
      console.log(`⏭️  ${seed.meta.title} (exists, skipping)`);
      skipped++;
      continue;
    }

    // Upsert the template
    const { error } = await supabase
      .from('output_templates')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error(`❌ ${seed.meta.title}: ${error.message}`);
      failed++;
    } else if (exists) {
      console.log(`🔄 ${seed.meta.title} (updated)`);
      updated++;
    } else {
      console.log(`✨ ${seed.meta.title} (created)`);
      created++;
    }
  }

  // Summary
  console.log('\n📊 Results:');
  if (created > 0) console.log(`   ✨ ${created} templates created`);
  if (updated > 0) console.log(`   🔄 ${updated} templates updated`);
  if (skipped > 0) console.log(`   ⏭️  ${skipped} templates skipped (already exist)`);
  if (failed > 0) console.log(`   ❌ ${failed} templates failed`);

  if (options.dryRun) {
    console.log('\n   (Dry run - no actual changes made)');
  }

  console.log('');

  // Exit with error code if any failed
  if (failed > 0) {
    process.exit(1);
  }
}

// =============================================================================
// Export for programmatic use (E2E tests)
// =============================================================================

export async function seedOutputTemplates(options?: Partial<CLIOptions>) {
  return seed({
    dryRun: options?.dryRun ?? false,
    force: options?.force ?? false,
  });
}

// Run if called directly (not when imported)
// Check if this script is the entry point by looking at process.argv
const scriptName = 'seed-output-templates.ts';
const isDirectRun = process.argv[1]?.includes(scriptName) &&
                    !process.argv[1]?.includes('-e'); // Exclude tsx -e eval

if (isDirectRun) {
  const options = parseArgs();
  seed(options).catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  });
}
