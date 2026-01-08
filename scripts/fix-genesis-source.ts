// scripts/fix-genesis-source.ts
// Fix source field for genesis prompts that have source: 'library' in Supabase

import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Find prompts with genesis-welcome tag and source: library
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, title, payload')
    .contains('tags', ['genesis-welcome']);

  if (error) {
    console.error('Error fetching:', error.message);
    process.exit(1);
  }

  const libraryPrompts = prompts?.filter(p => p.payload?.source === 'library') || [];

  console.log(`Found ${libraryPrompts.length} genesis-welcome prompts with source: 'library'\n`);

  for (const prompt of libraryPrompts) {
    console.log(`Updating: ${prompt.title}`);
    console.log(`  ID: ${prompt.id}`);
    console.log(`  Old source: ${prompt.payload?.source}`);

    const newPayload = {
      ...prompt.payload,
      source: 'user'
    };

    const { error: updateError } = await supabase
      .from('prompts')
      .update({ payload: newPayload })
      .eq('id', prompt.id);

    if (updateError) {
      console.error(`  ❌ Error: ${updateError.message}`);
    } else {
      console.log(`  ✅ Updated to source: 'user'`);
    }
    console.log('');
  }

  console.log('Done!');
}

main().catch(console.error);
