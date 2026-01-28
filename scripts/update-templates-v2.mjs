// scripts/update-templates-v2.mjs
// Update all output templates with v2 revisions
//
// Run with: node scripts/update-templates-v2.mjs

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEMPLATES_DIR = 'C:\\Users\\jimca\\Downloads\\revised-templates';

const TEMPLATES = [
  // Research templates
  { file: 'quick-scan-v2.json', name: 'Quick Scan', type: 'research' },
  { file: 'deep-dive-v2.json', name: 'Deep Dive', type: 'research' },
  { file: 'academic-review-v2.json', name: 'Academic Review', type: 'research' },
  { file: 'trend-analysis-v2.json', name: 'Trend Analysis', type: 'research' },
  // Writer templates
  { file: 'blog-post-v2.json', name: 'Blog Post', type: 'writer' },
  { file: 'engineering-architecture-v2.json', name: 'Engineering / Architecture', type: 'writer' },
  { file: 'higher-ed-policy-v2.json', name: 'Higher Ed Policy', type: 'writer' },
  { file: 'vision-paper-v2.json', name: 'Vision Paper', type: 'writer' },
];

async function updateTemplates() {
  console.log('🔄 Updating output templates to v2...\n');

  for (const template of TEMPLATES) {
    try {
      const filePath = join(TEMPLATES_DIR, template.file);
      const content = JSON.parse(readFileSync(filePath, 'utf8'));

      console.log(`Updating ${template.name} (${template.type})...`);

      // Update existing template by title
      const { data, error } = await supabase
        .from('output_templates')
        .update({
          meta: {
            ...content.meta,
            updatedAt: new Date().toISOString(),
          },
          payload: content.payload,
          updated_at: new Date().toISOString(),
        })
        .eq("meta->>'title'", template.name)
        .select();

      if (error) {
        console.error(`  ❌ Failed:`, error.message);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`  ⚠️  Template not found, skipping`);
        continue;
      }

      console.log(`  ✅ Updated successfully`);

    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }

  console.log('\n✅ Template update complete!');
}

updateTemplates();
