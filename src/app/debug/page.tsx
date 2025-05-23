'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Collect debug information
    const info = {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
      },
      location: {
        href: window.location.href,
        hostname: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      },
      storage: {
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {} as any),
      },
      performance: {
        memory: (performance as any).memory || 'Not available',
        timing: performance.timing || 'Not available',
      }
    };
    
    setDebugInfo(info);

    // Override console.log to capture logs
    const originalLog = console.log;
    console.log = (...args) => {
      setLogs(prev => [...prev.slice(-50), args.join(' ')]);
      originalLog(...args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const enableMobileDebug = () => {
    localStorage.setItem('mobile-debug', 'true');
    window.location.reload();
  };

  const disableMobileDebug = () => {
    localStorage.removeItem('mobile-debug');
    window.location.reload();
  };

  const testConsole = () => {
    console.log('🧪 Test log from debug page');
    console.warn('⚠️ Test warning');
    console.error('❌ Test error');
    console.info('ℹ️ Test info');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🔧 Debug Console</h1>
        
        {/* Mobile Debug Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📱 Mobile Debug Controls</h2>
          
          {/* Environment Status */}
          <div className="mb-4 p-3 rounded-lg bg-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {debugInfo.environment?.nodeEnv === 'development' ? '🟢' : '🟡'}
              </span>
              <span className="font-semibold">
                Environment: {debugInfo.environment?.nodeEnv || 'Unknown'}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              {debugInfo.environment?.nodeEnv === 'development' 
                ? 'Debug tools automatically available in development mode'
                : 'Debug tools can be manually enabled in production mode'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={enableMobileDebug}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              Enable Mobile Debug
            </button>
            <button
              onClick={disableMobileDebug}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Disable Mobile Debug
            </button>
            <button
              onClick={testConsole}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Test Console Logs
            </button>
          </div>
          
          {/* Error Testing Section */}
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">🧪 Error Testing</h3>
            <p className="text-sm mb-3">Test how the debugging tools handle errors and crashes:</p>
            <a 
              href="/debug/error-test"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded text-sm transition-colors"
            >
              🚨 Open Error Test Page
            </a>
          </div>
          
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <p className="text-sm">
              <strong>Instructions for iOS Safari:</strong><br/>
              1. Enable mobile debug above<br/>
              2. Triple-tap anywhere on the page to open console<br/>
              3. Or use the debug panel in the top-right corner<br/>
              4. Access this page at: <code className="bg-gray-600 px-1 rounded">{debugInfo.location?.href}</code>
            </p>
            <div className="mt-3 text-xs text-yellow-300">
              <strong>Production Mode:</strong> Add <code className="bg-gray-600 px-1 rounded">?debug=true</code> to any URL to enable debugging
            </div>
            <div className="mt-2 text-xs text-red-300">
              <strong>Error Recovery:</strong> If app crashes, debug tools will auto-enable to help with troubleshooting
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 System Information</h2>
          <div className="space-y-4">
            <pre className="bg-gray-700 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>

        {/* Console Logs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📝 Console Logs</h2>
            <button
              onClick={clearLogs}
              className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg h-64 overflow-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs yet. Click "Test Console Logs" to see some examples.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-gray-400">[{new Date().toLocaleTimeString()}]</span> {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Network Access Instructions */}
        <div className="mt-6 bg-blue-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🌐 Access from Mobile Device</h2>
          <div className="space-y-2 text-sm">
            <p><strong>1. Start the dev server with network access:</strong></p>
            <code className="block bg-blue-800 p-2 rounded mt-1">npm run dev:mobile</code>
            
            <p className="mt-4"><strong>2. Find your computer's IP address:</strong></p>
            <code className="block bg-blue-800 p-2 rounded mt-1">ipconfig</code>
            
            <p className="mt-4"><strong>3. Access from your iOS device:</strong></p>
            <code className="block bg-blue-800 p-2 rounded mt-1">http://YOUR_IP_ADDRESS:3000</code>
            
            <p className="mt-4"><strong>4. For debugging with query parameter:</strong></p>
            <code className="block bg-blue-800 p-2 rounded mt-1">http://YOUR_IP_ADDRESS:3000?debug=true</code>
          </div>
        </div>
      </div>
    </div>
  );
} 