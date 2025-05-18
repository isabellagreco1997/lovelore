import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import useSupabase from '@/hooks/useSupabase';

interface SubscriptionManagerProps {
  user: User;
}

interface Plan {
  id: string;
  name: string;
  features: { name: string; included: boolean }[];
  price: number | null;
  priceId?: string;
  mode?: 'payment' | 'subscription';
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 47.99,
    priceId: 'price_1RQ7zdA5F3yID83zkNUSPBfu',
    mode: 'subscription',
    popular: true,
    features: [
      { name: 'Access to free stories', included: true },
      { name: 'Basic AI responses', included: true },
      { name: 'Limited chapters per day', included: true },
      { name: 'Premium stories', included: true },
      { name: 'Advanced AI features', included: true },
      { name: 'Unlimited chapters', included: true },
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 7.99,
    priceId: 'price_1RQ7xKA5F3yID83zA3CX9OxY',
    mode: 'subscription',
    features: [
      { name: 'Access to free stories', included: true },
      { name: 'Basic AI responses', included: true },
      { name: 'Limited chapters per day', included: true },
      { name: 'Premium stories', included: true },
      { name: 'Advanced AI features', included: true },
      { name: 'Unlimited chapters', included: true },
    ],
  },
  {
    id: 'one-month',
    name: 'One-Month Pass',
    price: 5.99,
    priceId: 'price_1RQ84GA5F3yID83zA886qepx',
    mode: 'payment',
    features: [
      { name: 'Access to free stories', included: true },
      { name: 'Basic AI responses', included: true },
      { name: 'Limited chapters per day', included: true },
      { name: 'Premium stories', included: true },
      { name: 'Advanced AI features', included: true },
      { name: 'Unlimited chapters', included: true },
    ],
  },
  {
    id: 'free',
    name: 'Free',
    price: null,
    features: [
      { name: 'Access to free stories', included: true },
      { name: 'Basic AI responses', included: true },
      { name: 'Limited chapters per day', included: true },
      { name: 'Premium stories', included: false },
      { name: 'Advanced AI features', included: false },
      { name: 'Unlimited chapters', included: false },
    ],
  },
];

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
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-xl font-semibold text-white mb-8">Subscription Plans</h2>
      
      {error && (
        <div className="mb-8 bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border relative ${
              currentPlan === plan.priceId
                ? 'border-[#EC444B] bg-[#EC444B]/10'
                : plan.popular
                ? 'border-purple-500 bg-purple-900/20'
                : 'border-gray-800 bg-black/40'
            } p-8 flex flex-col justify-between min-h-[420px] ${
              plan.popular ? 'transform md:scale-105' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              </div>
            )}
            <div>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">
                      {plan.price ? `£${plan.price}` : 'Free'}
                    </span>
                    {plan.mode === 'subscription' && (
                      <span className="text-gray-400 text-sm ml-2">
                        /{plan.id === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {plan.id === 'yearly' && (
                    <div className="mt-2 text-purple-400 text-sm">
                      Save 60% compared to monthly
                    </div>
                  )}
                </div>
                {currentPlan === plan.priceId && (
                  <span className="bg-[#EC444B]/20 text-[#EC444B] px-3 py-1 rounded-full text-sm whitespace-nowrap">
                    Current Plan
                  </span>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-base">
                    <span className={`mr-3 text-lg ${feature.included ? 'text-green-400' : 'text-red-400'}`}>
                      {feature.included ? '✓' : '×'}
                    </span>
                    <span className={feature.included ? 'text-white' : 'text-gray-400'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {plan.priceId && (
              <button
                onClick={() => handleSubscribe(plan.priceId!, plan.mode!)}
                disabled={loading || currentPlan === plan.priceId}
                className={`w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-300 ${
                  loading || currentPlan === plan.priceId
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-purple-600 text-white hover:bg-purple-500 transform hover:scale-105'
                    : 'bg-[#EC444B] text-white hover:bg-[#d83a40] transform hover:scale-105'
                }`}
              >
                {loading
                  ? 'Processing...'
                  : currentPlan === plan.priceId
                  ? 'Current Plan'
                  : plan.mode === 'subscription'
                  ? 'Subscribe'
                  : 'Buy Now'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionManager;