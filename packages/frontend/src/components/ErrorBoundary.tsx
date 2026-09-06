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
        <div className="min-h-screen bg-[#0D0F0F] flex items-center justify-center p-4">
          <div className="bg-[#161A19] border border-[#F87171]/30 rounded-xl p-6 max-w-md w-full text-center shadow-xl">
            <div className="text-5xl mb-4">🔧</div>
            <h2 className="text-xl font-bold text-[#EDEFEE] mb-2">
              Something went wrong
            </h2>
            <p className="text-[#9CA3A0] text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.errorInfo && (
              <details className="text-left text-xs text-[#5C6360] mb-4 bg-[#0D0F0F] p-3 rounded-lg max-h-40 overflow-auto">
                <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
                <pre className="whitespace-pre-wrap break-all">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#34D399] transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-[#161A19] text-[#EDEFEE] rounded-lg hover:bg-[#1E2322] transition-colors border border-[#2A302E]"
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