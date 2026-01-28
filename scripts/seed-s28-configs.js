// scripts/seed-s28-configs.js
// Seed database with S28-PIPE simplified configs (text-based prompts)
//
// Run with: node scripts/seed-s28-configs.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Supabase Client
// =============================================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================================================
// Seed Data (Extracted from server.js)
// =============================================================================

const SEED_RESEARCH_CONFIG = {
  meta: {
    id: crypto.randomUUID(),
    type: 'research-agent-config',
    title: 'Main Research Config',
    description: 'Default research agent configuration',
    icon: 'search',
    status: 'active',
    groveId: 'main',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  payload: {
    version: 1,

    // Extracted from server.js:2560-2575
    searchInstructions: `You are a SENIOR RESEARCH ANALYST conducting professional-grade investigation.

Your research must be:
- EXHAUSTIVE: Explore every relevant angle, follow citation chains, verify claims across sources
- RIGOROUS: Distinguish between primary sources, expert analysis, and speculation
- NUANCED: Present conflicting evidence, methodological debates, and uncertainty
- ACTIONABLE: Connect findings to practical implications and next steps

For each major claim:
1. Cite the source with full attribution
2. Assess source credibility (academic, industry, journalistic, etc.)
3. Note corroborating or contradicting evidence
4. Assign confidence level (0.0-1.0) with justification

DO NOT summarize prematurely. DO NOT omit relevant details for brevity.
Your audience expects comprehensive, professional-grade research output.`,

    // Extracted from server.js:87
    qualityGuidance: `IMPORTANT: Use rich markdown formatting in all output — ## headers for sections, ### for subsections, bullet lists, numbered lists, tables for comparisons, blockquotes for quotes, **bold** for key terms, and paragraph breaks. Use <cite index="N">claim</cite> HTML tags for inline citations where N matches the source index. Your output will be rendered with a markdown engine.`,
  },
};

const SEED_WRITER_CONFIG = {
  meta: {
    id: crypto.randomUUID(),
    type: 'writer-agent-config',
    title: 'Main Writer Config',
    description: 'Default writer agent configuration',
    icon: 'edit_note',
    status: 'active',
    groveId: 'main',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  payload: {
    version: 1,

    // Extracted from server.js:3016-3025 (voice section)
    writingStyle: `You are a senior research writer.

Write with:
- Formality: professional
- Perspective: neutral
- Citation style: inline

Your output should be authoritative but accessible. Use clear, direct language while maintaining analytical rigor.`,

    // Extracted from server.js:71-76, 60-68 (document structure + rendering)
    resultsFormatting: `## Document Structure
1. Open with a clear thesis/position (2-3 sentences)
2. Use ## headers to organize analysis into 3-5 logical sections
3. Each section should have substantive content with specific data and evidence
4. Close with a synthesis or forward-looking conclusion
5. Note limitations honestly

## Rendering Rules (ReactMarkdown + GFM)
Your output will be rendered by a markdown engine. Use rich formatting:
- **Section headers**: Use ## for major sections, ### for subsections
- **Bold key terms**: Wrap important concepts in **bold**
- **Bullet lists**: Use - for unordered lists of key findings
- **Numbered lists**: Use 1. 2. 3. for sequential steps or ranked items
- **Tables**: Use GFM markdown tables for comparisons or structured data
- **Blockquotes**: Use > for notable quotes from sources`,

    // Extracted from server.js:69 (citations section)
    citationsStyle: `## Inline Citations
Use <cite index="N">cited claim</cite> HTML tags where N is the 1-based source index.

Example: <cite index="1">GPU inference improved 10x</cite>

Include a Sources section at the end with full references.`,
  },
};

// =============================================================================
// Migration Logic
// =============================================================================

async function seedConfigs() {
  console.log('🌱 S28-PIPE: Seeding simplified config schema with extracted prompts\n');

  try {
    // Step 1: Archive existing active configs (if any)
    console.log('📦 Step 1: Archiving existing active configs...');

    const { error: archiveResearchError } = await supabase
      .from('research_agent_configs')
      .update({ meta: { status: 'archived' } })
      .eq('grove_id', 'main')
      .eq("meta->>'status'", 'active');

    if (archiveResearchError && archiveResearchError.code !== 'PGRST116') {
      console.warn('  ⚠️  Research config archive warning:', archiveResearchError.message);
    } else {
      console.log('  ✓ Archived old research configs');
    }

    const { error: archiveWriterError } = await supabase
      .from('writer_agent_configs')
      .update({ meta: { status: 'archived' } })
      .eq('grove_id', 'main')
      .eq("meta->>'status'", 'active');

    if (archiveWriterError && archiveWriterError.code !== 'PGRST116') {
      console.warn('  ⚠️  Writer config archive warning:', archiveWriterError.message);
    } else {
      console.log('  ✓ Archived old writer configs');
    }

    // Step 2: Insert new active configs with simplified schema
    console.log('\n✨ Step 2: Inserting new simplified configs...');

    const { error: insertResearchError } = await supabase
      .from('research_agent_configs')
      .insert({
        id: SEED_RESEARCH_CONFIG.meta.id,
        grove_id: 'main',
        meta: SEED_RESEARCH_CONFIG.meta,
        payload: SEED_RESEARCH_CONFIG.payload,
      });

    if (insertResearchError) {
      console.error('  ❌ Failed to insert research config:', insertResearchError.message);
      throw insertResearchError;
    }
    console.log('  ✓ Created Research Agent Config v1 (active)');

    const { error: insertWriterError } = await supabase
      .from('writer_agent_configs')
      .insert({
        id: SEED_WRITER_CONFIG.meta.id,
        grove_id: 'main',
        meta: SEED_WRITER_CONFIG.meta,
        payload: SEED_WRITER_CONFIG.payload,
      });

    if (insertWriterError) {
      console.error('  ❌ Failed to insert writer config:', insertWriterError.message);
      throw insertWriterError;
    }
    console.log('  ✓ Created Writer Agent Config v1 (active)');

    // Step 3: Verify
    console.log('\n🔍 Step 3: Verifying seeded configs...');

    const { data: researchConfigs } = await supabase
      .from('research_agent_configs')
      .select('meta, payload')
      .eq('grove_id', 'main')
      .eq("meta->>'status'", 'active');

    const { data: writerConfigs } = await supabase
      .from('writer_agent_configs')
      .select('meta, payload')
      .eq('grove_id', 'main')
      .eq("meta->>'status'", 'active');

    console.log(`  ✓ Research configs (active): ${researchConfigs?.length || 0}`);
    console.log(`  ✓ Writer configs (active): ${writerConfigs?.length || 0}`);

    if (researchConfigs?.[0]) {
      console.log(`  ✓ Research config has fields: ${Object.keys(researchConfigs[0].payload).join(', ')}`);
    }
    if (writerConfigs?.[0]) {
      console.log(`  ✓ Writer config has fields: ${Object.keys(writerConfigs[0].payload).join(', ')}`);
    }

    console.log('\n✅ Migration complete! Configs now editable via /bedrock/experience inspector.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// =============================================================================
// Run
// =============================================================================

seedConfigs();
