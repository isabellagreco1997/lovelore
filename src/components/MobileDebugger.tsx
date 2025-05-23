'use client';

import { useEffect, useState } from 'react';

const MobileDebugger = () => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [erudaLoaded, setErudaLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Force early initialization in case of app crashes
  useEffect(() => {
    // Wrap everything in try-catch to prevent debug tools from crashing
    try {
      // Check if we should force debug mode due to errors
      const hasAppError = window.location.search.includes('error=true') || 
                         localStorage.getItem('app-crashed') === 'true';
      
      // Only load in development or when debug mode is explicitly enabled
      const isDevelopment = process.env.NODE_ENV === 'development';
      const debugParam = new URLSearchParams(window.location.search).get('debug');
      const localStorageDebug = localStorage.getItem('mobile-debug') === 'true';
      
      if (isDevelopment || debugParam === 'true' || localStorageDebug || hasAppError) {
        setIsDebugMode(true);
        // Load immediately for error scenarios
        loadEruda();
      }

      // Global error handler to auto-enable debug mode
      const originalErrorHandler = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        setHasError(true);
        localStorage.setItem('app-crashed', 'true');
        if (!erudaLoaded) {
          setIsDebugMode(true);
          loadEruda();
        }
        if (originalErrorHandler) {
          return originalErrorHandler(message, source, lineno, colno, error);
        }
        return false;
      };

      // Handle unhandled promise rejections
      const originalUnhandledRejection = window.onunhandledrejection;
      window.onunhandledrejection = (event: PromiseRejectionEvent) => {
        setHasError(true);
        localStorage.setItem('app-crashed', 'true');
        if (!erudaLoaded) {
          setIsDebugMode(true);
          loadEruda();
        }
        if (originalUnhandledRejection) {
          return originalUnhandledRejection.call(window, event);
        }
      };

      return () => {
        window.onerror = originalErrorHandler;
        window.onunhandledrejection = originalUnhandledRejection;
      };
    } catch (error) {
      console.error('MobileDebugger initialization error:', error);
      // Even if this fails, try to load Eruda
      loadEruda();
    }
  }, []);

  const loadEruda = async () => {
    try {
      // Check if Eruda is already loaded
      if ((window as any).eruda) {
        setErudaLoaded(true);
        return;
      }

      const eruda = await import('eruda');
      eruda.default.init({
        useShadowDom: true,
        autoScale: true,
        defaults: {
          displaySize: 50,
          theme: 'Dark'
        }
      });
      setErudaLoaded(true);
      
      // Clear crash flag since debugging is now available
      localStorage.removeItem('app-crashed');
      
      console.log('🚀 Mobile debugger loaded! Tap the debug icon to open console.');
      
      // Auto-open console if there was an error
      if (hasError) {
        setTimeout(() => {
          const erudaInstance = (window as any).eruda;
          if (erudaInstance) {
            erudaInstance.show();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to load Eruda:', error);
      // Fallback: try to load from CDN
      loadErudaFromCDN();
    }
  };

  const loadErudaFromCDN = () => {
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.4.1/eruda.min.js';
      script.onload = () => {
        if ((window as any).eruda) {
          (window as any).eruda.init({
            useShadowDom: true,
            autoScale: true,
            defaults: {
              displaySize: 50,
              theme: 'Dark'
            }
          });
          setErudaLoaded(true);
          console.log('🚀 Mobile debugger loaded from CDN!');
        }
      };
      script.onerror = () => {
        console.error('Failed to load Eruda from CDN');
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Failed to create Eruda script tag:', error);
    }
  };

  const toggleDebugMode = () => {
    try {
      if (erudaLoaded) {
        const eruda = (window as any).eruda;
        if (eruda) {
          eruda.show();
        }
      } else {
        loadEruda();
      }
    } catch (error) {
      console.error('Error toggling debug mode:', error);
    }
  };

  const enablePersistentDebug = () => {
    try {
      localStorage.setItem('mobile-debug', 'true');
      if (!erudaLoaded) {
        loadEruda();
      }
    } catch (error) {
      console.error('Error enabling persistent debug:', error);
    }
  };

  const disablePersistentDebug = () => {
    try {
      localStorage.removeItem('mobile-debug');
      localStorage.removeItem('app-crashed');
      window.location.reload();
    } catch (error) {
      console.error('Error disabling persistent debug:', error);
    }
  };

  const clearCrashFlag = () => {
    try {
      localStorage.removeItem('app-crashed');
      setHasError(false);
    } catch (error) {
      console.error('Error clearing crash flag:', error);
    }
  };

  // Triple tap detection for easy access
  useEffect(() => {
    try {
      let tapCount = 0;
      let tapTimer: NodeJS.Timeout;

      const handleTripleTap = () => {
        tapCount++;
        if (tapCount === 1) {
          tapTimer = setTimeout(() => {
            tapCount = 0;
          }, 500);
        } else if (tapCount === 3) {
          clearTimeout(tapTimer);
          tapCount = 0;
          toggleDebugMode();
        }
      };

      // Add triple-tap listener to body
      document.body.addEventListener('touchend', handleTripleTap);

      return () => {
        document.body.removeEventListener('touchend', handleTripleTap);
        if (tapTimer) clearTimeout(tapTimer);
      };
    } catch (error) {
      console.error('Error setting up triple-tap:', error);
    }
  }, [erudaLoaded]);

  // Force render debug controls if there's an error or debug mode is enabled
  if (!isDebugMode && process.env.NODE_ENV !== 'development' && !hasError) {
    return null;
  }

  return (
    <>
      {/* Debug Info Panel */}
      <div className={`fixed top-2 right-2 z-[9999] bg-black/80 text-white text-xs p-2 rounded-md backdrop-blur-sm ${
        process.env.NODE_ENV === 'development' ? '' : 'opacity-60 hover:opacity-100'
      } ${hasError ? 'border-2 border-red-500' : ''}`}>
        <div className="flex flex-col gap-1">
          <div>📱 Debug Mode {process.env.NODE_ENV !== 'development' && '(Prod)'}</div>
          {hasError && <div className="text-red-400">⚠️ App Error Detected</div>}
          <div>Triple-tap to open console</div>
          {erudaLoaded && <div className="text-green-400">✓ Console Ready</div>}
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          <button 
            onClick={toggleDebugMode}
            className="bg-blue-600 px-2 py-1 rounded text-xs"
          >
            Open Console
          </button>
          {process.env.NODE_ENV === 'development' && (
            <>
              <button 
                onClick={enablePersistentDebug}
                className="bg-green-600 px-2 py-1 rounded text-xs"
              >
                Enable
              </button>
              <button 
                onClick={disablePersistentDebug}
                className="bg-red-600 px-2 py-1 rounded text-xs"
              >
                Disable
              </button>
            </>
          )}
          {process.env.NODE_ENV !== 'development' && (
            <button 
              onClick={disablePersistentDebug}
              className="bg-red-600 px-2 py-1 rounded text-xs"
            >
              Exit Debug
            </button>
          )}
          {hasError && (
            <button 
              onClick={clearCrashFlag}
              className="bg-orange-600 px-2 py-1 rounded text-xs"
            >
              Clear Error
            </button>
          )}
        </div>
      </div>

      {/* Additional mobile debugging utilities */}
      {isDebugMode && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Add some global debugging utilities
                window.debugUtils = {
                  logViewport: () => {
                    console.log('Viewport:', {
                      width: window.innerWidth,
                      height: window.innerHeight,
                      devicePixelRatio: window.devicePixelRatio,
                      userAgent: navigator.userAgent
                    });
                  },
                  logPerformance: () => {
                    if (performance.getEntriesByType) {
                      console.log('Performance:', performance.getEntriesByType('navigation'));
                    }
                  },
                  logMemory: () => {
                    if (performance.memory) {
                      console.log('Memory:', performance.memory);
                    }
                  },
                  logStorage: () => {
                    console.log('LocalStorage:', Object.keys(localStorage).reduce((acc, key) => {
                      acc[key] = localStorage.getItem(key);
                      return acc;
                    }, {}));
                  },
                  environment: () => {
                    console.log('Environment:', {
                      nodeEnv: '${process.env.NODE_ENV}',
                      isDevelopment: ${process.env.NODE_ENV === 'development'},
                      debugMode: true,
                      hasError: ${hasError}
                    });
                  },
                  forceDebug: () => {
                    localStorage.setItem('mobile-debug', 'true');
                    window.location.reload();
                  }
                };
                console.log('🔧 Debug utilities available: window.debugUtils');
                console.log('Environment: ${process.env.NODE_ENV}');
                
                // Log any existing errors
                if (${hasError}) {
                  console.warn('⚠️ Application error detected. Debug mode auto-enabled.');
                }
              } catch (error) {
                console.error('Error initializing debug utilities:', error);
              }
            `
          }}
        />
      )}
    </>
  );
};

export default MobileDebugger; 