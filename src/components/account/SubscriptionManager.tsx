import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import useSupabase from '@/hooks/useSupabase';
import SubscriptionDetails from './SubscriptionDetails';

interface SubscriptionManagerProps {
  user: User | null;
}

interface PriceOption {
  id: string;
  priceId: string;
  price: number;
  interval: string;
  intervalCount: number;
  currency: string;
  trialDays: number | null;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  features: { name: string; included: boolean }[];
  mode: 'payment' | 'subscription';
  popular?: boolean;
  images?: string[];
  marketingFeatures?: string[];
  priceOptions: {
    monthly: PriceOption | null;
    yearly: PriceOption | null;
  };
}

const SubscriptionManager = ({ user }: SubscriptionManagerProps) => {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('yearly');
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [productsCache, setProductsCache] = useState<Plan[] | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (productsCache && productsCache.length > 0) {
          setPlans(productsCache);
          return;
        }

        const response = await fetch('/api/stripe-products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        
        const productMap = new Map();
        
        products
          .filter((price: any) => price.active && price.recurring)
          .forEach((price: any) => {
            const product = price.product as any;
            const interval = price.recurring?.interval;
            
            if (!productMap.has(product.id)) {
              productMap.set(product.id, {
                id: product.id,
                name: product.name,
                description: product.description,
                features: getFeatures(product, interval),
                mode: 'subscription',
                popular: product.metadata?.popular === 'true',
                images: product.images || [],
                marketingFeatures: product.marketing_features || [],
                priceOptions: {
                  monthly: null,
                  yearly: null
                }
              });
            }
            
            const priceOption: PriceOption = {
              id: product.id,
              priceId: price.id,
              price: price.unit_amount / 100,
              interval: interval,
              intervalCount: price.recurring.interval_count || 1,
              currency: price.currency || 'usd',
              trialDays: price.recurring.trial_period_days || null
            };
            
            if (interval === 'month') {
              productMap.get(product.id).priceOptions.monthly = priceOption;
            } else if (interval === 'year') {
              productMap.get(product.id).priceOptions.yearly = priceOption;
            }
          });
          
        productMap.set('free', {
          id: 'free',
          name: 'Free',
          description: 'Basic access to Lovelore stories',
          features: [
            { name: 'Access to free stories', included: true },
            { name: 'Basic AI responses', included: true },
            { name: 'Limited chapters', included: true },
            { name: 'Premium stories', included: false },
            { name: 'Advanced AI features', included: false },
            { name: 'Unlimited chapters', included: false }
          ],
          mode: 'payment',
          priceOptions: {
            monthly: null,
            yearly: null
          },
          currency: 'usd',
          images: []
        });
        
        const formattedPlans = Array.from(productMap.values())
          .filter((plan: any) => plan.id === 'free' || plan.priceOptions.monthly || plan.priceOptions.yearly);
        
        setProductsCache(formattedPlans);
        setPlans(formattedPlans);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        setError('Failed to load subscription plans');
      }
    };

    fetchProducts();
  }, [productsCache]);

  const getFeatures = (product: any, interval: string) => {
    if (product.marketing_features && product.marketing_features.length > 0) {
      return product.marketing_features.map((feature: string) => ({
        name: feature,
        included: true
      }));
    } else if (product.features && product.features.length > 0) {
      return product.features.map((feature: string) => ({
        name: feature,
        included: true
      }));
    } else {
      return [
        { name: 'Access to free stories', included: true },
        { name: 'Basic AI responses', included: true },
        { name: 'Limited chapters', included: true },
        { name: 'Premium stories', included: true },
        { name: 'Advanced AI features', included: true },
        { name: 'Unlimited chapters', included: true }
      ];
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!supabase || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No session available for fetching subscription');
          setHasActiveSubscription(false);
          setCurrentPlan(null);
          setLoading(false);
          return;
        }
        
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
        
        const { subscription, error: apiError } = await response.json();
        
        if (apiError) throw new Error(apiError);
        
        if (subscription && subscription.status === 'active') {
          setCurrentPlan(subscription.price_id);
          setHasActiveSubscription(true);
        } else {
          setCurrentPlan(null);
          setHasActiveSubscription(false);
        }
      } catch (error: any) {
        console.error('Error fetching subscription:', error.message);
        setCurrentPlan(null);
        setHasActiveSubscription(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [supabase, user?.id, productsCache]);

  const handleSubscribe = async (priceId: string, mode: 'payment' | 'subscription') => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      setLoading(true);
      setError(null);

      if (!priceId) {
        throw new Error('Invalid price ID: ' + priceId);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to subscribe');
      }

      const requestBody = {
        price_id: priceId,
        success_url: `${window.location.origin}/account?success=true`,
        cancel_url: `${window.location.origin}/account?canceled=true`,
        mode,
      };
      
      const response = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout API error:', errorData);
        throw new Error(errorData.error || `Failed to create checkout session (${response.status})`);
      }

      const { url, error: stripeError } = await response.json();

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        throw new Error(stripeError);
      }

      if (url) {
        window.location.href = url;
        return;
      }

      throw new Error('No checkout URL received');
    } catch (error: any) {
      console.error('Subscription error:', error);
      setError(error.message || 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPriceOption = (plan: Plan) => {
    return plan.priceOptions[billingInterval];
  };

  const calculateSavings = (plan: Plan) => {
    const monthly = plan.priceOptions.monthly;
    const yearly = plan.priceOptions.yearly;
    
    if (!monthly || !yearly) return 0;
    
    const monthlyAnnualCost = monthly.price * 12;
    const yearlyCost = yearly.price;
    
    return Math.round(((monthlyAnnualCost - yearlyCost) / monthlyAnnualCost) * 100);
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      usd: '$',
      eur: '€',
      gbp: '£',
      jpy: '¥',
      cad: 'C$',
      aud: 'A$',
    };
    
    return symbols[currency.toLowerCase()] || currency.toUpperCase() + ' ';
  };

  // Calculate the monthly equivalent price for yearly plans
  const calculateMonthlyPrice = (priceOption: PriceOption | null): number => {
    if (!priceOption) return 0;
    
    if (priceOption.interval === 'year') {
      // For yearly plan, divide by 12 to get monthly equivalent
      return priceOption.price / (12 * (priceOption.intervalCount || 1));
    } else {
      // For monthly plan, just return the price
      return priceOption.price / (priceOption.intervalCount || 1);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-semibold text-white mb-8">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-black/40 p-8 animate-pulse">
              <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
              <div className="h-12 bg-gray-800 rounded w-1/2 mb-8"></div>
              <div className="space-y-4 mb-8">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-6 bg-gray-800 rounded w-full"></div>
                ))}
              </div>
              <div className="h-12 bg-gray-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasActiveSubscription && user) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <SubscriptionDetails userId={user.id} />
        </div>
        
        <div className="mt-12">
          <h3 className="text-lg font-medium text-white mb-4">Available Plans</h3>
          <p className="text-gray-400 mb-6">
            You currently have an active subscription. If you wish to change your plan,
            you can choose from the options below.
          </p>
          
          <div className="mb-8 flex justify-center">
            <div className="inline-flex bg-black/40 rounded-xl p-1 border border-gray-800">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-[#EC444B] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingInterval === 'yearly'
                    ? 'bg-[#EC444B] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-8 bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => {
              if (plan.id !== 'free' && !plan.priceOptions[billingInterval]) return null;
              
              const priceOption = getCurrentPriceOption(plan);
              const savings = plan.id !== 'free' ? calculateSavings(plan) : 0;
              const isPopular = plan.popular || false;
              const isCurrentPlan = priceOption && currentPlan === priceOption.priceId;
              
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border relative ${
                    isCurrentPlan
                      ? 'border-[#EC444B] bg-[#EC444B]/10'
                      : isPopular
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-gray-800 bg-black/40'
                  } p-8 flex flex-col justify-between min-h-[420px] ${
                    isPopular ? 'transform md:scale-105' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                        {priceOption ? (
                          <div className="flex flex-col">
                            <div className="flex items-baseline">
                              <span className="text-3xl font-bold text-white">
                                {getCurrencySymbol(priceOption.currency)}
                                {priceOption.interval === 'year' 
                                  ? calculateMonthlyPrice(priceOption).toFixed(2)
                                  : priceOption.price}
                              </span>
                              <span className="text-gray-400 text-sm ml-2">
                                {priceOption.interval === 'year' ? '/month' : `/${priceOption.interval}`}
                                {priceOption.interval !== 'year' && priceOption.intervalCount > 1 
                                  ? ` (${priceOption.intervalCount} ${priceOption.interval}s)` 
                                  : ''}
                              </span>
                            </div>
                            
                            {priceOption.interval === 'year' && (
                              <div className="text-gray-400 text-sm mt-1">
                                Billed annually
                              </div>
                            )}
                            
                            {billingInterval === 'yearly' && savings > 0 && (
                              <div className="mt-2 text-purple-400 text-sm">
                                Save {savings}% compared to monthly
                              </div>
                            )}
                            
                            {priceOption?.trialDays && (
                              <div className="mt-2 text-green-400 text-sm">
                                Includes {priceOption.trialDays}-day free trial
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-3xl font-bold text-white">Free</span>
                        )}
                      </div>
                      {isCurrentPlan && (
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

                  {(plan.id === 'free' || priceOption) && (
                    <button
                      onClick={() => {
                        if (priceOption && priceOption.priceId) {
                          handleSubscribe(priceOption.priceId, plan.mode);
                        } else if (priceOption) {
                          setError('Invalid price information. Please contact support.');
                        } else {
                          setError('No valid price option available for this plan');
                        }
                      }}
                      disabled={loading || isCurrentPlan || plan.id === 'free'}
                      className={`w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-300 ${
                        loading || isCurrentPlan || plan.id === 'free'
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : isPopular
                          ? 'bg-purple-600 text-white hover:bg-purple-500 transform hover:scale-105'
                          : 'bg-[#EC444B] text-white hover:bg-[#d83a40] transform hover:scale-105'
                      }`}
                    >
                      {loading
                        ? 'Processing...'
                        : isCurrentPlan
                        ? 'Current Plan'
                        : plan.id === 'free'
                        ? 'Free Plan'
                        : plan.mode === 'subscription'
                        ? 'Subscribe'
                        : 'Buy Now'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-xl font-semibold text-white mb-4">Subscription Plans</h2>
      
      <div className="mb-8 flex justify-center">
        <div className="inline-flex bg-black/40 rounded-xl p-1 border border-gray-800">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingInterval === 'monthly'
                ? 'bg-[#EC444B] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingInterval === 'yearly'
                ? 'bg-[#EC444B] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-8 bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => {
          if (plan.id !== 'free' && !plan.priceOptions[billingInterval]) return null;
          
          const priceOption = getCurrentPriceOption(plan);
          const savings = plan.id !== 'free' ? calculateSavings(plan) : 0;
          const isPopular = plan.popular || false;
          const isCurrentPlan = priceOption && currentPlan === priceOption.priceId;
          
          return (
            <div
              key={plan.id}
              className={`rounded-xl border relative ${
                isCurrentPlan
                  ? 'border-[#EC444B] bg-[#EC444B]/10'
                  : isPopular
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-gray-800 bg-black/40'
              } p-8 flex flex-col justify-between min-h-[420px] ${
                isPopular ? 'transform md:scale-105' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                    {priceOption ? (
                      <div className="flex flex-col">
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold text-white">
                            {getCurrencySymbol(priceOption.currency)}
                            {priceOption.interval === 'year' 
                              ? calculateMonthlyPrice(priceOption).toFixed(2)
                              : priceOption.price}
                          </span>
                          <span className="text-gray-400 text-sm ml-2">
                            {priceOption.interval === 'year' ? '/month' : `/${priceOption.interval}`}
                            {priceOption.interval !== 'year' && priceOption.intervalCount > 1 
                              ? ` (${priceOption.intervalCount} ${priceOption.interval}s)` 
                              : ''}
                          </span>
                        </div>
                        
                        {priceOption.interval === 'year' && (
                          <div className="text-gray-400 text-sm mt-1">
                            Billed annually
                          </div>
                        )}
                        
                        {billingInterval === 'yearly' && savings > 0 && (
                          <div className="mt-2 text-purple-400 text-sm">
                            Save {savings}% compared to monthly
                          </div>
                        )}
                        
                        {priceOption?.trialDays && (
                          <div className="mt-2 text-green-400 text-sm">
                            Includes {priceOption.trialDays}-day free trial
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-white">Free</span>
                    )}
                  </div>
                  {isCurrentPlan && (
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

              {(plan.id === 'free' || priceOption) && (
                <button
                  onClick={() => {
                    if (priceOption && priceOption.priceId) {
                      handleSubscribe(priceOption.priceId, plan.mode);
                    } else if (priceOption) {
                      setError('Invalid price information. Please contact support.');
                    } else {
                      setError('No valid price option available for this plan');
                    }
                  }}
                  disabled={loading || isCurrentPlan || plan.id === 'free'}
                  className={`w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-300 ${
                    loading || isCurrentPlan || plan.id === 'free'
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-purple-600 text-white hover:bg-purple-500 transform hover:scale-105'
                      : 'bg-[#EC444B] text-white hover:bg-[#d83a40] transform hover:scale-105'
                  }`}
                >
                  {loading
                    ? 'Processing...'
                    : isCurrentPlan
                    ? 'Current Plan'
                    : plan.id === 'free'
                    ? 'Free Plan'
                    : plan.mode === 'subscription'
                    ? 'Subscribe'
                    : 'Buy Now'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionManager;