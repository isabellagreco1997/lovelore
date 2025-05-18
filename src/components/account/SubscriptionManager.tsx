import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import useSupabase from '@/hooks/useSupabase';
import { products } from '@/stripe-config';

interface SubscriptionManagerProps {
  user: User;
}

const SubscriptionManager = ({ user }: SubscriptionManagerProps) => {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!supabase) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stripe_subscriptions')
          .select('price_id, status')
          .single();

        if (error) throw error;
        if (data && data.status === 'active') {
          setCurrentPlan(data.price_id);
        }
      } catch (error: any) {
        console.error('Error fetching subscription:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [supabase, user]);

  const handleSubscribe = async (priceId: string, mode: 'payment' | 'subscription') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase?.auth.session()?.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/account?success=true`,
          cancel_url: `${window.location.origin}/account?canceled=true`,
          mode,
        }),
      });

      const { sessionId, error: stripeError } = await response.json();

      if (stripeError) {
        throw new Error(stripeError);
      }

      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Subscription Plans</h2>
      
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className={`rounded-xl border ${
              currentPlan === product.priceId
                ? 'border-[#EC444B] bg-[#EC444B]/10'
                : 'border-gray-800 bg-black/40'
            } p-6`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                <div className="mt-2">
                  <p className="text-gray-400">{product.description}</p>
                </div>
              </div>
              {currentPlan === product.priceId && (
                <span className="bg-[#EC444B]/20 text-[#EC444B] px-3 py-1 rounded-full text-sm">
                  Current Plan
                </span>
              )}
            </div>

            <button
              onClick={() => handleSubscribe(product.priceId, product.mode)}
              disabled={loading || currentPlan === product.priceId}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                loading || currentPlan === product.priceId
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-[#EC444B] text-white hover:bg-[#d83a40]'
              }`}
            >
              {loading
                ? 'Processing...'
                : currentPlan === product.priceId
                ? 'Current Plan'
                : product.mode === 'subscription'
                ? 'Subscribe'
                : 'Buy Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionManager;