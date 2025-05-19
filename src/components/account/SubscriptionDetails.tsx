import { useState, useEffect } from 'react';
import useSupabase from '@/hooks/useSupabase';

interface SubscriptionDetailsProps {
  userId: string;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  price_id: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  price?: {
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  };
  product?: {
    name: string;
    description: string | null;
  };
}

const SubscriptionDetails = ({ userId }: SubscriptionDetailsProps) => {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
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
        
        const { subscription, error } = await response.json();
        
        if (error) throw new Error(error);
        
        if (subscription && subscription.status === 'active') {
          setSubscription(subscription);
        }
      } catch (error: any) {
        console.error('Error fetching subscription details:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [supabase, userId]);

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  // Helper function to format date from Unix timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to get payment method icon
  const getPaymentMethodIcon = (brand: string | null) => {
    if (!brand) return '💳';
    
    const icons: Record<string, string> = {
      visa: '💳 Visa',
      mastercard: '💳 Mastercard',
      amex: '💳 American Express',
      discover: '💳 Discover',
    };
    
    return icons[brand.toLowerCase()] || `💳 ${brand}`;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-black/40 p-8 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-gray-800 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-900/20 p-8">
        <h3 className="text-xl font-semibold text-white mb-4">Subscription Error</h3>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="rounded-xl border border-gray-800 bg-black/40 p-8">
        <h3 className="text-xl font-semibold text-white mb-4">No Active Subscription</h3>
        <p className="text-gray-400">You don't have an active subscription at the moment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#EC444B] bg-[#EC444B]/10 p-8">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-semibold text-white">Your Subscription</h3>
        <span className="bg-[#EC444B]/20 text-[#EC444B] px-3 py-1 rounded-full text-sm">
          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
        </span>
      </div>
      
      {subscription.product && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-white mb-2">{subscription.product.name}</h4>
          {subscription.product.description && (
            <p className="text-gray-400">{subscription.product.description}</p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="text-sm uppercase text-gray-400 mb-2">Billing Period</h4>
          <div className="bg-black/40 rounded-xl p-4 border border-gray-800">
            <p className="text-white">
              <span className="text-gray-400 mr-2">Current period:</span>
              {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
            </p>
            {subscription.cancel_at_period_end && (
              <p className="text-yellow-400 mt-2">
                Your subscription will cancel at the end of the current period.
              </p>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm uppercase text-gray-400 mb-2">Payment Method</h4>
          <div className="bg-black/40 rounded-xl p-4 border border-gray-800">
            {subscription.payment_method_brand && subscription.payment_method_last4 ? (
              <p className="text-white">
                {getPaymentMethodIcon(subscription.payment_method_brand)} 
                <span className="ml-1">•••• {subscription.payment_method_last4}</span>
              </p>
            ) : (
              <p className="text-gray-400">No payment method found</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button 
          className="text-red-400 hover:text-red-300 transition-colors"
          onClick={() => window.open('https://billing.stripe.com/p/login/test', '_blank')}
        >
          Manage Billing →
        </button>
      </div>
    </div>
  );
};

export default SubscriptionDetails;