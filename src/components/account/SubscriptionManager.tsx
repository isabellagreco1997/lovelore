import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import useSupabase from '@/hooks/useSupabase';

interface SubscriptionManagerProps {
  user: User;
}

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    interval: 'month',
    features: [
      { name: 'Access to free stories', included: true },
      { name: 'Basic AI responses', included: true },
      { name: 'Limited chapters per day', included: true },
      { name: 'Premium stories', included: false },
      { name: 'Advanced AI features', included: false },
      { name: 'Unlimited chapters', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    features: [
      { name: 'Access to free stories', included: true },
      { name: 'Basic AI responses', included: true },
      { name: 'Limited chapters per day', included: true },
      { name: 'Premium stories', included: true },
      { name: 'Advanced AI features', included: true },
      { name: 'Unlimited chapters', included: true },
    ],
  },
];

const SubscriptionManager = ({ user }: SubscriptionManagerProps) => {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('basic');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!supabase) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          setCurrentPlan(data.plan_id);
        }
      } catch (error: any) {
        console.error('Error fetching subscription:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [supabase, user]);

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user.id,
        }),
      });

      const { sessionId } = await response.json();
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border ${
              currentPlan === plan.id
                ? 'border-[#EC444B] bg-[#EC444B]/10'
                : 'border-gray-800 bg-black/40'
            } p-6`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-400 ml-2">/{plan.interval}</span>
                </div>
              </div>
              {currentPlan === plan.id && (
                <span className="bg-[#EC444B]/20 text-[#EC444B] px-3 py-1 rounded-full text-sm">
                  Current Plan
                </span>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className={`mr-2 ${feature.included ? 'text-green-400' : 'text-red-400'}`}>
                    {feature.included ? '✓' : '×'}
                  </span>
                  <span className={feature.included ? 'text-white' : 'text-gray-400'}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading || currentPlan === plan.id}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                loading || currentPlan === plan.id
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-[#EC444B] text-white hover:bg-[#d83a40]'
              }`}
            >
              {loading
                ? 'Processing...'
                : currentPlan === plan.id
                ? 'Current Plan'
                : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionManager;