// scripts/migrate-prompts-v2.ts
// Migrate prompts from old format (payload.label, etc.) to new format (meta.title, etc.)
// Sprint: prompt-schema-rationalization-v1 (Epic 4)
//
// Usage:
//   npx tsx scripts/migrate-prompts-v2.ts --dry-run
//   npx tsx scripts/migrate-prompts-v2.ts
//
// Requires:
//   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Types
// =============================================================================

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

interface OldPromptPayload {
  label?: string;
  description?: string;
  icon?: string;
  tags?: string[];
  executionPrompt: string;
  [key: string]: unknown;
}

interface PromptRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  icon: string | null;
  status: string;
  tags: string[];
  payload: OldPromptPayload;
  [key: string]: unknown;
}

// =============================================================================
// Detection & Migration
// =============================================================================

/**
 * Check if a prompt is in the old format (has redundant fields in payload)
 */
function isOldFormat(prompt: PromptRow): boolean {
  return (
    prompt.payload &&
    ('label' in prompt.payload ||
      'description' in prompt.payload ||
      'icon' in prompt.payload ||
      'tags' in prompt.payload)
  );
}

/**
 * Migrate a prompt from old format to new format
 * - Moves label → meta.title (if meta.title is empty)
 * - Moves description → meta.description (if meta.description is empty)
 * - Moves icon → meta.icon (if meta.icon is empty)
 * - Moves tags → meta.tags (if meta.tags is empty)
 * - Removes these fields from payload
 */
function migratePrompt(prompt: PromptRow): PromptRow {
  if (!isOldFormat(prompt)) return prompt;

  const { label, description, icon, tags, ...restPayload } = prompt.payload;

  return {
    ...prompt,
    // Update meta fields (prefer existing meta values)
    title: prompt.title || label || 'Untitled',
    description: prompt.description || description || null,
    icon: prompt.icon || icon || 'chat',
    tags: prompt.tags?.length ? prompt.tags : tags || [],
    // Remove redundant fields from payload
    payload: restPayload as OldPromptPayload,
  };
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? '🔍 DRY RUN MODE' : '🚀 LIVE MIGRATION');
  console.log('');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.log('   Set these environment variables and try again.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all prompts
  console.log('📥 Fetching prompts...');
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*');

  if (error) {
    console.error('Failed to fetch prompts:', error.message);
    process.exit(1);
  }

  console.log(`   Found ${prompts?.length || 0} prompts\n`);

  const results: MigrationResult = {
    total: prompts?.length || 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  for (const prompt of prompts || []) {
    if (!isOldFormat(prompt as PromptRow)) {
      results.skipped++;
      console.log(`⏭️  SKIP: ${prompt.id} (already new format)`);
      continue;
    }

    const migrated = migratePrompt(prompt as PromptRow);

    if (dryRun) {
      console.log(`📋 WOULD MIGRATE: ${prompt.id}`);
      if ((prompt.payload as OldPromptPayload).label) {
        console.log(`   payload.label → meta.title: "${(prompt.payload as OldPromptPayload).label}"`);
      }
      if ((prompt.payload as OldPromptPayload).description) {
        console.log(`   payload.description → meta.description`);
      }
      if ((prompt.payload as OldPromptPayload).icon) {
        console.log(`   payload.icon → meta.icon: "${(prompt.payload as OldPromptPayload).icon}"`);
      }
      if ((prompt.payload as OldPromptPayload).tags?.length) {
        console.log(`   payload.tags → meta.tags: [${(prompt.payload as OldPromptPayload).tags?.join(', ')}]`);
      }
      results.migrated++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        title: migrated.title,
        description: migrated.description,
        icon: migrated.icon,
        tags: migrated.tags,
        payload: migrated.payload,
      })
      .eq('id', prompt.id);

    if (updateError) {
      results.errors.push(`${prompt.id}: ${updateError.message}`);
      console.error(`❌ ERROR: ${prompt.id}:`, updateError.message);
    } else {
      results.migrated++;
      console.log(`✅ MIGRATED: ${prompt.id}`);
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log('📊 RESULTS');
  console.log('─'.repeat(50));
  console.log(`   Total:    ${results.total}`);
  console.log(`   Migrated: ${results.migrated}`);
  console.log(`   Skipped:  ${results.skipped}`);
  console.log(`   Errors:   ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((e) => console.log(`   - ${e}`));
  }

  if (dryRun && results.migrated > 0) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }

  console.log('');
}

main().catch(console.error);
