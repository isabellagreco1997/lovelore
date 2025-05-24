import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import useSupabase from '@/hooks/useSupabase';
import SubscriptionDetails from './SubscriptionDetails';
import LoadingSpinner from '../LoadingSpinner';

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
  mode: 'payment' | 'subscription' | 'display';
  popular?: boolean;
  images?: string[];
  marketingFeatures?: string[];
  priceOptions: {
    monthly: PriceOption | null;
    yearly: PriceOption | null;
  };
  currency?: string;
  imageTitle?: string;
  imageSubtitle?: string;
  type?: string;
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
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        if (productsCache && productsCache.length > 0) {
          setPlans(productsCache);
          setLoading(false);
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
                images: product.images || ["https://cdn.midjourney.com/3bac93b1-d7cb-49a7-92b0-3d144242056c/0_0.png"],
                marketingFeatures: product.marketing_features || [],
                priceOptions: {
                  monthly: null,
                  yearly: null
                },
                currency: price.currency || 'usd',
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
            { name: 'Premium stories', included: false },
            { name: 'Advanced AI features', included: false },
            { name: 'Unlimited chapters', included: false },
            { name: 'Access to early access stories', included: false },
          ],
          mode: 'payment',
          priceOptions: {
            monthly: null,
            yearly: null
          },
          currency: 'usd',
          images: []
        });
        
        // Add special image card
        productMap.set('image-card', {
          id: 'image-card',
          name: 'Discover Premium',
          description: 'Unlock exclusive content and features',
          type: 'image-card',
          features: [],
          mode: 'display',
          priceOptions: {
            monthly: null,
            yearly: null
          },
          images: ['/images/premium-preview.jpg'], // You can customize this image path
          imageTitle: 'Premium Stories Await',
          imageSubtitle: 'Dive into enchanting tales with advanced AI companions'
        });
        
        const formattedPlans = Array.from(productMap.values())
          .filter((plan: any) => plan.id === 'free' || plan.id === 'image-card' || plan.priceOptions.monthly || plan.priceOptions.yearly);
        
        setProductsCache(formattedPlans);
        setPlans(formattedPlans);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        setError('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Cleanup function to ensure loading state is reset
    return () => {
      setLoading(false);
      setError(null);
    };
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
        setSubscriptionLoading(false);
        return;
      }

      try {
        setSubscriptionLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No session available for fetching subscription');
          setHasActiveSubscription(false);
          setCurrentPlan(null);
          setSubscriptionLoading(false);
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
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();

    // Cleanup function to ensure subscription loading state is reset
    return () => {
      setSubscriptionLoading(false);
    };
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

  if (loading || subscriptionLoading || plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" key="subscription-manager-loading">
        <LoadingSpinner size="xl" theme="pink" />
      </div>
    );
  }

  if (hasActiveSubscription && user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
 
        <div className="mb-10">
          <SubscriptionDetails userId={user.id} />
        </div>
        
        <div className="mt-14">
    
          <div className="mb-10 flex justify-center">
            <div className="relative inline-flex bg-gray-900/90 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-700/50 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-blue-600/20 rounded-2xl"></div>
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  billingInterval === 'monthly'
                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 transform scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  billingInterval === 'yearly'
                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 transform scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  Yearly
                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs rounded-full">
                    Save 50%
                  </span>
                </span>
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-red-500/30 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative bg-red-900/50 backdrop-blur-xl border border-red-500/40 text-red-300 p-5 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((plan) => {
              if (plan.id !== 'free' && plan.id !== 'image-card' && !plan.priceOptions[billingInterval]) return null;
              
              // Special rendering for image card
              if (plan.type === 'image-card') {
                return (
                  <div
                    key={plan.id}
                    className="group relative transition-all duration-500 hover:transform hover:scale-105"
                  >
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-50 transition-all duration-500 group-hover:opacity-70 group-hover:blur-2xl bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-rose-600/40"></div>
                    
                    <div className="relative rounded-2xl border border-purple-500/60 bg-gradient-to-br from-purple-900/30 to-pink-900/20 shadow-2xl shadow-purple-500/25 backdrop-blur-xl transition-all duration-500 overflow-hidden min-h-[380px] group-hover:shadow-2xl">
                      
                      {/* Simple Image Display */}
                      {plan.images && plan.images[0] ? (
                        <img 
                          src='https://cdn.midjourney.com/3bac93b1-d7cb-49a7-92b0-3d144242056c/0_0.png' 
                          alt={plan.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-2xl"
                          onError={(e) => {
                            // Fallback to gradient background if image fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-2xl">
                          <span className="text-6xl">✨</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              
              const priceOption = getCurrentPriceOption(plan);
              const savings = plan.id !== 'free' ? calculateSavings(plan) : 0;
              const isPopular = plan.popular || false;
              const isCurrentPlan = priceOption && currentPlan === priceOption.priceId;
              
              return (
                <div
                  key={plan.id}
                  className={`group relative transition-all duration-500 hover:transform hover:scale-105 ${
                    isPopular ? 'order-first md:order-none' : ''
                  }`}
                >
                  {/* Animated gradient background */}
                  <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 transition-all duration-500 group-hover:opacity-70 group-hover:blur-2xl ${
                    isCurrentPlan
                      ? 'bg-gradient-to-br from-pink-500/40 via-rose-500/30 to-pink-600/40 animate-pulse'
                      : isPopular
                      ? 'bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-rose-600/40'
                      : 'bg-gradient-to-br from-gray-600/30 via-gray-700/20 to-gray-800/30'
                  }`}></div>
                  
                  <div className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-500 ${
                    isCurrentPlan
                      ? 'border-pink-500/60 bg-gradient-to-br from-pink-900/30 to-rose-800/20 shadow-2xl shadow-pink-500/25'
                      : isPopular
                      ? 'border-purple-500/60 bg-gradient-to-br from-purple-900/30 to-pink-900/20 shadow-2xl shadow-purple-500/25'
                      : 'border-gray-700/60 bg-gradient-to-br from-gray-900/90 to-gray-800/80 shadow-xl'
                  } p-6 flex flex-col justify-between min-h-[380px] group-hover:shadow-2xl`}>
                    
                    {/* Popular badge */}
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75"></div>
                          <span className="relative bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            POPULAR
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Active badge */}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 right-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full blur opacity-75"></div>
                          <span className="relative bg-gradient-to-r from-pink-500 to-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            ACTIVE 
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white">{plan.name && !plan.name.includes('Free')}</h3>
                    
                          </div>
                          {priceOption ? (
                            <div className="flex flex-col">
                              <div className="flex items-baseline mb-1">
                                <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                  {getCurrencySymbol(priceOption.currency)}
                                  {priceOption.interval === 'year' 
                                    ? calculateMonthlyPrice(priceOption).toFixed(2)
                                    : priceOption.price}
                                </span>
                                <span className="text-gray-400 text-sm ml-2 font-medium">
                                  {priceOption.interval === 'year' ? '/month' : `/${priceOption.interval}`}
                                </span>
                              </div>
                              
                       
                              
                              {billingInterval === 'yearly' && savings > 0 && (
                                <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/40 rounded-lg">
                                  <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                                    <path fillRule="evenodd" d="M9.707 2.293a1 1 0 010 1.414L6.414 7H15a1 1 0 110 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" clipRule="evenodd"/>
                                  </svg>
                                  <span className="text-purple-300 text-xs font-semibold">
                                    {savings}% OFF
                                  </span>
                                </div>
                              )}
                              
                              {priceOption?.trialDays && (
                                <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-gradient-to-r from-green-600/30 to-emerald-600/30 border border-green-500/40 rounded-lg">
                                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                  </svg>
                                  <span className="text-green-300 text-xs font-semibold">
                                    {priceOption.trialDays}d trial
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Free</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm group/feature">
                            <div className={`mr-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 group-hover/feature:scale-110 ${
                              feature.included 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/30' 
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30'
                            }`}>
                              {feature.included ? '✓' : '×'}
                            </div>
                            <span className={`transition-colors duration-300 ${
                              feature.included ? 'text-gray-200 group-hover/feature:text-white' : 'text-gray-500'
                            }`}>
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(plan.id === 'free' || priceOption) && (
                      <button
                        onClick={() => {
                          if (priceOption && priceOption.priceId && plan.mode !== 'display') {
                            handleSubscribe(priceOption.priceId, plan.mode as 'payment' | 'subscription');
                          } else if (priceOption) {
                            setError('Invalid price information. Please contact support.');
                          } else {
                            setError('No valid price option available for this plan');
                          }
                        }}
                        disabled={loading || hasActiveSubscription || plan.id === 'free'}
                        className={`relative w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden group/button ${
                          loading || hasActiveSubscription || plan.id === 'free'
                            ? 'bg-gray-800/60 text-gray-500 cursor-not-allowed border border-gray-700/50'
                            : isPopular
                            ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transform hover:scale-105 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                            : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white hover:from-pink-400 hover:to-rose-500 transform hover:scale-105 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50'
                        }`}
                      >
                        {!loading && !hasActiveSubscription && plan.id !== 'free' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></div>
                        )}
                        <span className="relative flex items-center justify-center gap-2">
                          {loading && (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {loading
                            ? 'Processing...'
                            : isCurrentPlan
                            ? 'Current Plan'
                            : hasActiveSubscription && !isCurrentPlan
                            ? 'Active Subscription'
                            : plan.id === 'free'
                            ? 'Free Plan'
                            : plan.mode === 'subscription'
                            ? 'Get Started'
                            : 'Buy Now'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-4">
       
          <h2 className="font-bold text-white text-2xl sm:text-3xl uppercase tracking-wider leading-none mb-0">
            Choose Your Perfect Plan
          </h2>
        </div>
        <p className="text-sm text-gray-400 font-light">
          Unlock premium stories and advanced AI features with our gorgeous subscription plans
        </p>
      </div>
      
      <div className="mb-10 flex justify-center">
        <div className="relative inline-flex bg-gray-900/90 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-700/50 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-blue-600/20 rounded-2xl"></div>
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              billingInterval === 'monthly'
                ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 transform scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              billingInterval === 'yearly'
                ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 transform scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              Yearly
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs rounded-full">
                Save 50% 💖
              </span>
            </span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-red-500/30 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
          <div className="relative bg-red-900/50 backdrop-blur-xl border border-red-500/40 text-red-300 p-5 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => {
          if (plan.id !== 'free' && plan.id !== 'image-card' && !plan.priceOptions[billingInterval]) return null;
          
          // Special rendering for image card
          if (plan.type === 'image-card') {
            return (
              <div
                key={plan.id}
                className="group relative transition-all duration-500 hover:transform hover:scale-105"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 rounded-2xl blur-xl opacity-50 transition-all duration-500 group-hover:opacity-70 group-hover:blur-2xl bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-rose-600/40"></div>
                
                <div className="relative rounded-2xl border border-purple-500/60 bg-gradient-to-br from-purple-900/30 to-pink-900/20 shadow-2xl shadow-purple-500/25 backdrop-blur-xl transition-all duration-500 overflow-hidden min-h-[380px] group-hover:shadow-2xl">
                  
                  {/* Simple Image Display */}
                  {plan.images && plan.images[0] ? (
                    <img 
                      src="https://cdn.midjourney.com/3bac93b1-d7cb-49a7-92b0-3d144242056c/0_0.png"
                      alt={plan.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-2xl"
                      onError={(e) => {
                        // Fallback to gradient background if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-2xl">
                      <span className="text-6xl">✨</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }
          
          const priceOption = getCurrentPriceOption(plan);
          const savings = plan.id !== 'free' ? calculateSavings(plan) : 0;
          const isPopular = plan.popular || false;
          const isCurrentPlan = priceOption && currentPlan === priceOption.priceId;
          
          return (
            <div
              key={plan.id}
              className={`group relative transition-all duration-500 hover:transform hover:scale-105 ${
                isPopular ? 'order-first md:order-none' : ''
              }`}
            >
              {/* Animated gradient background */}
              <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 transition-all duration-500 group-hover:opacity-70 group-hover:blur-2xl ${
                isCurrentPlan
                  ? 'bg-gradient-to-br from-pink-500/40 via-rose-500/30 to-pink-600/40 animate-pulse'
                  : isPopular
                  ? 'bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-rose-600/40'
                  : 'bg-gradient-to-br from-gray-600/30 via-gray-700/20 to-gray-800/30'
              }`}></div>
              
              <div className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-500 ${
                isCurrentPlan
                  ? 'border-pink-500/60 bg-gradient-to-br from-pink-900/30 to-rose-800/20 shadow-2xl shadow-pink-500/25'
                  : isPopular
                  ? 'border-purple-500/60 bg-gradient-to-br from-purple-900/30 to-pink-900/20 shadow-2xl shadow-purple-500/25'
                  : 'border-gray-700/60 bg-gradient-to-br from-gray-900/90 to-gray-800/80 shadow-xl'
              } p-6 flex flex-col justify-between min-h-[380px] group-hover:shadow-2xl`}>
                
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75"></div>
                      <span className="relative bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        POPULAR
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Active badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full blur opacity-75"></div>
                      <span className="relative bg-gradient-to-r from-pink-500 to-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        ACTIVE ✨
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                   
                      </div>
                      {priceOption ? (
                        <div className="flex flex-col">
                          <div className="flex items-baseline mb-1">
                            <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                              {getCurrencySymbol(priceOption.currency)}
                              {priceOption.interval === 'year' 
                                ? calculateMonthlyPrice(priceOption).toFixed(2)
                                : priceOption.price}
                            </span>
                            <span className="text-gray-400 text-sm ml-2 font-medium">
                              {priceOption.interval === 'year' ? '/month' : `/${priceOption.interval}`}
                            </span>
                          </div>
                          
                       
                          
                          {billingInterval === 'yearly' && savings > 0 && (
                            <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/40 rounded-lg">
                              <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                                <path fillRule="evenodd" d="M9.707 2.293a1 1 0 010 1.414L6.414 7H15a1 1 0 110 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                              <span className="text-purple-300 text-xs font-semibold">
                                {savings}% OFF
                              </span>
                            </div>
                          )}
                          
                          {priceOption?.trialDays && (
                            <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-gradient-to-r from-green-600/30 to-emerald-600/30 border border-green-500/40 rounded-lg">
                              <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                              <span className="text-green-300 text-xs font-semibold">
                                {priceOption.trialDays}d trial
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Free</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm group/feature">
                        <div className={`mr-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 group-hover/feature:scale-110 ${
                          feature.included 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/30' 
                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30'
                        }`}>
                          {feature.included ? '✓' : '×'}
                        </div>
                        <span className={`transition-colors duration-300 ${
                          feature.included ? 'text-gray-200 group-hover/feature:text-white' : 'text-gray-500'
                        }`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {(plan.id === 'free' || priceOption) && (
                  <button
                    onClick={() => {
                      if (priceOption && priceOption.priceId && plan.mode !== 'display') {
                        handleSubscribe(priceOption.priceId, plan.mode as 'payment' | 'subscription');
                      } else if (priceOption) {
                        setError('Invalid price information. Please contact support.');
                      } else {
                        setError('No valid price option available for this plan');
                      }
                    }}
                    disabled={loading || hasActiveSubscription || plan.id === 'free'}
                    className={`relative w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden group/button ${
                      loading || hasActiveSubscription || plan.id === 'free'
                        ? 'bg-gray-800/60 text-gray-500 cursor-not-allowed border border-gray-700/50'
                        : isPopular
                        ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transform hover:scale-105 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                        : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white hover:from-pink-400 hover:to-rose-500 transform hover:scale-105 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50'
                    }`}
                  >
                    {!loading && !hasActiveSubscription && plan.id !== 'free' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></div>
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                      {loading && (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {loading
                        ? 'Processing...'
                        : isCurrentPlan
                        ? 'Current Plan'
                        : hasActiveSubscription && !isCurrentPlan
                        ? 'Active Subscription'
                        : plan.id === 'free'
                        ? 'Free Plan'
                        : plan.mode === 'subscription'
                        ? 'Get Started'
                        : 'Buy Now'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionManager;