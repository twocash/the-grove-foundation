// scripts/diagnose-navigation-flow.ts
// Traces the navigation prompt pipeline end-to-end
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simulate what scoring.ts does
function simulateHardFilters(prompts: any[], context: any) {
  return prompts.filter(p => {
    const targeting = p.payload?.targeting || {};
    
    // Stage filter
    const stages = targeting.stages || [];
    if (stages.length > 0 && !stages.includes(context.stage)) {
      return false;
    }
    
    // Exclude stages
    const excludeStages = targeting.excludeStages || [];
    if (excludeStages.includes(context.stage)) {
      return false;
    }
    
    // minInteractions
    const minInteractions = targeting.minInteractions ?? 0;
    if (context.interactionCount < minInteractions) {
      return false;
    }
    
    // excludeLenses
    const excludeLenses = targeting.excludeLenses || [];
    if (context.activeLensId && excludeLenses.includes(context.activeLensId)) {
      return false;
    }
    
    // lensIds (if specified, must match)
    const lensIds = targeting.lensIds || [];
    if (lensIds.length > 0 && context.activeLensId && !lensIds.includes(context.activeLensId)) {
      return false;
    }
    
    return true;
  });
}

async function diagnose() {
  console.log('=== NAVIGATION FLOW DIAGNOSTIC ===\n');
  
  // Step 1: Fetch all prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('status', 'active');
  
  if (error) {
    console.error('❌ Supabase error:', error.message);
    return;
  }
  
  console.log(`Step 1: useGroveData('prompt') returns ${prompts?.length || 0} active prompts`);
  
  // Step 2: Simulate context at interactionCount=1
  const context = {
    stage: 'exploration',
    activeLensId: null,
    entropy: 0.5,
    interactionCount: 1,
    topicsExplored: [],
    activeMoments: [],
    promptsSelected: [],
  };
  
  console.log('\nStep 2: useContextState() returns:', JSON.stringify(context, null, 2));
  
  // Step 3: Apply hard filters
  const eligible = simulateHardFilters(prompts || [], context);
  console.log(`\nStep 3: applyHardFilters() passes ${eligible.length} prompts`);
  
  if (eligible.length === 0) {
    console.log('\n❌ PROBLEM: No prompts pass hard filters!');
    
    // Debug why
    console.log('\nAnalyzing filter failures:');
    const stageFiltered = (prompts || []).filter(p => {
      const stages = p.payload?.targeting?.stages || [];
      return stages.length > 0 && !stages.includes('exploration');
    });
    console.log(`  - Filtered by stage: ${stageFiltered.length}`);
    
    const minInterFiltered = (prompts || []).filter(p => {
      const min = p.payload?.targeting?.minInteractions ?? 0;
      return min > 1;
    });
    console.log(`  - Filtered by minInteractions > 1: ${minInterFiltered.length}`);
    
    return;
  }
  
  // Step 4: Check scoring
  console.log('\nStep 4: Top 5 eligible prompts:');
  eligible.slice(0, 5).forEach(p => {
    const t = p.payload?.targeting || {};
    console.log(`  - "${p.title}"`);
    console.log(`    stages: ${JSON.stringify(t.stages)}`);
    console.log(`    minInteractions: ${t.minInteractions ?? 0}`);
    console.log(`    baseWeight: ${p.payload?.baseWeight ?? 1}`);
  });
  
  // Step 5: Check if useGroveData might be returning wrong data
  console.log('\n=== CHECKING DATA LAYER ===');
  
  // Check if prompts have the expected structure
  const sample = prompts?.[0];
  if (sample) {
    console.log('\nSample prompt structure:');
    console.log('  Has meta:', !!sample.meta);
    console.log('  Has payload:', !!sample.payload);
    console.log('  Has payload.targeting:', !!sample.payload?.targeting);
    console.log('  meta.status:', sample.meta?.status || sample.status);
  }
  
  console.log('\n✅ Configuration looks correct. Issue likely in React hook wiring.');
}

diagnose().catch(console.error);
