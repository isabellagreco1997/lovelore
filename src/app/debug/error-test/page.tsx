'use client';

import { useState } from 'react';

export default function ErrorTestPage() {
  const [count, setCount] = useState(0);

  const triggerJSError = () => {
    // Intentional error
    throw new Error('Test JavaScript Error: This is a simulated error for testing');
  };

  const triggerAsyncError = async () => {
    // Async error
    await new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test Async Error: Simulated promise rejection')), 100);
    });
  };

  const triggerTypeError = () => {
    // Type error
    const obj: any = null;
    obj.nonExistentMethod();
  };

  const triggerNetworkError = async () => {
    // Network error
    try {
      await fetch('https://invalid-url-that-does-not-exist.com/api/test');
    } catch (error) {
      console.error('Network error:', error);
      throw new Error('Test Network Error: Failed to fetch from invalid URL');
    }
  };

  const triggerConsoleError = () => {
    console.error('Test Console Error: This appears in console');
    console.warn('Test Console Warning: This is a warning');
    console.log('Test Console Log: Regular log message');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Error Testing Page</h1>
        
        <div className="bg-yellow-900 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">⚠️ Warning</h2>
          <p className="text-sm">
            This page is for testing error handling and debugging capabilities. 
            The buttons below will intentionally trigger errors to test the mobile debugging tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={triggerJSError}
            className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition-colors"
          >
            🔥 JavaScript Error
          </button>

          <button
            onClick={triggerAsyncError}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg transition-colors"
          >
            ⏱️ Async/Promise Error
          </button>

          <button
            onClick={triggerTypeError}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition-colors"
          >
            🔢 Type Error
          </button>

          <button
            onClick={triggerNetworkError}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors"
          >
            🌐 Network Error
          </button>

          <button
            onClick={triggerConsoleError}
            className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors"
          >
            📝 Console Messages
          </button>

          <button
            onClick={() => setCount(count + 1)}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors"
          >
            ✅ Normal Action (Count: {count})
          </button>
        </div>

        <div className="mt-8 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">📱 Testing Instructions</h2>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>Open this page on your iOS device: <code className="bg-gray-700 px-1 rounded">http://192.168.0.25:3000/debug/error-test</code></li>
            <li>Triple-tap anywhere to open the debug console</li>
            <li>Go to the "Console" tab in the debug tools</li>
            <li>Click one of the error buttons above</li>
            <li>Check if the error appears in the console</li>
            <li>Verify that the debug panel shows "App Error Detected"</li>
          </ol>
        </div>

        <div className="mt-6 bg-blue-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">🔧 Expected Behavior</h2>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><strong>JavaScript/Type Errors:</strong> Should be caught by ErrorBoundary, show error page</li>
            <li><strong>Async Errors:</strong> Should auto-enable debug mode and appear in console</li>
            <li><strong>Network Errors:</strong> Should appear in Network tab of debug console</li>
            <li><strong>Console Messages:</strong> Should appear in Console tab</li>
            <li><strong>Debug Panel:</strong> Should show red border and "App Error Detected"</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 