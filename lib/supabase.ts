import { createClient } from '@supabase/supabase-js';

// Default authorized Super Admin Gmail addresses
// These 2 fixed Gmail addresses are authoritative super admins.
export const SUPER_ADMIN_EMAILS = [
  process.env.SUPER_ADMIN_EMAIL_1 || 'admin.linktest@gmail.com',
  process.env.SUPER_ADMIN_EMAIL_2 || 'superadmin.linktest@gmail.com',
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  !supabaseAnonKey.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server privileged actions');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
