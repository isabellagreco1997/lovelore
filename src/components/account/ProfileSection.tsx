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
        
        // Fetch subscription directly from Stripe via API endpoint
        const response = await fetch('/api/stripe-subscription', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch subscription data');
        }
        
        const { subscription: subData } = await response.json();
        setSubscription(subData);
      } catch (error: any) {
        console.error('Error fetching subscription:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [supabase]);

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
            <div className="text-red-400 bg-red-900/20 px-4 py-3 rounded-xl border border-red-900/20">
              Failed to load subscription status
            </div>
          ) : subscription ? (
            <div className="bg-black/40 px-4 py-3 rounded-xl border border-gray-800">
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  subscription.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
                {subscription.price && (
                  <span className="text-gray-400">
                    {subscription.price.amount} {subscription.price.currency.toUpperCase()}/{subscription.price.interval}
                  </span>
                )}
              </div>
              {subscription.current_period_end && (
                <p className="mt-2 text-sm text-gray-400">
                  Next billing date: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="text-gray-400 bg-black/40 px-4 py-3 rounded-xl border border-gray-800">
              No active subscription
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;