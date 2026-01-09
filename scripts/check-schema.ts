import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data } = await supabase.from('prompts').select('*').limit(1);
  console.log('Actual Supabase columns:', Object.keys(data![0]));
  console.log('\nSample row (truncated):');
  const sample = data![0];
  console.log({
    id: sample.id,
    type: sample.type,
    title: sample.title,
    status: sample.status,
    tags: sample.tags,
    'payload keys': Object.keys(sample.payload || {}),
    'has meta?': 'meta' in sample,
  });
}
run();
