'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Set crash flag for debug tools
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-crashed', 'true');
    }
    
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  enableDebugMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobile-debug', 'true');
      window.location.reload();
    }
  };

  reloadApp = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app-crashed');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI with debug access
      return (
        <div className="min-h-screen bg-red-900 text-white p-4 flex items-center justify-center">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">🚨 Application Error</h1>
            <p className="mb-4">Something went wrong. The app has crashed.</p>
            
            <div className="bg-red-800 p-4 rounded-lg mb-4 text-left text-sm">
              <h3 className="font-semibold mb-2">Error Details:</h3>
              <pre className="whitespace-pre-wrap break-words">
                {this.state.error?.message}
              </pre>
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Stack Trace</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={this.enableDebugMode}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                🔧 Enable Debug Mode & Reload
              </button>
              
              <button
                onClick={this.reloadApp}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Reload App
              </button>
              
              <div className="mt-4 p-3 bg-yellow-900 rounded-lg text-sm">
                <p><strong>For iOS Safari debugging:</strong></p>
                <p>1. Click "Enable Debug Mode & Reload"</p>
                <p>2. After reload, triple-tap anywhere to open console</p>
                <p>3. Check the Console tab for detailed error information</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 