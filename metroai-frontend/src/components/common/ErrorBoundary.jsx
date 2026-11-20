import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MetroAI Error Boundary Caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D11] px-4 py-16">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 shadow-lg text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center justify-center">
              <AlertCircle size={24} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                {this.state.error?.message || 'An unexpected rendering error occurred. Please refresh the page.'}
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw size={14} strokeWidth={1.75} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
