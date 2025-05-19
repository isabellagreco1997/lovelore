import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import useSupabase from '@/hooks/useSupabase';

interface ProfileSectionProps {
  user: User;
}

const ProfileSection = ({ user }: ProfileSectionProps) => {
  const supabase = useSupabase();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!supabase) return;

      try {
        setLoading(true);
        
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No session available');
          return;
        }
        
        // First check if we have a customer record
        const { data: customerData, error: customerError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .single();

        if (customerError && customerError.code !== 'PGRST116') {
          throw new Error('Failed to fetch customer data');
        }

        if (!customerData) {
          // No customer record yet, which is normal for new users
          setSubscription(null);
          return;
        }

        // Now fetch subscription data
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', customerData.customer_id)
          .single();

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          throw new Error('Failed to fetch subscription data');
        }

        setSubscription(subscriptionData);
      } catch (error: any) {
        console.error('Error fetching subscription:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [supabase, user.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/20 text-green-400 border-green-900/20';
      case 'trialing':
        return 'bg-blue-900/20 text-blue-400 border-blue-900/20';
      case 'past_due':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-900/20';
      case 'canceled':
        return 'bg-red-900/20 text-red-400 border-red-900/20';
      default:
        return 'bg-gray-900/20 text-gray-400 border-gray-900/20';
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
          <div className="text-white bg-black/40 px-4 py-3 rounded-xl border border-gray-800">
            {user.email}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Member Since</label>
          <div className="text-white bg-black/40 px-4 py-3 rounded-xl border border-gray-800">
            {new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Subscription Status</label>
          {loading ? (
            <div className="animate-pulse bg-black/40 px-4 py-3 rounded-xl border border-gray-800">
              <div className="h-6 bg-gray-800 rounded w-24"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 px-4 py-3 rounded-xl border border-red-900/20">
              <div className="flex items-center">
                <span className="text-red-400">Failed to load subscription status</span>
              </div>
            </div>
          ) : subscription ? (
            <div className={`px-4 py-3 rounded-xl border ${getStatusColor(subscription.status)}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium capitalize">
                      {subscription.status} Subscription
                    </span>
                  </div>
                </div>

                {subscription.payment_method_brand && (
                  <div className="text-sm opacity-80">
                    Payment method: {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                  </div>
                )}

                {subscription.current_period_end && (
                  <div className="text-sm opacity-80">
                    {subscription.cancel_at_period_end 
                      ? `Cancels on ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`
                      : `Next billing date: ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`
                    }
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-black/40 px-4 py-3 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">No active subscription</span>
                <a 
                  href="/account?tab=subscription" 
                  className="text-[#EC444B] hover:text-[#d83a40] text-sm"
                >
                  View Plans →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;