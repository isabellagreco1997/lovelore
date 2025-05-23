'use client';

import { useEffect, useState } from 'react';

const MobileDebugger = () => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [erudaLoaded, setErudaLoaded] = useState(false);

  useEffect(() => {
    // Only load in development or when debug mode is explicitly enabled
    const isDevelopment = process.env.NODE_ENV === 'development';
    const debugParam = new URLSearchParams(window.location.search).get('debug');
    const localStorageDebug = localStorage.getItem('mobile-debug') === 'true';
    
    if (isDevelopment || debugParam === 'true' || localStorageDebug) {
      setIsDebugMode(true);
      loadEruda();
    }
  }, []);

  const loadEruda = async () => {
    try {
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
      console.log('🚀 Mobile debugger loaded! Tap the debug icon to open console.');
    } catch (error) {
      console.error('Failed to load Eruda:', error);
    }
  };

  const toggleDebugMode = () => {
    if (erudaLoaded) {
      const eruda = (window as any).eruda;
      if (eruda) {
        eruda.show();
      }
    } else {
      loadEruda();
    }
  };

  const enablePersistentDebug = () => {
    localStorage.setItem('mobile-debug', 'true');
    if (!erudaLoaded) {
      loadEruda();
    }
  };

  const disablePersistentDebug = () => {
    localStorage.removeItem('mobile-debug');
    window.location.reload();
  };

  // Triple tap detection for easy access
  useEffect(() => {
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
  }, [erudaLoaded]);

  // Show debug controls only in development or when explicitly enabled
  if (!isDebugMode && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Debug Info Panel */}
      <div className={`fixed top-2 right-2 z-[9999] bg-black/80 text-white text-xs p-2 rounded-md backdrop-blur-sm ${
        process.env.NODE_ENV === 'development' ? '' : 'opacity-60 hover:opacity-100'
      }`}>
        <div className="flex flex-col gap-1">
          <div>📱 Debug Mode {process.env.NODE_ENV !== 'development' && '(Prod)'}</div>
          <div>Triple-tap to open console</div>
          {erudaLoaded && <div className="text-green-400">✓ Console Ready</div>}
        </div>
        <div className="flex gap-1 mt-2">
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
        </div>
      </div>

      {/* Additional mobile debugging utilities */}
      {isDebugMode && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
                    debugMode: true
                  });
                }
              };
              console.log('🔧 Debug utilities available: window.debugUtils');
              console.log('Environment: ${process.env.NODE_ENV}');
            `
          }}
        />
      )}
    </>
  );
};

export default MobileDebugger; 