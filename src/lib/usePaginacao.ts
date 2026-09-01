import { useState, useMemo, useEffect } from 'react'

/**
 * Pagina uma lista no cliente. Volta pra página 1 automaticamente quando a
 * lista muda de tamanho (ex: usuário aplicou um filtro/busca novo).
 */
export function usePaginacao<T>(itens: T[], itensPorPagina = 10) {
  const [paginaAtual, setPaginaAtual] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(itens.length / itensPorPagina))

  useEffect(() => {
    setPaginaAtual(1)
  }, [itens.length])

  const paginaSegura = Math.min(paginaAtual, totalPaginas)

  const itensPagina = useMemo(() => {
    const inicio = (paginaSegura - 1) * itensPorPagina
    return itens.slice(inicio, inicio + itensPorPagina)
  }, [itens, paginaSegura, itensPorPagina])

  return {
    itensPagina,
    paginaAtual: paginaSegura,
    totalPaginas,
    totalItens: itens.length,
    itensPorPagina,
    setPaginaAtual,
  }
}
