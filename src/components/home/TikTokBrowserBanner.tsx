import { useState, useEffect } from 'react';
import React from 'react';

interface TikTokBrowserBannerProps {
  onClose: () => void;
  forceShowOnDesktop?: boolean; // Optional prop to force showing on desktop
}

const TikTokBrowserBanner = ({ onClose, forceShowOnDesktop = false }: TikTokBrowserBannerProps) => {
  const [showBanner, setShowBanner] = useState(false);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user has previously dismissed the banner
    const hasUserDismissedBanner = () => {
      try {
        return localStorage.getItem('tikTokBannerDismissed') === 'true';
      } catch (e) {
        return false;
      }
    };

    // Check if user is coming from TikTok browser
    const isTikTokBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      return userAgent.includes('tiktok') || userAgent.includes('bytedance');
    };

    // Set the banner visibility based on browser detection, dismissal status, or forceShowOnDesktop
    setShowBanner((isTikTokBrowser() && !hasUserDismissedBanner()) || forceShowOnDesktop);
  }, [forceShowOnDesktop]);

  const handleClose = () => {
    try {
      // Remember that user has dismissed the banner
      localStorage.setItem('tikTokBannerDismissed', 'true');
    } catch (e) {
      // Ignore errors with localStorage
    }
    setShowBanner(false);
    onClose();
  };

  if (!showBanner) return null;

  return (
    <div 
      ref={bannerRef} 
      className="sticky top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg"
      style={{ marginBottom: '-1px' }} // Prevent gap between banner and content
    >
      <div className="max-w-screen-xl mx-auto px-3 py-2 sm:px-6 sm:py-3 relative">
        <div className="pr-8 md:pr-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex items-start sm:items-center mb-2 sm:mb-0">
              <span className="flex p-1.5 sm:p-2 rounded-lg bg-pink-800/50 mr-2 sm:mr-3">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <div className="text-xs sm:text-sm md:text-base font-medium">
                  <span className="block font-bold">TikTok Browser Detected</span>
                  <span className="text-xs opacity-90">
                    Are you coming from TikTok? Open in Chrome or Safari for best experience, Google login may not work.
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-1 sm:mt-0">
              <button
                onClick={() => {
                  // Copy current URL to clipboard
                  navigator.clipboard.writeText(window.location.href)
                    .then(() => {
                      alert('URL copied! Now open this link in Chrome, Safari or another browser for a better experience with Google login.');
                    })
                    .catch(() => {
                      alert('Please manually copy this URL and open in Chrome, Safari or another browser.');
                    });
                }}
                className="flex items-center justify-center px-2 py-1 sm:px-3 sm:py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-pink-600 bg-white hover:bg-pink-50 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => {
                  // Try to open in system browser
                  window.open(window.location.href, '_system');
                }}
                className="flex items-center justify-center px-2 py-1 sm:px-3 sm:py-1.5 border border-white/30 rounded-md shadow-sm text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                Open
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="absolute top-0 right-0 p-2 sm:p-3 text-white hover:text-pink-200"
          onClick={handleClose}
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TikTokBrowserBanner; 