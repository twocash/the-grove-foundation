// scripts/diagnose-prompts.ts
// Quick diagnostic for inline prompts issue
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnose() {
  const { data: prompts } = await supabase
    .from('prompts')
    .select('title, status, tags, payload')
    .eq('status', 'active');
  
  console.log('=== PROMPT COVERAGE DIAGNOSTIC ===');
  console.log('Total active prompts:', prompts?.length || 0);
  
  const stageCount = { genesis: 0, exploration: 0, synthesis: 0, noStage: 0 };
  
  for (const p of prompts || []) {
    const stages = p.payload?.targeting?.stages || [];
    if (stages.length === 0) stageCount.noStage++;
    else {
      if (stages.includes('genesis')) stageCount.genesis++;
      if (stages.includes('exploration')) stageCount.exploration++;
      if (stages.includes('synthesis')) stageCount.synthesis++;
    }
  }
  
  console.log('\nStage targeting:');
  console.log('  genesis:', stageCount.genesis);
  console.log('  exploration:', stageCount.exploration);
  console.log('  synthesis:', stageCount.synthesis);
  console.log('  NO stage:', stageCount.noStage);
  
  // Exploration prompts with minInteractions <= 1
  const eligible = (prompts || []).filter(p => {
    const t = p.payload?.targeting;
    return t?.stages?.includes('exploration') && (t?.minInteractions ?? 0) <= 1;
  });
  
  console.log('\nExploration prompts (minInteractions <= 1):', eligible.length);
  eligible.slice(0, 3).forEach(p => console.log('  -', p.title));
}

diagnose().catch(console.error);
