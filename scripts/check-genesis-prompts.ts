// scripts/check-genesis-prompts.ts
// Diagnostic: Check genesis-welcome prompts configuration

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://wqrlssgqqvemnybmyycd.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxcmxzc2dxcXZlbW55Ym15eWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTM1NzgsImV4cCI6MjA1MTc4OTU3OH0.NAjzZkzAcPcXhDDlysDK_LPqR1aWdGaXMd8DGXaNO9I'
);

async function check() {
  const { data, error } = await supabase
    .from('prompts')
    .select('id, title, tags, status, payload')
    .contains('tags', ['genesis-welcome'])
    .eq('status', 'active');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('=== GENESIS-WELCOME PROMPTS ===');
  console.log('Total:', data.length);
  console.log('');
  
  // Sort by genesisOrder for display
  const sorted = data.sort((a: any, b: any) => 
    (a.payload?.genesisOrder ?? 999) - (b.payload?.genesisOrder ?? 999)
  );
  
  sorted.forEach((p: any, i: number) => {
    console.log(`${i+1}. [order: ${p.payload?.genesisOrder ?? 'none'}] ${p.title}`);
    console.log(`   tags: ${p.tags?.join(', ')}`);
    console.log(`   source: ${p.payload?.source ?? 'none'}`);
    if (p.payload?.targeting) {
      console.log(`   targeting.stages: ${JSON.stringify(p.payload.targeting?.stages)}`);
      console.log(`   targeting.minInteractions: ${p.payload.targeting?.minInteractions}`);
    }
    console.log('');
  });
}

check();
