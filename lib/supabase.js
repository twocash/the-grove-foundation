// lib/supabase.js
// Server-side Supabase client for sprout persistence

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Only create client if credentials are available
// This prevents crash on startup in environments without Supabase configured
let supabaseAdmin = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log('[Supabase] Client initialized');
} else {
  console.warn('[Supabase] Not configured - SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
}

export { supabaseAdmin };
