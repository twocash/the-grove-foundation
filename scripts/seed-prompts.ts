// scripts/seed-prompts.ts
// Seed prompts into Supabase from existing JSON files
// Sprint: prompt-unification-v1
//
// Usage:
//   npx tsx scripts/seed-prompts.ts
//
// Requires:
//   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment

import { createClient } from '@supabase/supabase-js';

// Import existing prompts
import basePrompts from '../src/data/prompts/base.prompts.json';
import drChiangPrompts from '../src/data/prompts/dr-chiang.prompts.json';
import wayneTurnerPrompts from '../src/data/prompts/wayne-turner.prompts.json';

// =============================================================================
// Types
// =============================================================================

interface LegacyPrompt {
  id: string;
  objectType: string;
  created: number;
  modified: number;
  author: string;
  label: string;
  description?: string;
  executionPrompt: string;
  tags: string[];
  topicAffinities: Array<{ topicId: string; weight: number }>;
  lensAffinities: Array<{ lensId: string; weight: number; labelOverride?: string }>;
  targeting: {
    stages?: string[];
    excludeStages?: string[];
    entropyWindow?: { min?: number; max?: number };
    lensIds?: string[];
    excludeLenses?: string[];
    momentTriggers?: string[];
    requireMoment?: boolean;
    minInteractions?: number;
    afterPromptIds?: string[];
    topicClusters?: string[];
  };
  baseWeight: number;
  stats: {
    impressions: number;
    selections: number;
    completions: number;
    avgEntropyDelta: number;
    avgDwellAfter?: number;
    avgDwellMs?: number;
  };
  status: string;
  source: string;
  sequences?: Array<{
    groupId: string;
    groupType: string;
    order: number;
  }>;
  variant?: string;
  icon?: string;
}

interface PromptRow {
  type: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: string;
  tags: string[];
  favorite: boolean;
  created_at: string;
  updated_at: string;
  payload: {
    // Note: label, description, icon, tags removed from payload (now in meta only)
    // See: docs/sprints/prompt-schema-rationalization-v1/SPEC.md
    executionPrompt: string;
    systemContext?: string;
    variant: string;
    topicAffinities: Array<{ topicId: string; weight: number }>;
    lensAffinities: Array<{ lensId: string; weight: number; labelOverride?: string }>;
    targeting: object;
    baseWeight: number;
    sequences: Array<{ groupId: string; groupType: string; order: number }>;
    stats: {
      impressions: number;
      selections: number;
      completions: number;
      avgEntropyDelta: number;
      avgDwellMs: number;
    };
    source: string;
    generatedFrom?: object;
    cooldownMs?: number;
    maxShows?: number;
  };
}

// =============================================================================
// Transform
// =============================================================================

function transformPrompt(legacy: LegacyPrompt): PromptRow {
  const createdAt = new Date(legacy.created).toISOString();
  const updatedAt = new Date(legacy.modified).toISOString();

  // Rationalized schema: label, description, icon, tags are in meta only (not payload)
  // See: docs/sprints/prompt-schema-rationalization-v1/SPEC.md
  return {
    type: 'prompt',
    title: legacy.label,
    description: legacy.description || null,
    icon: legacy.icon || 'chat',
    color: null,
    status: legacy.status || 'active',
    tags: legacy.tags || [],
    favorite: false,
    created_at: createdAt,
    updated_at: updatedAt,
    payload: {
      executionPrompt: legacy.executionPrompt,
      variant: legacy.variant || 'default',
      topicAffinities: legacy.topicAffinities || [],
      lensAffinities: legacy.lensAffinities || [],
      targeting: legacy.targeting || {},
      baseWeight: legacy.baseWeight || 50,
      sequences: legacy.sequences || [],
      stats: {
        impressions: legacy.stats?.impressions || 0,
        selections: legacy.stats?.selections || 0,
        completions: legacy.stats?.completions || 0,
        avgEntropyDelta: legacy.stats?.avgEntropyDelta || 0,
        avgDwellMs: legacy.stats?.avgDwellMs || legacy.stats?.avgDwellAfter || 0,
      },
      source: legacy.source || 'library',
    },
  };
}

// =============================================================================
// Main
// =============================================================================

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.log('   Set these environment variables and try again.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Debug: test connection
  console.log('Testing connection to:', supabaseUrl);
  const { data: testData, error: testError } = await supabase
    .from('prompts')
    .select('id')
    .limit(1);
  
  if (testError) {
    console.error('Connection test failed:', testError.message);
    console.error('Full error:', JSON.stringify(testError, null, 2));
  } else {
    console.log('Connection test passed, found rows:', testData?.length ?? 0);
  }

  // Combine all prompts
  const allPrompts = [
    ...(basePrompts as LegacyPrompt[]),
    ...(drChiangPrompts as LegacyPrompt[]),
    ...(wayneTurnerPrompts as LegacyPrompt[]),
  ];

  console.log(`\n🌱 Seeding ${allPrompts.length} prompts...\n`);

  let success = 0;
  let failed = 0;

  for (const legacy of allPrompts) {
    const row = transformPrompt(legacy);

    const { error } = await supabase
      .from('prompts')
      .insert(row);

    if (error) {
      console.error(`❌ ${legacy.label}: ${error.message}`);
      failed++;
    } else {
      console.log(`✓ ${legacy.label}`);
      success++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✓ ${success} prompts seeded successfully`);
  if (failed > 0) {
    console.log(`   ❌ ${failed} prompts failed`);
  }
  console.log('');
}

// Run
seed().catch(console.error);
