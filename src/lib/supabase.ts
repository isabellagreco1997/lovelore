import { createClient } from '@supabase/supabase-js';

// Initialize the client with public keys for client-side usage
export const supabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Add necessary headers to avoid 406 errors
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': supabaseAnonKey
  };

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers
    }
  });
};

// Initialize the client with service role key for server-side operations
// IMPORTANT: This should never be used client-side
export const supabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  // Add necessary headers for admin requests
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': supabaseServiceKey
  };

  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers
    }
  });
}; 