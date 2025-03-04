'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h2 className="text-xl text-red-400 font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-4">
              We're experiencing issues loading this page. Please try again later.
            </p>
            <div className="bg-gray-900 p-3 rounded text-sm text-gray-400 mb-4 overflow-auto">
              {this.state.error && this.state.error.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;