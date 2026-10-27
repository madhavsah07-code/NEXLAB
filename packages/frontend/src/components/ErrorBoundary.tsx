import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Error Boundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
          <div className="bg-[#03195B] border border-[#5BB8FB]/30 rounded-xl p-6 max-w-md w-full text-center shadow-xl">
            <div className="text-5xl mb-4">🔧</div>
            <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">
              Something went wrong
            </h2>
            <p className="text-[#CBE9FD] text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.errorInfo && (
              <details className="text-left text-xs text-[#5BB8FB] mb-4 bg-[#000000] p-3 rounded-lg max-h-40 overflow-auto">
                <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
                <pre className="whitespace-pre-wrap break-all">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#1951FC] text-white rounded-lg hover:bg-[#3781FC] transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-[#03195B] text-[#FFFFFF] rounded-lg hover:bg-[#0B2CB1] transition-colors border border-[#0B2CB1]"
              >
                Go Home
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