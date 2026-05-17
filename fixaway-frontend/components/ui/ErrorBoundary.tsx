'use client';
import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, send to error monitoring (e.g. Sentry)
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="text-center max-w-md">
            <span className="material-symbols-outlined text-6xl text-error block mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>error_outline</span>
            <h1 className="font-bold text-2xl text-primary mb-2">Something went wrong</h1>
            <p className="text-on-surface-variant text-sm mb-6">An unexpected error occurred. Please refresh the page or contact support if the problem persists.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all active:scale-95"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
