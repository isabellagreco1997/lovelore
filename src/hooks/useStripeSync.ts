import { useEffect } from 'react';
import useSupabase from './useSupabase';
import useUser from './useUser';

const useStripeSync = () => {
  const supabase = useSupabase();
  const { user } = useUser();

  useEffect(() => {
    if (!supabase || !user) return;

    const syncStripeData = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;

        // Use the stripe_user_subscriptions view to trigger a sync
        const { error } = await supabase
          .from('stripe_user_subscriptions')
          .select('subscription_status')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error syncing Stripe data:', error);
        }
      } catch (error) {
        console.error('Error in Stripe sync:', error);
      }
    };

    syncStripeData();
  }, [supabase, user]);
};

export default useStripeSync;