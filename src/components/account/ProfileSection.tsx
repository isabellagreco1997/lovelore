import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import useSupabase from '@/hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

interface ProfileSectionProps {
  user: User;
}

const ProfileSection = ({ user }: ProfileSectionProps) => {
  const supabase = useSupabase();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [supabase, user.id]);

  const fetchSubscriptionDetails = async () => {
    if (!supabase) return;

    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session available');
        return;
      }
      
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
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
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <span className="w-8 h-8 mr-3 rounded-full bg-[#EC444B] flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
        Profile Information
      </h2>
      
      {/* Email Card */}
      <div className="bg-black/40 border border-gray-800 rounded-xl p-6 mb-6 hover:border-[#EC444B]/50 transition-colors duration-300">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#EC444B]/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#EC444B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Email Address</div>
            <div className="text-white font-medium">
              {user.email}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Member Since Card */}
        <div className="bg-black/40 border border-gray-800 rounded-xl p-6 hover:border-[#EC444B]/50 transition-colors duration-300">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#EC444B]/10 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#EC444B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Member Since</div>
              <div className="text-white font-medium">
                {new Date(user.created_at).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-black/40 border border-gray-800 rounded-xl p-6 hover:border-[#EC444B]/50 transition-colors duration-300">
          <div className="flex items-center space-x-4 mb-3">
            <div className="p-3 bg-[#EC444B]/10 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#EC444B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Subscription</div>
              {loading ? (
                <LoadingSpinner
                  variant="pulse"
                  size="sm"
                  className="h-5 w-20"
                />
              ) : (
                <div className="text-white font-medium">
                  {subscription ? 'Active Plan' : 'No Active Plan'}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner
              variant="pulse"
              size="md"
              className="h-10 w-full"
            />
          ) : error ? (
            <div className="text-red-400 text-sm">Failed to load subscription status</div>
          ) : subscription ? (
            <div className="space-y-2">
              <div className={`text-sm px-3 py-1 rounded-full inline-block ${getStatusColor(subscription.subscription_status)}`}>
                {subscription.subscription_status.charAt(0).toUpperCase() + subscription.subscription_status.slice(1)}
              </div>

              {subscription.payment_method_brand && (
                <div className="text-sm text-gray-300">
                  {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                </div>
              )}

              {subscription.current_period_end && (
                <div className="text-sm text-gray-300">
                  {subscription.cancel_at_period_end 
                    ? `Cancels on ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`
                    : `Next billing: ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`
                  }
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <a 
                href="/account?tab=subscription" 
                className="inline-block bg-[#EC444B] hover:bg-[#d83a40] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                View Plans
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;