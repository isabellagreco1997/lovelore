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

    const syncSubscriptionData = async () => {
      const now = Date.now();
      if (now - lastSyncTime.current < SYNC_INTERVAL) {
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Query the stripe_user_subscriptions view to get latest data
        const { data: subscriptionData, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching subscription data:', error);
          return;
        }

        // If we have subscription data, check if it needs updating
        if (subscriptionData?.current_period_end) {
          const periodEnd = subscriptionData.current_period_end * 1000; // Convert to milliseconds
          const timeUntilExpiry = periodEnd - now;

          // If subscription is expiring soon (within 24 hours), sync more frequently
          if (timeUntilExpiry < 24 * 60 * 60 * 1000) {
            // Set a shorter interval for the next sync
            setTimeout(syncSubscriptionData, 15 * 60 * 1000); // 15 minutes
          }
        }

        lastSyncTime.current = now;
      } catch (error) {
        console.error('Error syncing subscription data:', error);
      }
    };

    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Initial sync with debounce
    syncTimeoutRef.current = setTimeout(syncSubscriptionData, 1000);

    // Set up interval for regular syncs
    const intervalId = setInterval(syncSubscriptionData, SYNC_INTERVAL);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      clearInterval(intervalId);
    };
  }, [supabase, user]);
};

export default useStripeSync;