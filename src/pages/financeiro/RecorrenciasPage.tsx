import { useState } from 'react'
import { useDemoStore } from '../../lib/demoStore'
import { TipoLancamento, FrequenciaRecorrencia } from '../../types'
import { formatarCentavos } from '../../lib/money'

const FREQ_LABEL: Record<FrequenciaRecorrencia, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
}

const CAMPO = 'w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-white'
const LABEL = 'block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5'

export function RecorrenciasPage({ podeGerenciar, usuarioNome }: { podeGerenciar: boolean; usuarioNome: string }) {
  const { recorrencias, categoriasFinanceiras, centrosCusto, contasFinanceiras, criarRecorrencia, alternarRecorrenciaAtiva, gerarLancamentosRecorrencia } =
    useDemoStore()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  return (
    <div>
      <p className="text-sm text-content-secondary mb-4 max-w-2xl">
        Lançamentos que se repetem automaticamente (aluguel, internet, assinaturas...). Clique em "Gerar lançamentos" para
        criar as ocorrências pendentes até hoje — o sistema nunca duplica uma ocorrência já gerada.
      </p>

      {mensagem && <p className="text-xs text-success mb-4 bg-success-bg px-3 py-2 rounded">{mensagem}</p>}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-content-primary">Recorrências</h2>
        {podeGerenciar && (
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2.5 rounded transition-colors"
          >
            + Nova recorrência
          </button>
        )}
      </div>

      <div className="bg-surface rounded-md border border-border shadow-xs overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Descrição</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Tipo</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Valor</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Frequência</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Início</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {recorrencias.map((r) => (
              <tr key={r.id} className={`border-b border-border-subtle last:border-0 ${!r.ativa ? 'opacity-40' : ''}`}>
                <td className="px-5 py-3.5 font-medium text-content-primary">{r.descricao}</td>
                <td className="px-5 py-3.5 text-xs text-content-secondary">{r.tipo === 'receita' ? 'Receita' : 'Despesa'}</td>
                <td className="px-5 py-3.5 font-mono text-content-primary">{formatarCentavos(r.valor_centavos)}</td>
                <td className="px-5 py-3.5 text-xs text-content-secondary">{FREQ_LABEL[r.frequencia]}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-content-secondary">
                  {new Date(r.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  {podeGerenciar && r.ativa && (
                    <button
                      onClick={() => {
                        const res = gerarLancamentosRecorrencia(r.id, usuarioNome)
                        setMensagem(
                          res.gerados > 0
                            ? `${res.gerados} lançamento(s) gerado(s) para "${r.descricao}".`
                            : `Nenhum lançamento novo — "${r.descricao}" já está em dia.`
                        )
                      }}
                      className="text-xs font-medium text-brand-red hover:text-brand-redDark mr-3"
                    >
                      Gerar lançamentos
                    </button>
                  )}
                  {podeGerenciar && (
                    <button
                      onClick={() => alternarRecorrenciaAtiva(r.id)}
                      className="text-xs font-medium text-content-muted hover:text-content-primary"
                    >
                      {r.ativa ? 'Desativar' : 'Reativar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {recorrencias.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-content-muted text-sm">
                  Nenhuma recorrência cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <NovaRecorrenciaModal
          categorias={categoriasFinanceiras}
          centrosCusto={centrosCusto}
          contas={contasFinanceiras}
          onClose={() => setMostrarForm(false)}
          onSalvar={criarRecorrencia}
        />
      )}
    </div>
  )
}

function NovaRecorrenciaModal({
  categorias,
  centrosCusto,
  contas,
  onClose,
  onSalvar,
}: {
  categorias: { id: string; nome: string; tipo: TipoLancamento; ativa: boolean }[]
  centrosCusto: { id: string; nome: string; ativo: boolean }[]
  contas: { id: string; nome: string; ativa: boolean }[]
  onClose: () => void
  onSalvar: (dados: {
    tipo: TipoLancamento
    descricao: string
    valor: number
    categoria_id: string | null
    centro_custo_id: string | null
    conta_financeira_id: string | null
    cliente_fornecedor: string
    frequencia: FrequenciaRecorrencia
    data_inicio: string
    data_fim: string
    quantidade_ocorrencias: number | null
  }) => { ok: boolean; erro?: string }
}) {
  const [tipo, setTipo] = useState<TipoLancamento>('despesa')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState(0)
  const [categoriaId, setCategoriaId] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')
  const [contaId, setContaId] = useState('')
  const [clienteFornecedor, setClienteFornecedor] = useState('')
  const [frequencia, setFrequencia] = useState<FrequenciaRecorrencia>('mensal')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10))
  const [erro, setErro] = useState<string | null>(null)

  function salvar() {
    const r = onSalvar({
      tipo,
      descricao,
      valor,
      categoria_id: categoriaId || null,
      centro_custo_id: centroCustoId || null,
      conta_financeira_id: contaId || null,
      cliente_fornecedor: clienteFornecedor,
      frequencia,
      data_inicio: dataInicio,
      data_fim: '',
      quantidade_ocorrencias: null,
    })
    if (!r.ok) return setErro(r.erro ?? 'Não foi possível salvar.')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50 overflow-y-auto py-8">
      <div className="bg-surface rounded p-6 w-full max-w-lg">
        <h2 className="font-display text-lg text-content-primary mb-5">Nova recorrência</h2>
        {erro && <p className="text-xs text-brand-red mb-4 bg-brand-red/10 px-3 py-2 rounded">{erro}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoLancamento)} className={CAMPO}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Frequência</label>
            <select value={frequencia} onChange={(e) => setFrequencia(e.target.value as FrequenciaRecorrencia)} className={CAMPO}>
              {Object.entries(FREQ_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className={LABEL}>Descrição</label>
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className={`${CAMPO} mb-4`} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Valor (R$)</label>
            <input type="number" min={0.01} step={0.01} value={valor} onChange={(e) => setValor(Number(e.target.value))} className={CAMPO} />
          </div>
          <div>
            <label className={LABEL}>Data de início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={CAMPO} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Categoria</label>
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={CAMPO}>
              <option value="">Selecione...</option>
              {categorias
                .filter((c) => c.tipo === tipo && c.ativa)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Centro de custo</label>
            <select value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)} className={CAMPO}>
              <option value="">Nenhum</option>
              {centrosCusto
                .filter((c) => c.ativo)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={LABEL}>Conta financeira</label>
            <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={CAMPO}>
              <option value="">A definir</option>
              {contas
                .filter((c) => c.ativa)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Cliente/fornecedor</label>
            <input value={clienteFornecedor} onChange={(e) => setClienteFornecedor(e.target.value)} className={CAMPO} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border text-content-secondary text-sm font-medium py-2.5 rounded hover:bg-bg-subtle transition-colors">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={!descricao.trim() || !(valor > 0)}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
