// scripts/tag-genesis-prompts.ts
// Tag all prompts with genesisOrder as 'genesis-welcome'
// Usage: npx tsx scripts/tag-genesis-prompts.ts [--dry-run]

import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN MODE\n' : '🏷️  Tagging genesis prompts...\n');

  // Find all prompts with genesisOrder set
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, title, tags, payload')
    .not('payload->genesisOrder', 'is', null);

  if (error) {
    console.error('Error fetching prompts:', error.message);
    process.exit(1);
  }

  if (!prompts || prompts.length === 0) {
    console.log('No prompts with genesisOrder found.');
    return;
  }

  console.log(`Found ${prompts.length} prompts with genesisOrder:\n`);

  let updated = 0;
  let skipped = 0;

  for (const prompt of prompts) {
    const currentTags: string[] = prompt.tags || [];
    const genesisOrder = prompt.payload?.genesisOrder;

    console.log(`  ${prompt.title}`);
    console.log(`    genesisOrder: ${genesisOrder}`);
    console.log(`    current tags: [${currentTags.join(', ')}]`);

    if (currentTags.includes('genesis-welcome')) {
      console.log(`    ⏭️  Already tagged\n`);
      skipped++;
      continue;
    }

    const newTags = [...currentTags, 'genesis-welcome'];

    if (DRY_RUN) {
      console.log(`    → Would add 'genesis-welcome' tag\n`);
      updated++;
    } else {
      const { error: updateError } = await supabase
        .from('prompts')
        .update({ tags: newTags })
        .eq('id', prompt.id);

      if (updateError) {
        console.error(`    ❌ Error: ${updateError.message}\n`);
      } else {
        console.log(`    ✅ Tagged with 'genesis-welcome'\n`);
        updated++;
      }
    }
  }

  console.log('─'.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`   Total with genesisOrder: ${prompts.length}`);
  console.log(`   ${DRY_RUN ? 'Would update' : 'Updated'}: ${updated}`);
  console.log(`   Already tagged: ${skipped}`);

  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes.');
  }
}

main().catch(console.error);
