import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-center px-6">
          <div className="text-5xl">😵</div>
          <h1 className="text-lg font-semibold text-slate-800">页面出了点问题</h1>
          <p className="text-sm text-slate-500 max-w-xs">
            发生了意外错误，请点击下方按钮刷新页面恢复。
          </p>
          <button
            onClick={this.handleReload}
            className="mt-2 px-5 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
          >
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
