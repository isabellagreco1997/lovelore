import { useEffect, useRef } from 'react';
import useSupabase from './useSupabase';
import useUser from './useUser';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

const useStripeSync = () => {
  const supabase = useSupabase();
  const { user } = useUser();
  const lastSyncTime = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!supabase || !user) return;

    const syncStripeData = async () => {
      const now = Date.now();
      if (now - lastSyncTime.current < SYNC_INTERVAL) {
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
          .from('stripe_user_subscriptions')
          .select('subscription_status')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error syncing Stripe data:', error);
        }

        lastSyncTime.current = now;
      } catch (error) {
        console.error('Error in Stripe sync:', error);
      }
    };

    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce the sync call
    syncTimeoutRef.current = setTimeout(syncStripeData, 1000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [supabase, user]);
};

export default useStripeSync;