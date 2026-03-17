import { createClient } from '@supabase/supabase-js';

const normalizeEnvValue = (value) => String(value || '').trim();

const supabaseUrl = normalizeEnvValue(
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  ''
);
const supabaseAnonKey = normalizeEnvValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  ''
);

const missingConfig = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter(Boolean);

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const hasSupabase = Boolean(supabase);

export const supabaseConfigStatus = {
  hasSupabase,
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  missingConfig,
};

export const getSupabaseConfigError = () => {
  if (hasSupabase) return '';

  const missingLabel = missingConfig.length > 0
    ? missingConfig.join(' and ')
    : 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY';

  return `Supabase is not configured. Add ${missingLabel} to frontend/.env and restart the frontend dev server.`;
};

if (!hasSupabase) {
  console.warn('[Supabase] Frontend client disabled:', getSupabaseConfigError());
}
