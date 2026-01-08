// scripts/analyze-tags.ts
// Analyze tag usage patterns across all prompts

import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, title, tags, status');

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  // Count tag frequencies
  const tagCounts: Record<string, number> = {};
  let promptsWithTags = 0;
  let promptsWithoutTags = 0;

  for (const p of prompts || []) {
    const tags = p.tags || [];
    if (tags.length > 0) {
      promptsWithTags++;
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    } else {
      promptsWithoutTags++;
    }
  }

  // Sort by frequency
  const sorted = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1]);

  console.log(`\n📊 TAG ANALYSIS`);
  console.log(`${'═'.repeat(60)}\n`);
  console.log(`Total prompts: ${prompts?.length}`);
  console.log(`With tags: ${promptsWithTags}`);
  console.log(`Without tags: ${promptsWithoutTags}`);
  console.log(`Unique tags: ${sorted.length}\n`);

  console.log(`${'─'.repeat(60)}`);
  console.log(`TAG FREQUENCY (sorted by count)`);
  console.log(`${'─'.repeat(60)}\n`);

  for (const [tag, count] of sorted) {
    const bar = '█'.repeat(Math.min(count, 40));
    console.log(`${tag.padEnd(30)} ${String(count).padStart(4)} ${bar}`);
  }

  // Group by patterns
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`TAG CLUSTERS (by prefix/pattern)`);
  console.log(`${'─'.repeat(60)}\n`);

  const clusters: Record<string, string[]> = {
    'genesis-*': [],
    'extracted/ai-*': [],
    'topic-*': [],
    'stage-*': [],
    'quality-*': [],
    'other': [],
  };

  for (const [tag] of sorted) {
    if (tag.startsWith('genesis')) {
      clusters['genesis-*'].push(tag);
    } else if (tag === 'extracted' || tag.startsWith('ai-')) {
      clusters['extracted/ai-*'].push(tag);
    } else if (tag.includes('topic') || tag.includes('hub')) {
      clusters['topic-*'].push(tag);
    } else if (['exploration', 'synthesis', 'advocacy', 'genesis'].includes(tag)) {
      clusters['stage-*'].push(tag);
    } else if (['curated', 'high-quality', 'needs-review', 'polished'].includes(tag)) {
      clusters['quality-*'].push(tag);
    } else {
      clusters['other'].push(tag);
    }
  }

  for (const [cluster, tags] of Object.entries(clusters)) {
    if (tags.length > 0) {
      console.log(`${cluster}:`);
      for (const tag of tags) {
        console.log(`  - ${tag} (${tagCounts[tag]})`);
      }
      console.log('');
    }
  }

  // Suggest dropdown options
  console.log(`${'─'.repeat(60)}`);
  console.log(`SUGGESTED DROPDOWN OPTIONS (count >= 3)`);
  console.log(`${'─'.repeat(60)}\n`);

  const suggested = sorted.filter(([, count]) => count >= 3).map(([tag]) => tag);
  console.log(`options: ['${suggested.join("', '")}']`);
}

main().catch(console.error);
