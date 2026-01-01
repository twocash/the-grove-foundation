// lib/supabase.js
// Server-side Supabase client for sprout persistence
// Uses lazy initialization to allow dotenv to load first

import { createClient } from '@supabase/supabase-js';

// Lazy-initialized client
let _supabaseAdmin = null;
let _initialized = false;

/**
 * Get the Supabase admin client (lazy initialization)
 * This allows dotenv to load environment variables before the client is created
 */
function getSupabaseAdmin() {
  if (!_initialized) {
    _initialized = true;
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log('[Supabase] Client initialized');
    } else {
      console.warn('[Supabase] Not configured - SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    }
  }
  return _supabaseAdmin;
}

// Export as a getter for backward compatibility
// Code that imports { supabaseAdmin } will get the client lazily
export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseAdmin();
    if (!client) return undefined;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

// Also export the getter function for explicit lazy access
export { getSupabaseAdmin };
