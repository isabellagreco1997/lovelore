import { useState, useEffect } from 'react';
import useSupabase from '@/hooks/useSupabase';
import { User } from '@supabase/supabase-js'; // Keep if used elsewhere, or for User type context
// Stripe type can be removed if not directly used for constructing Stripe objects here
// import Stripe from 'stripe'; 
import LoadingSpinner from '../LoadingSpinner';
import { Crown } from 'lucide-react';

interface SubscriptionDetailsProps {
  userId: string;
}

interface CurrentSubscription {
  id: string;
  status: string;
  price_id: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand?: string | null;
  payment_method_last4?: string | null;
  price?: {
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  };
  product?: {
    name: string;
    description?: string | null;
  };
}

const SubscriptionDetails = ({ userId }: SubscriptionDetailsProps) => {
  const supabase = useSupabase();
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!supabase || !userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null); // Reset error on new fetch
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error(sessionError?.message || 'No active session. Please log in.');
        }

        const response = await fetch('/api/stripe-subscription', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch subscription details');
        }
        const data = await response.json();
        if (data.subscription) {
            setSubscription(data.subscription);
        } else {
            // No active subscription found, which is not an error state for this component
            setSubscription(null); 
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching subscription details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptionDetails();

    // Cleanup function to ensure loading state is reset
    return () => {
      setLoading(false);
      setError(null);
    };
  }, [supabase, userId]);

  const handleManageBilling = async () => {
    if (!supabase) return;
    setPortalLoading(true);
    setPortalError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error(sessionError?.message || 'Authentication required to manage billing.');
      }

      const response = await fetch('/api/stripe-portal-link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          // 'Content-Type': 'application/json', // Not needed for an empty body POST
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Could not create billing portal session.');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Billing portal URL not received.');
      }
    } catch (err: any) {
      setPortalError(err.message);
      console.error('Error redirecting to billing portal:', err);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading  ) {
    return (
      <div className="subscription-details-container">
        <LoadingSpinner
          key="subscription-skeleton"
          variant="skeleton"
          skeleton={{
            lines: 4,
            button: true
          }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-2xl shadow-xl"
        />
      </div>
    );
  }

  if (error && !subscription) { // Only show general error if no subscription data could be loaded
    return <div className="text-red-400 bg-red-900/30 backdrop-blur-sm p-6 rounded-xl border border-red-800/50 shadow-xl">Error loading subscription: {error}</div>;
  }

  if (!subscription) {
    return <div className="text-gray-300 p-8 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">You do not have an active subscription. Please choose a plan.</div>;
  }

  const { 
    product,
    price,
    status,
    current_period_end,
    cancel_at_period_end,
    payment_method_brand,
    payment_method_last4
  } = subscription;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-2xl shadow-xl text-white transition-all duration-300 hover:border-gray-700/50">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          <span className="text-xs sm:text-sm font-bold tracking-tight uppercase text-gray-400">
            Active Subscription
          </span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-[#EC444B] leading-tight">
          {product?.name || 'Premium Plan'}
        </h3>
      </div>
      
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <span className="text-gray-400 font-medium text-sm">Status</span>
          <span className={`capitalize px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 text-sm ${
            status === 'active' 
              ? 'bg-green-600/20 text-green-300 border border-green-600/30' 
              : 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30'
          }`}>
            {status}
          </span>
        </div>

        {price && (
          <div className="flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded-lg text-sm border border-gray-700/50">
            <span className="text-gray-400 font-medium">Price</span>
            <span className="text-white font-semibold text-sm">
              {price.amount ? `$${price.amount.toFixed(2)}` : 'N/A'} {price.currency?.toUpperCase()} / {price.interval}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded-lg border border-gray-700/50 text-sm">
          <span className="text-gray-400  text-sm font-medium">{cancel_at_period_end ? 'Expires on' : 'Renews on'}</span>
          <span className="text-white font-semibold text-sm">
            {new Date(current_period_end * 1000).toLocaleDateString()}
          </span>
        </div>

        {payment_method_brand && payment_method_last4 && (
          <div className="flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <span className="text-gray-400 font-medium text-sm">Payment Method</span>
            <span className="text-white font-semibold flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
              <span>{payment_method_brand} ending in {payment_method_last4}</span>
            </span>
          </div>
        )}

        {cancel_at_period_end && (
          <div className="p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <p className="text-yellow-300 text-xs">
                Your subscription will be canceled at the end of the current period ({new Date(current_period_end * 1000).toLocaleDateString()}).
              </p>
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={handleManageBilling}
        disabled={portalLoading}
        className="w-full bg-[#EC444B] hover:bg-[#d83a40] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-[#EC444B]/20 flex items-center justify-center space-x-2 text-sm"
      >
        {portalLoading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Redirecting to Billing...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Manage Billing & Payment</span>
          </>
        )}
      </button>
      
      {portalError && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg backdrop-blur-sm">
          <p className="text-red-400 text-sm flex items-center space-x-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span>Error: {portalError}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetails;