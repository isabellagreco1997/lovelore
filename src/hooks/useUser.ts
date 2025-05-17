import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import useSupabase from './useSupabase';

const useUser = () => {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    
    // Get the current user
    const getCurrentUser = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Functions for login, signup, and logout
  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase client not initialized' };
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase client not initialized' };
    return await supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    if (!supabase) return { error: 'Supabase client not initialized' };
    return await supabase.auth.signOut();
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
};

export default useUser; 