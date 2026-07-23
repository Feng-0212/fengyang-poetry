// ============================================================
// 全局错误边界组件
// ============================================================
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">😟</div>
            <h3 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-2">
              出了点问题
            </h3>
            <p className="text-sm text-ink-light mb-4">
              {this.state.error?.message || "发生了未知错误"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg bg-cinnabar text-white text-sm hover:opacity-90"
            >
              刷新重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
