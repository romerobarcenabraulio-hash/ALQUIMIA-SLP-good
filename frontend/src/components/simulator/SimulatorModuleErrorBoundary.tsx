'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

type Props = {
  children: ReactNode
  moduleLabel: string
  onRetry?: () => void
}

type State = { error: Error | null }

export class SimulatorModuleErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[simulator:${this.props.moduleLabel}]`, error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="rounded-[12px] border border-red-200 bg-red-50 p-5 text-[13px] text-red-900"
          role="alert"
          data-testid="simulator-module-error"
        >
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            No se pudo mostrar {this.props.moduleLabel}
          </p>
          <p className="mt-2 leading-relaxed text-red-800">
            Ocurrió un error al renderizar esta sección. El resto del simulador sigue disponible; puedes recargar solo este
            bloque o volver a otro módulo.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-3 rounded-[6px] border border-red-300 bg-white px-3 py-1.5 text-[12px] font-medium text-red-900 hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
