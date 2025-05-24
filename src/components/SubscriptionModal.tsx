import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gem, HeartCrack, Heart } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// New interface for displayed plan information
interface DisplayPlanInfo {
  priceId: string; // Stripe Price ID
  productName: string; // Stripe Product Name
  amount: number; // Price in smallest currency unit (e.g., cents) for the WHOLE interval
  currency: string;
  intervalDisplay: string; // User-friendly interval, e.g., "12 Months", "1 Month"
  isPopular: boolean; // For "Best Value" badge
  recurringInterval: string; // 'month' or 'year'
  intervalCount: number; // from Stripe's price.recurring.interval_count
  // Add other relevant fields from Stripe if needed, e.g., description
}

const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  // Changed state to hold an array of plans
  const [displayedPlans, setDisplayedPlans] = useState<DisplayPlanInfo[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoaded(false);
      // Reset plans when modal closes to refetch next time
      setDisplayedPlans([]); 
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || displayedPlans.length > 0) return; // Don't refetch if already loaded or modal closed

    const fetchAndProcessPrices = async () => {
      setLoadingPrices(true);
      setError(null);
      try {
        const response = await fetch('/api/stripe-products');
        if (!response.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        const allPricesFromApi = await response.json(); // Array of Stripe Price objects

        if (!Array.isArray(allPricesFromApi)) {
          console.error("API did not return an array for stripe-products:", allPricesFromApi);
          throw new Error('Invalid data format for subscription plans.');
        }
        
        const plans: DisplayPlanInfo[] = allPricesFromApi
          .filter((price: any) => price.active === true && price.recurring) // Only active, recurring prices
          .map((price: any) => {
            let intervalDisplay = '';
            if (price.recurring.interval === 'month') {
              intervalDisplay = price.recurring.interval_count === 1 ? 'Monthly Subscription' : `${price.recurring.interval_count} Months`;
            } else if (price.recurring.interval === 'year') {
              intervalDisplay = price.recurring.interval_count === 1 ? '1 Year' : `${price.recurring.interval_count} Years`;
            } else {
              intervalDisplay = `${price.recurring.interval_count} ${price.recurring.interval}(s)`; // Fallback, should be rare
            }

            // Check for product object and its metadata
            const product = price.product;
            const isPopular = product && product.metadata && product.metadata.popular === 'true';

            return {
              priceId: price.id,
              productName: product?.name || 'Unnamed Plan',
              amount: price.unit_amount, // This is the total amount for the interval
              currency: price.currency,
              intervalDisplay: intervalDisplay,
              isPopular: isPopular,
              recurringInterval: price.recurring.interval,
              intervalCount: (Number(price.recurring.interval_count) > 0 ? Number(price.recurring.interval_count) : 1), // Ensure intervalCount is a positive number
            };
          })
          .sort((a, b) => { // Optional: sort by popularity, then by interval (e.g. monthly, then yearly)
            if (a.isPopular && !b.isPopular) return -1;
            if (!a.isPopular && b.isPopular) return 1;
            // Add more sorting logic if needed, e.g. by price or interval length
            return 0; 
          });

        setDisplayedPlans(plans);

      } catch (err: any) {
        setError(err.message || 'Could not load subscription plans.');
        console.error("Error fetching/processing prices for modal:", err);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchAndProcessPrices();
  }, [isOpen, displayedPlans.length]); // Re-run if isOpen changes or plans are reset

  if (!isOpen) return null;

  
  const formatPrice = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', { // Adjust locale as needed
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };


  return (
    <div 
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-[#EC444B] rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl transition-all duration-500 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] overflow-auto">
          {/* Left side - Content */}
          <div className="p-6 md:p-12 flex-1 overflow-y-auto border-r border-[#EC444B]/20 md:border-r">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 uppercase">
              <span className="text-white">Get </span>
              <span className="bg-gradient-to-r from-[#EC444B] via-[#ff5a61] to-[#EC444B] bg-clip-text text-transparent">
                Premium Access 
              </span>
              <span className="text-white"> Today! 💭</span>
              
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-5 md:mb-8">
              Unlock all features and get the best experience.
            </p>

            {/* Pricing Plans - Now Dynamic */}
            {loadingPrices && <div className="text-center text-white py-6">Loading plans...</div>}
            {error && <div className="text-center text-red-400 py-6">Error: {error}</div>}
            {!loadingPrices && !error && displayedPlans.length === 0 && (
              <div className="text-center text-gray-400 py-6">No subscription plans currently available.</div>
            )}

            {!loadingPrices && !error && displayedPlans.length > 0 && (
              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                {displayedPlans.map((plan) => {
                  // Calculate effective monthly price
                  let amountPerMonth = plan.amount; // Default to total amount
                  // plan.intervalCount is guaranteed to be a positive number (>=1) by the mapping logic
                  // plan.amount is expected to be a number from Stripe (unit_amount)

                  if (plan.intervalDisplay === '1 Year') {
                    // For a yearly price (e.g., 1 year, 2 years), divide by (12 * number of years)
                    amountPerMonth = plan.amount / (12 * (plan.intervalCount || 1));
                  } else if (plan.recurringInterval === 'month') {
                    // For a monthly price (e.g., 1 month, 3 months), divide by the number of months
                    amountPerMonth = plan.amount / (plan.intervalCount || 1);
                  }
                  // If recurringInterval is neither 'year' nor 'month' (unlikely for these subscriptions),
                  // amountPerMonth remains plan.amount. The display label is always "/month", 
                  // so this could be misleading if new, unhandled interval types are introduced.
                  // Current plan fetching logic filters for month/year intervals primarily.

                  return (
                    <div 
                      key={plan.priceId} 
                      className={`border rounded-lg p-3 md:p-4 relative transition-all duration-300 hover:border-[#EC444B]/40 ${
                        plan.isPopular 
                          ? 'bg-[#EC444B]/5 border-[#EC444B]/30' 
                          : 'bg-gray-900/30 border-gray-700'
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-2 md:-top-3 right-3 md:right-4 bg-gradient-to-r from-[#EC444B] via-[#ff5a61] to-[#EC444B] text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm shadow-lg border border-white/20">
                          <span className="relative z-10 font-bold drop-shadow-sm">Best Value</span>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full"></div>
                        </div>
                      )}
                      {plan.recurringInterval === 'year' && (
                        <div className="absolute -top-2 md:-top-3 left-3 md:left-4 bg-gradient-to-r from-[#EC444B] via-[#ff5a61] to-[#EC444B] text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm shadow-lg border border-white/20">
                          <span className="relative z-10 font-bold drop-shadow-sm flex items-center space-x-1">
                            <Heart className="w-3 h-3 fill-current" />
                            <span>Most Popular</span>
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full"></div>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-white">{plan.productName}</h3>
                          {/* intervalDisplay shows the full duration e.g., "1 Year" or "3 Months" */}
                          <p className="text-sm md:text-base text-gray-400">{plan.recurringInterval === 'year' ? 'Pay Annually' : 'Pay Monthly'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl md:text-2xl font-bold text-white">
                            {formatPrice(amountPerMonth, plan.currency)}
                          </div>
                          {/* Unit is now always /month based on the calculation above */}
                          <div className="text-sm md:text-base text-gray-400">/month</div> 
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mobile layout with Benefits and Image side by side */}
            <div className="block md:hidden flex flex-">
              {/* Premium Benefits (mobile) */}
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Premium Benefits</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span className="text-[#EC444B]">✓</span>
                  <span>Access to all premium stories</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span className="text-[#EC444B]">✓</span>
                  <span>Unlimited chapters</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span className="text-[#EC444B]">✓</span>
                  <span>Advanced AI responses</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span className="text-[#EC444B]">✓</span>
                  <span>Early access to new features</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span className="text-[#EC444B]">✓</span>
                  <span>Cancel anytime</span>
                </div>
              </div>
              
              {/* Mobile image next to benefits */}
              <div className="flex-1 max-h-[260px] relative ml-4 opacity-50">
                <img
                  src="https://cdn.midjourney.com/31141df3-bd5d-46bf-a84c-74a6e161fe1f/0_3.png"
                  alt="Premium Experience"
                  className="w-full h-full object-cover rounded-lg border border-gray-700"
                />
              </div>
            </div>
            
            {/* Premium Benefits (desktop) */}
            <div className="hidden md:block space-y-3">
              <h3 className="text-xl font-semibold text-white mb-4">Premium Benefits</h3>
              <div className="flex items-center space-x-3 text-base text-gray-300">
                <span className="text-[#EC444B]">✓</span>
                <span>Access to all premium stories</span>
              </div>
              <div className="flex items-center space-x-3 text-base text-gray-300">
                <span className="text-[#EC444B]">✓</span>
                <span>Unlimited chapters</span>
              </div>
              <div className="flex items-center space-x-3 text-base text-gray-300">
                <span className="text-[#EC444B]">✓</span>
                <span>Advanced AI responses</span>
              </div>
              <div className="flex items-center space-x-3 text-base text-gray-300">
                <span className="text-[#EC444B]">✓</span>
                <span>Early access to new features</span>
              </div>
            </div>
          </div>

          {/* Right side - Image and CTA */}
          <div className="relative w-full md:w-[400px] bg-black p-6 md:p-8 flex flex-col min-h-[200px] md:min-h-0">
            {/* Desktop only image */}
            <img
              src="https://cdn.midjourney.com/31141df3-bd5d-46bf-a84c-74a6e161fe1f/0_3.png"
              alt="Premium Experience"
              className="absolute inset-0 w-full h-full object-cover opacity-20 md:opacity-70 hidden md:block rounded-r-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 hidden md:block rounded-r-xl"></div>

            <div className="relative z-10 flex flex-col justify-center md:justify-start h-full">
              <div className="md:mt-auto space-y-4 md:space-y-6">
                <button
                  onClick={() => {
                    onClose();
                    // The account page now reads the tab parameter correctly
                    router.push('/account?tab=subscription');
                  }}
                  className="w-full bg-[#EC444B] hover:bg-[#d83a40] text-white py-3 md:py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-base md:text-lg"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Gem className="w-5 h-5" />
                    <span>Upgrade to Premium</span>
                  </span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-transparent border border-[#EC444B] text-gray-300 hover:text-white hover:border-[#EC444B] hover:bg-[#EC444B]/5 py-3 md:py-4 rounded-lg font-semibold transition-colors text-base md:text-lg"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <HeartCrack className="w-5 h-5" />
                    <span>Maybe Later</span>
                  </span>
                </button>
              </div>

              <div className="mt-5 md:mt-8 text-center">
                <p className="text-xs md:text-sm text-gray-400">
                  No hidden fees • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;