import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  erro: Error | null
}

/**
 * Evita a "tela branca silenciosa": se algo quebrar durante a renderização
 * (ex.: uma dependência mal configurada, uma exceção inesperada), mostra a
 * mensagem de erro na tela em vez de deixar o app parecer travado/carregando.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Erro capturado:', erro, info.componentStack)
  }

  render() {
    if (this.state.erro) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            fontFamily: 'monospace',
            background: '#F5F3EE',
            color: '#17171A',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>Ocorreu um erro ao carregar o sistema</h1>
          <p style={{ fontSize: 13, opacity: 0.7, maxWidth: 480 }}>{this.state.erro.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '8px 16px',
              background: '#A32020',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
