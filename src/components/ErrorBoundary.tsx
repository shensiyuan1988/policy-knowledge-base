import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * 页面级错误边界：
 * 任一页面在渲染期抛错时，展示可恢复的错误提示，而不是整棵 React 树卸载白屏。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || '页面渲染异常' };
  }

  componentDidCatch(error: Error): void {
    console.error('[ErrorBoundary] 页面渲染失败:', error);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  handleHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="gov-card p-8 md:p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-800">页面加载出现异常</h2>
        <p className="mt-2 text-[13px] text-slate-500 break-words">{this.state.message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" onClick={this.handleHome} className="btn-secondary">
            返回数据看板
          </button>
          <button type="button" onClick={this.handleReload} className="btn-primary">
            刷新页面
          </button>
        </div>
      </div>
    );
  }
}
