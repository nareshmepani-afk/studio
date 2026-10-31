'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class QaErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[QA Portal] Uncaught rendering exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090E] text-rose-300 p-8 flex flex-col items-center justify-center font-mono">
          <div className="max-w-md p-6 rounded-2xl bg-black/60 border border-rose-500/30 text-center space-y-3">
            <h1 className="text-base font-bold text-rose-400 uppercase tracking-wider">QA Suite Fault Boundary Caught</h1>
            <p className="text-xs text-gray-400 break-all">{this.state.error?.message || 'Unknown runtime error'}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl hover:bg-amber-500/30 text-xs font-bold transition"
            >
              🔄 Retry Suite View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function QaPortalLayout({ children }: { children: ReactNode }) {
  return <QaErrorBoundary>{children}</QaErrorBoundary>;
}
