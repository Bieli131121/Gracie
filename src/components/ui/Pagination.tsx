import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  paginaAtual: number
  totalPaginas: number
  onMudarPagina: (pagina: number) => void
  totalItens: number
  itensPorPagina: number
}

/** Paginação padrão para tabelas — usar junto com o hook usePaginacao. */
export function Pagination({ paginaAtual, totalPaginas, onMudarPagina, totalItens, itensPorPagina }: Props) {
  if (totalPaginas <= 1) return null

  const inicio = (paginaAtual - 1) * itensPorPagina + 1
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens)

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border-subtle">
      <span className="text-xs text-content-muted">
        {inicio}–{fim} de {totalItens}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onMudarPagina(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          aria-label="Página anterior"
          className="w-7 h-7 rounded flex items-center justify-center text-content-secondary hover:bg-bg-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-content-secondary px-2">
          {paginaAtual} / {totalPaginas}
        </span>
        <button
          onClick={() => onMudarPagina(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          aria-label="Próxima página"
          className="w-7 h-7 rounded flex items-center justify-center text-content-secondary hover:bg-bg-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
