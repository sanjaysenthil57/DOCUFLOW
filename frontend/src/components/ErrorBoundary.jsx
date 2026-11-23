import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DocuFlow AI ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('docuflow_token');
    localStorage.removeItem('docuflow_user');
    localStorage.removeItem('docuflow_meta');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected runtime error occurred while rendering the interface.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Page</span>
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Reset Session & Return to Login</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
