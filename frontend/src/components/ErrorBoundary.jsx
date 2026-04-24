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
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6 animate-fade-in text-center">
          <div className="max-w-md w-full glass-card p-8">
            <span className="text-6xl mb-4 block">🚨</span>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-surface-400 mb-6 text-sm">
              An unexpected error occurred. Please refresh the page or return to the dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => window.location.reload()} className="btn-primary">
                Refresh Page
              </button>
              <button onClick={() => window.location.href = '/'} className="btn-secondary">
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
