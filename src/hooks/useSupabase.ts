import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

const useSupabase = () => {
  const [client, setClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    try {
      const supabase = supabaseClient();
      setClient(supabase);
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
    }
  }, []);

  return client;
};

export default useSupabase;