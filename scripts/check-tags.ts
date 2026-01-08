// scripts/check-tags.ts
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get all prompts with genesis-welcome tag
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, title, status, tags, payload');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  const genesisWelcome = prompts?.filter(p =>
    Array.isArray(p.tags) && p.tags.includes('genesis-welcome')
  ) || [];

  console.log(`\nTotal prompts: ${prompts?.length}`);
  console.log(`With 'genesis-welcome' tag: ${genesisWelcome.length}\n`);

  console.log('=== Prompts with genesis-welcome tag ===\n');

  for (const p of genesisWelcome) {
    console.log(`${p.title}`);
    console.log(`  ID: ${p.id}`);
    console.log(`  Status: ${p.status}`);
    console.log(`  Source: ${p.payload?.source}`);
    console.log(`  Tags: [${p.tags?.join(', ')}]`);
    console.log('');
  }

  // Check source breakdown
  const bySource: Record<string, number> = {};
  for (const p of genesisWelcome) {
    const src = p.payload?.source || 'unknown';
    bySource[src] = (bySource[src] || 0) + 1;
  }
  console.log('By source:', bySource);

  // Check status breakdown
  const byStatus: Record<string, number> = {};
  for (const p of genesisWelcome) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  }
  console.log('By status:', byStatus);
}

main().catch(console.error);
