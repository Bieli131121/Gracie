import { useState } from 'react'
import { useDemoStore } from '../../lib/demoStore'
import { TipoLancamento } from '../../types'

export function CategoriasPage({ podeGerenciar }: { podeGerenciar: boolean }) {
  const { categoriasFinanceiras, centrosCusto, criarCategoriaFinanceira, alternarCategoriaFinanceiraAtiva, criarCentroCusto, alternarCentroCustoAtivo } =
    useDemoStore()
  const [novaCategoria, setNovaCategoria] = useState('')
  const [tipoNovaCategoria, setTipoNovaCategoria] = useState<TipoLancamento>('despesa')
  const [novoCentro, setNovoCentro] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const despesas = categoriasFinanceiras.filter((c) => c.tipo === 'despesa')
  const receitas = categoriasFinanceiras.filter((c) => c.tipo === 'receita')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <h2 className="font-display text-lg text-content-primary mb-4">Categorias</h2>
        {erro && <p className="text-xs text-brand-red mb-4 bg-brand-red/10 px-3 py-2 rounded">{erro}</p>}

        {podeGerenciar && (
          <div className="flex gap-2 mb-4">
            <select
              value={tipoNovaCategoria}
              onChange={(e) => setTipoNovaCategoria(e.target.value as TipoLancamento)}
              className="border border-border rounded px-2 py-2 text-sm bg-surface"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            <input
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Nova categoria..."
              className="flex-1 border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
            />
            <button
              onClick={async () => {
                const r = await criarCategoriaFinanceira({ nome: novaCategoria, tipo: tipoNovaCategoria, categoriaPaiId: null })
                if (!r.ok) return setErro(r.erro ?? 'Não foi possível criar.')
                setNovaCategoria('')
                setErro(null)
              }}
              className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 rounded transition-colors"
            >
              + Adicionar
            </button>
          </div>
        )}

        <div className="bg-surface rounded-md border border-border shadow-xs p-4 mb-4">
          <div className="text-xs font-mono uppercase tracking-wide text-content-muted mb-2">Despesas</div>
          <div className="flex flex-wrap gap-2">
            {despesas.map((c) => (
              <button
                key={c.id}
                disabled={!podeGerenciar}
                onClick={() => alternarCategoriaFinanceiraAtiva(c.id)}
                className={`text-xs font-mono px-2.5 py-1 rounded border ${
                  c.ativa ? 'bg-bg-subtle text-content-secondary border-border' : 'bg-bg-subtle text-content-muted border-border-subtle line-through'
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-md border border-border shadow-xs p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-content-muted mb-2">Receitas</div>
          <div className="flex flex-wrap gap-2">
            {receitas.map((c) => (
              <button
                key={c.id}
                disabled={!podeGerenciar}
                onClick={() => alternarCategoriaFinanceiraAtiva(c.id)}
                className={`text-xs font-mono px-2.5 py-1 rounded border ${
                  c.ativa ? 'bg-bg-subtle text-content-secondary border-border' : 'bg-bg-subtle text-content-muted border-border-subtle line-through'
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg text-content-primary mb-4">Centros de custo</h2>

        {podeGerenciar && (
          <div className="flex gap-2 mb-4">
            <input
              value={novoCentro}
              onChange={(e) => setNovoCentro(e.target.value)}
              placeholder="Novo centro de custo..."
              className="flex-1 border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
            />
            <button
              onClick={async () => {
                const r = await criarCentroCusto({ nome: novoCentro })
                if (!r.ok) return setErro(r.erro ?? 'Não foi possível criar.')
                setNovoCentro('')
                setErro(null)
              }}
              className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 rounded transition-colors"
            >
              + Adicionar
            </button>
          </div>
        )}

        <div className="bg-surface rounded-md border border-border shadow-xs p-4">
          <div className="flex flex-wrap gap-2">
            {centrosCusto.map((c) => (
              <button
                key={c.id}
                disabled={!podeGerenciar}
                onClick={() => alternarCentroCustoAtivo(c.id)}
                className={`text-xs font-mono px-2.5 py-1 rounded border ${
                  c.ativo ? 'bg-bg-subtle text-content-secondary border-border' : 'bg-bg-subtle text-content-muted border-border-subtle line-through'
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
