import React from 'react';

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoadingVariant = 'spinner' | 'pulse' | 'skeleton' | 'fullscreen' | 'inline' | 'heart';
export type LoadingTheme = 'purple' | 'pink' | 'blue' | 'gray' | 'current' | 'nav';

interface LoadingSpinnerProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  theme?: LoadingTheme;
  text?: string;
  fullscreenTitle?: string;
  fullscreenSubtitle?: string;
  processingStep?: string;
  className?: string;
  showDots?: boolean;
  skeleton?: {
    lines?: number;
    avatar?: boolean;
    button?: boolean;
    image?: boolean;
    height?: string;
  };
  inline?: boolean;
  center?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'heart',
  size = 'md',
  theme = 'nav',
  text,
  fullscreenTitle,
  fullscreenSubtitle,
  processingStep,
  className = '',
  showDots = false,
  skeleton,
  inline = false,
  center = true
}) => {
  // Size classes for spinners and hearts
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-20 w-20'
  };

  // Heart size classes (different scaling for heart shape)
  const heartSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Theme classes for spinners
  const themeClasses = {
    purple: 'border-purple-500',
    pink: 'border-pink-500',
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    current: 'border-current',
    nav: 'border-[#EC444B]'
  };

  // Heart theme classes
  const heartThemeClasses = {
    purple: 'text-purple-500',
    pink: 'text-pink-500', 
    blue: 'text-blue-500',
    gray: 'text-gray-500',
    current: 'text-current',
    nav: 'text-[#EC444B]'
  };

  // Fullscreen theme classes
  const fullscreenThemes = {
    purple: {
      primary: 'text-purple-500 border-purple-500',
      secondary: 'text-purple-400',
      tertiary: 'text-purple-300',
      dots: ['bg-purple-500', 'bg-purple-400', 'bg-purple-300']
    },
    pink: {
      primary: 'text-pink-500 border-pink-500',
      secondary: 'text-pink-400',
      tertiary: 'text-pink-300',
      dots: ['bg-pink-500', 'bg-pink-400', 'bg-pink-300']
    },
    blue: {
      primary: 'text-blue-500 border-blue-500',
      secondary: 'text-blue-400',
      tertiary: 'text-blue-300',
      dots: ['bg-blue-500', 'bg-blue-400', 'bg-blue-300']
    },
    gray: {
      primary: 'text-gray-500 border-gray-500',
      secondary: 'text-gray-400',
      tertiary: 'text-gray-300',
      dots: ['bg-gray-500', 'bg-gray-400', 'bg-gray-300']
    },
    current: {
      primary: 'border-current',
      secondary: 'text-current',
      tertiary: 'text-current',
      dots: ['bg-current', 'bg-current', 'bg-current']
    },
    nav: {
      primary: 'text-[#EC444B] border-[#EC444B]',
      secondary: 'text-purple-400',
      tertiary: 'text-purple-300',
      dots: ['bg-[#EC444B]', 'bg-purple-400', 'bg-purple-300']
    }
  };

  // Render heart loading animation
  if (variant === 'heart') {
    const heartElement = (
      <div className={`${heartSizeClasses[size]} ${className} flex items-center justify-center`}>
        <div 
          className={`animate-pulse ${heartThemeClasses[theme]} transition-all duration-300`}
          style={{
            animationDuration: '1.2s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite'
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full drop-shadow-sm"
            style={{
              filter: 'drop-shadow(0 0 8px currentColor)',
              animation: 'heartbeat 1.2s ease-in-out infinite'
            }}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>
    );

    if (text && !inline) {
      return (
        <div className={`flex ${center ? 'justify-center items-center' : ''} flex-col space-y-3`}>
          {heartElement}
          <p className={`text-sm ${theme === 'current' ? 'text-current' : theme === 'nav' ? 'text-[#EC444B]' : `text-${theme}-300`} animate-pulse`}>
            {text}
          </p>
        </div>
      );
    }

    if (inline) {
      return (
        <span className="flex items-center space-x-2">
          {heartElement}
          {text && <span className="text-sm">{text}</span>}
        </span>
      );
    }

    return heartElement;
  }

  // Render basic spinner
  if (variant === 'spinner') {
    const spinnerElement = (
      <div
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${themeClasses[theme]} ${className}`}
      />
    );

    if (text && !inline) {
      return (
        <div className={`flex ${center ? 'justify-center items-center' : ''} flex-col space-y-2`}>
          {spinnerElement}
          <p className={`text-sm ${theme === 'current' ? 'text-current' : theme === 'nav' ? 'text-[#EC444B]' : `text-${theme}-300`} animate-pulse`}>
            {text}
          </p>
        </div>
      );
    }

    if (inline) {
      return (
        <span className="flex items-center space-x-2">
          {spinnerElement}
          {text && <span className="text-sm">{text}</span>}
        </span>
      );
    }

    return spinnerElement;
  }

  // Render pulse animation
  if (variant === 'pulse') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`rounded ${sizeClasses[size]} bg-gray-300`} />
        {text && (
          <p className="mt-2 text-sm text-gray-500 animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  // Render skeleton loading
  if (variant === 'skeleton') {
    return (
      <div className={`animate-pulse ${className}`}>
        {skeleton?.avatar && (
          <div className="flex items-center space-x-4 mb-4">
            <div className="rounded-full bg-gray-300 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        )}
        
        {skeleton?.image && (
          <div className={`bg-gray-300 rounded mb-4 ${skeleton.height || 'h-48'}`}></div>
        )}
        
        <div className="space-y-3">
          {Array.from({ length: skeleton?.lines || 3 }).map((_, index) => (
            <div
              key={index}
              className={`h-4 bg-gray-300 rounded ${
                index === (skeleton?.lines || 3) - 1 ? 'w-2/3' : 'w-full'
              }`}
            ></div>
          ))}
        </div>
        
        {skeleton?.button && (
          <div className="h-10 bg-gray-300 rounded w-1/3 mt-6"></div>
        )}
      </div>
    );
  }

  // Render fullscreen loading with heart
  if (variant === 'fullscreen') {
    const themeConfig = fullscreenThemes[theme];
    
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="mb-8">
            {/* Heart animation for fullscreen */}
            <div className="w-20 h-20 mx-auto flex items-center justify-center">
              <div 
                className={`w-16 h-16 ${themeConfig.primary} transition-all duration-300`}
                style={{
                  animation: 'heartbeat 1.2s ease-in-out infinite'
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-full h-full drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 0 12px currentColor)'
                  }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">
              {fullscreenTitle || 'Loading'}
            </h2>
            <p className={themeConfig.tertiary}>
              {fullscreenSubtitle || 'Please wait...'}
            </p>
          </div>
          
          {showDots && (
            <div className="mt-6 flex justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${themeConfig.dots[0]}`}></div>
              <div className={`w-2 h-2 rounded-full animate-pulse animation-delay-200 ${themeConfig.dots[1]}`}></div>
              <div className={`w-2 h-2 rounded-full animate-pulse animation-delay-400 ${themeConfig.dots[2]}`}></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render inline loading
  if (variant === 'inline') {
    return (
      <div className={`flex ${center ? 'justify-center items-center' : 'items-center'} ${className}`}>
        <div className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${themeClasses[theme]}`} />
        {text && (
          <span className={`ml-2 text-sm ${theme === 'current' ? 'text-current' : theme === 'nav' ? 'text-[#EC444B]' : `text-${theme}-300`}`}>
            {text}
          </span>
        )}
      </div>
    );
  }

  return null;
};

export default LoadingSpinner;