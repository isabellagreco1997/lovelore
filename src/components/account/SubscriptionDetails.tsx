import { useState, useEffect } from 'react';
import useSupabase from '@/hooks/useSupabase';
import { User } from '@supabase/supabase-js'; // Keep if used elsewhere, or for User type context
// Stripe type can be removed if not directly used for constructing Stripe objects here
// import Stripe from 'stripe'; 

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

  if (loading) {
    return (
      <div className="bg-black/20 border border-gray-800 p-6 rounded-xl shadow-lg animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-700 rounded w-full mt-4"></div>
      </div>
    );
  }

  if (error && !subscription) { // Only show general error if no subscription data could be loaded
    return <div className="text-red-400 bg-red-900/30 p-4 rounded-md">Error loading subscription: {error}</div>;
  }

  if (!subscription) {
    return <div className="text-gray-300 p-6 rounded-xl bg-black/20 border border-gray-800">You do not have an active subscription. Please choose a plan.</div>;
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
    <div className="bg-black/20 border border-gray-800 p-6 rounded-xl shadow-lg text-white">
      <h3 className="text-2xl font-semibold mb-6 text-[#EC444B]">{product?.name || 'Your Subscription'}</h3>
      
      <div className="space-y-3 mb-6">
        <p><strong className="text-gray-400">Status:</strong> <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-600/20 text-green-300' : 'bg-yellow-600/20 text-yellow-300'}`}>{status}</span></p>
        {price && (
          <p><strong className="text-gray-400">Price:</strong> {price.amount ? `$${price.amount.toFixed(2)}` : 'N/A'} {price.currency?.toUpperCase()} / {price.interval}</p>
        )}
        <p><strong className="text-gray-400">{cancel_at_period_end ? 'Expires on' : 'Renews on'}:</strong> {new Date(current_period_end * 1000).toLocaleDateString()}</p>
        {payment_method_brand && payment_method_last4 && (
          <p><strong className="text-gray-400">Payment Method:</strong> {payment_method_brand} ending in {payment_method_last4}</p>
        )}
        {cancel_at_period_end && (
          <p className="text-yellow-400">Your subscription will be canceled at the end of the current period ({new Date(current_period_end * 1000).toLocaleDateString()}).</p>
        )}
      </div>

      <button 
        onClick={handleManageBilling}
        disabled={portalLoading}
        className="w-full bg-[#EC444B] hover:bg-[#d83a40] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {portalLoading ? 'Redirecting to Billing...' : 'Manage Billing & Payment'}
      </button>
      {portalError && <p className="text-red-400 mt-3 text-sm">Error: {portalError}</p>}
    </div>
  );
};

export default SubscriptionDetails;