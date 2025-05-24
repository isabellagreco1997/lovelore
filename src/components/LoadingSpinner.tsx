import React from 'react';

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoadingVariant = 'spinner' | 'pulse' | 'skeleton' | 'fullscreen' | 'inline';
export type LoadingTheme = 'purple' | 'pink' | 'blue' | 'gray' | 'current';

interface SkeletonConfig {
  image?: boolean;
  lines?: number;
  button?: boolean;
  height?: string;
}

interface LoadingSpinnerProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  theme?: LoadingTheme;
  text?: string;
  className?: string;
  inline?: boolean;
  center?: boolean;
  fullscreenTitle?: string;
  fullscreenSubtitle?: string;
  showDots?: boolean;
  skeleton?: SkeletonConfig;
  titleClassName?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  theme = 'purple',
  text,
  className = '',
  inline = false,
  center = true,
  fullscreenTitle,
  fullscreenSubtitle,
  showDots = false,
  skeleton,
  titleClassName
}) => {
  // Heart size classes
  const heartSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Theme colors
  const themeColors = {
    purple: 'text-purple-400',
    pink: 'text-[#EC444B]',
    blue: 'text-blue-400',
    gray: 'text-gray-400',
    current: 'text-current'
  };

  // Heart element for spinner variant
  const heartElement = (
    <div className={`${heartSizeClasses[size]} flex items-center justify-center`}>
      <div 
        className={`${themeColors[theme]} transition-all duration-500`}
        style={{
          animationDuration: '1.5s',
          animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
          animationIterationCount: 'infinite',
          animation: 'heartbeat 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-full h-full drop-shadow-sm transition-all duration-500"
          style={{
            filter: 'drop-shadow(0 0 8px currentColor)',
          }}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
    </div>
  );

  // Pulse element
  const pulseElement = (
    <div className={`${heartSizeClasses[size]} flex items-center justify-center`}>
      <div className={`w-full h-full ${themeColors[theme]} rounded-full animate-pulse bg-current opacity-60`}></div>
    </div>
  );

  // Skeleton element
  const skeletonElement = skeleton ? (
    <div className={`lovelore-skeleton ${skeleton.height || 'h-auto'} ${className} animate-pulse`}>
      {skeleton.image && (
        <div className="lovelore-skeleton-image h-32 bg-gray-700/50 rounded-t-xl mb-4"></div>
      )}
      <div className="lovelore-skeleton-content space-y-4">
        {/* Title skeleton */}
        <div className="lovelore-skeleton-title space-y-2">
          <div className="lovelore-skeleton-line h-6 bg-gray-700/50 rounded w-2/3"></div>
          <div className="lovelore-skeleton-line h-5 bg-gray-700/50 rounded w-1/2"></div>
        </div>
        
        {/* Content lines skeleton */}
        <div className="lovelore-skeleton-lines space-y-3 my-6">
          {Array.from({ length: skeleton.lines || 3 }).map((_, i) => (
            <div 
              key={i} 
              className="lovelore-skeleton-row flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
            >
              <div className="lovelore-skeleton-line h-4 bg-gray-700/50 rounded w-1/4"></div>
              <div className="lovelore-skeleton-line h-4 bg-gray-700/50 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        
        {skeleton.button && (
          <div className="lovelore-skeleton-button h-12 bg-gray-600/50 rounded-xl w-full mt-6"></div>
        )}
      </div>
    </div>
  ) : null;

  // Fullscreen variant
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center">
              <div 
                className={`${themeColors[theme]} transition-all duration-500`}
                style={{
                  animationDuration: '1.5s',
                  animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
                  animationIterationCount: 'infinite',
                  animation: 'heartbeat 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-16 h-16 drop-shadow-sm transition-all duration-500"
                  style={{
                    filter: 'drop-shadow(0 0 8px currentColor)',
                  }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </div>
          {fullscreenTitle && (
            <h2 className={`text-2xl font-bold text-white mb-4 uppercase tracking-wider ${titleClassName || ''}`}>
              {fullscreenTitle}
            </h2>
          )}
          {fullscreenSubtitle && (
            <p className="text-gray-300 mb-6">
              {fullscreenSubtitle}
            </p>
          )}
          {showDots && (
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Skeleton variant
  if (variant === 'skeleton') {
    return skeletonElement;
  }

  // Pulse variant
  if (variant === 'pulse') {
    if (text && !inline) {
      return (
        <div className={`flex ${center ? 'justify-center items-center' : ''} flex-col space-y-3 ${className}`}>
          {pulseElement}
          <p className="font-bold text-white text-2xl sm:text-3xl uppercase tracking-wider leading-none mb-0">
            {text}
          </p>
        </div>
      );
    }

    if (inline) {
      return (
        <span className="flex items-center space-x-2">
          {pulseElement}
          {text && <span className="text-sm">{text}</span>}
        </span>
      );
    }

    return <div className={className}>{pulseElement}</div>;
  }

  // Inline variant
  if (variant === 'inline' || inline) {
    return (
      <span className="flex items-center space-x-2">
        {heartElement}
        {text && <span className="text-sm">{text}</span>}
      </span>
    );
  }

  // Default spinner variant
  if (text && !inline) {
    return (
      <div className={`flex ${center ? 'justify-center items-center' : ''} flex-col space-y-3 ${className}`}>
        {heartElement}
        <p className="font-bold text-white text-2xl sm:text-3xl uppercase tracking-wider leading-none mb-0">
          {text}
        </p>
      </div>
    );
  }

  return <div className={className}>{heartElement}</div>;
};

export default LoadingSpinner;