import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-900/90 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-800">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Content */}
          <div className="p-8 md:p-12 flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#EC444B]">
              Get Premium Access Today!
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Up to <span className="text-[#EC444B] font-bold">70% off</span> for your first subscription
            </p>

            {/* Pricing Plans */}
            <div className="space-y-4 mb-8">
              {/* Annual Plan */}
              <div className="bg-[#EC444B]/10 border border-[#EC444B]/20 rounded-xl p-4 relative">
                <div className="absolute -top-3 right-4 bg-[#EC444B] text-white px-3 py-1 rounded-full text-sm">
                  Best Value
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white">12 Months</h3>
                    <p className="text-gray-400 line-through">Was £19.99/month</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">£5.99</div>
                    <div className="text-gray-400">/month</div>
                  </div>
                </div>
              </div>

              {/* Quarterly Plan */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white">3 Months</h3>
                    <p className="text-gray-400 line-through">Was £19.99/month</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">£9.99</div>
                    <div className="text-gray-400">/month</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Features */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white mb-4">Premium Benefits</h3>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-[#EC444B]">✓</span>
                <span>Access to all premium stories</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-[#EC444B]">✓</span>
                <span>Unlimited chapters per day</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-[#EC444B]">✓</span>
                <span>Advanced AI responses</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-[#EC444B]">✓</span>
                <span>Early access to new features</span>
              </div>
            </div>
          </div>

          {/* Right side - Image and CTA */}
          <div className="relative w-full md:w-[400px] bg-gradient-to-br from-gray-900 to-black p-8 flex flex-col justify-between">
            <img
              src="https://images.pexels.com/photos/7014924/pexels-photo-7014924.jpeg"
              alt="Premium Experience"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

            <div className="relative z-10 space-y-6">
              <button
                onClick={() => router.push('/account?tab=subscription')}
                className="w-full bg-[#EC444B] hover:bg-[#d83a40] text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Get Premium Now
              </button>

              <button
                onClick={onClose}
                className="w-full bg-transparent border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 py-4 rounded-xl font-semibold transition-colors"
              >
                Maybe Later
              </button>
            </div>

            <div className="relative z-10 mt-8 text-center">
              <p className="text-sm text-gray-400">
                No hidden fees • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;