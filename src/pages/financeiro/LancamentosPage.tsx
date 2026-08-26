import { useState } from 'react'
import { useDemoStore } from '../../lib/demoStore'
import { TipoLancamento, StatusLancamento } from '../../types'
import { formatarCentavos } from '../../lib/money'
import { LancamentoFormModal } from './LancamentoFormModal'
import { PagamentoModal } from './PagamentoModal'

const STATUS_STYLE: Record<StatusLancamento, string> = {
  pendente: 'bg-mat-900/8 text-mat-700',
  vencido: 'bg-brand-red/10 text-brand-red',
  parcialmente_pago: 'bg-brand-blue/10 text-brand-blue',
  parcialmente_recebido: 'bg-brand-blue/10 text-brand-blue',
  pago: 'bg-emerald-600/10 text-emerald-700',
  recebido: 'bg-emerald-600/10 text-emerald-700',
  cancelado: 'bg-mat-700/10 text-mat-700/40',
}

const STATUS_LABEL: Record<StatusLancamento, string> = {
  pendente: 'Pendente',
  vencido: 'Vencido',
  parcialmente_pago: 'Parcialmente pago',
  parcialmente_recebido: 'Parcialmente recebido',
  pago: 'Pago',
  recebido: 'Recebido',
  cancelado: 'Cancelado',
}

type FiltroStatus = 'todos' | 'pendente' | 'vencido' | 'parcial' | 'quitado' | 'cancelado'

export function LancamentosPage({
  tipo,
  usuarioNome,
  podeGerenciar,
}: {
  tipo: TipoLancamento
  usuarioNome: string
  podeGerenciar: boolean
}) {
  const { lancamentos, movimentacoes, cancelarLancamento, estornarMovimentacao } = useDemoStore()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<(typeof lancamentos)[number] | null>(null)
  const [pagando, setPagando] = useState<(typeof lancamentos)[number] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const doTipo = lancamentos.filter((l) => l.tipo === tipo)

  const bateFiltro = (l: (typeof lancamentos)[number]) => {
    switch (filtro) {
      case 'todos':
        return true
      case 'pendente':
        return l.statusEfetivo === 'pendente'
      case 'vencido':
        return l.statusEfetivo === 'vencido'
      case 'parcial':
        return l.statusEfetivo === 'parcialmente_pago' || l.statusEfetivo === 'parcialmente_recebido'
      case 'quitado':
        return l.statusEfetivo === 'pago' || l.statusEfetivo === 'recebido'
      case 'cancelado':
        return l.statusEfetivo === 'cancelado'
    }
  }

  const filtrados = doTipo
    .filter(bateFiltro)
    .filter(
      (l) =>
        !busca.trim() ||
        l.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        (l.cliente_fornecedor ?? '').toLowerCase().includes(busca.toLowerCase())
    )
    .sort((a, b) => (a.data_vencimento < b.data_vencimento ? 1 : -1))

  const ativos = doTipo.filter((l) => l.statusEfetivo !== 'cancelado')
  const totalEmAberto = ativos
    .filter((l) => l.statusEfetivo !== 'pago' && l.statusEfetivo !== 'recebido')
    .reduce((acc, l) => acc + l.restanteCentavos, 0)
  const totalVencido = ativos
    .filter((l) => l.statusEfetivo === 'vencido')
    .reduce((acc, l) => acc + l.restanteCentavos, 0)
  const totalQuitado = ativos
    .filter((l) => l.statusEfetivo === 'pago' || l.statusEfetivo === 'recebido')
    .reduce((acc, l) => acc + l.valor_pago_centavos, 0)

  const quitadoLabel = tipo === 'despesa' ? 'Pago' : 'Recebido'
  const acaoLabel = tipo === 'despesa' ? 'Pagar' : 'Receber'

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">Total em aberto</div>
          <div className="font-display text-xl text-mat-900">{formatarCentavos(totalEmAberto)}</div>
        </div>
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">Vencido</div>
          <div className="font-display text-xl text-brand-red">{formatarCentavos(totalVencido)}</div>
        </div>
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">{quitadoLabel} (total)</div>
          <div className="font-display text-xl text-emerald-700">{formatarCentavos(totalQuitado)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por descrição ou cliente/fornecedor..."
          className="w-full max-w-sm border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none bg-white"
        />
        {podeGerenciar && (
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2.5 rounded-sm transition-colors shrink-0"
          >
            + Nova {tipo === 'receita' ? 'receita' : 'despesa'}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(
          [
            ['todos', 'Todos'],
            ['pendente', 'Pendentes'],
            ['vencido', 'Vencidos'],
            ['parcial', 'Parciais'],
            ['quitado', quitadoLabel + 's'],
            ['cancelado', 'Cancelados'],
          ] as [FiltroStatus, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-xs font-mono uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              filtro === f
                ? 'bg-mat-900 text-white border-mat-900'
                : 'bg-white text-mat-700/60 border-mat-700/15 hover:border-mat-700/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {erro && <p className="text-xs text-brand-red mb-4 bg-brand-red/10 px-3 py-2 rounded-sm">{erro}</p>}

      <div className="bg-white rounded-sm border border-mat-700/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mat-700/10 text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Descrição</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Categoria</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Vencimento</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Valor</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Restante</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((l) => (
              <tr key={l.id} className="border-b border-mat-700/5 last:border-0 hover:bg-gi-50">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-mat-900">{l.descricao}</div>
                  {l.cliente_fornecedor && <div className="text-xs text-mat-700/50">{l.cliente_fornecedor}</div>}
                </td>
                <td className="px-5 py-3.5 text-xs text-mat-700/70">{l.categoriaNome}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-mat-700/70">
                  {new Date(l.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-5 py-3.5 font-mono text-mat-900">{formatarCentavos(l.valor_centavos)}</td>
                <td className="px-5 py-3.5 font-mono text-mat-700/70">
                  {l.restanteCentavos > 0 ? formatarCentavos(l.restanteCentavos) : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-mono px-2 py-1 rounded-sm ${STATUS_STYLE[l.statusEfetivo]}`}>
                    {STATUS_LABEL[l.statusEfetivo]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  {podeGerenciar && l.statusEfetivo !== 'cancelado' && l.statusEfetivo !== 'pago' && l.statusEfetivo !== 'recebido' && (
                    <button
                      onClick={() => setPagando(l)}
                      className="text-xs font-medium text-brand-red hover:text-brand-redDark mr-3"
                    >
                      {acaoLabel}
                    </button>
                  )}
                  {podeGerenciar && (
                    <button
                      onClick={() => setEditando(l)}
                      className="text-xs font-medium text-mat-700 hover:text-mat-900 mr-3"
                    >
                      Editar
                    </button>
                  )}
                  {podeGerenciar && l.statusEfetivo !== 'cancelado' && l.valor_pago_centavos === 0 && (
                    <button
                      onClick={() => {
                        setErro(null)
                        const r = cancelarLancamento(l.id, usuarioNome)
                        if (!r.ok) setErro(r.erro ?? 'Não foi possível cancelar.')
                      }}
                      className="text-xs font-medium text-mat-700/50 hover:text-brand-red"
                    >
                      Cancelar
                    </button>
                  )}
                  {podeGerenciar && l.valor_pago_centavos > 0 && (
                    <button
                      onClick={() => {
                        setErro(null)
                        const ultimaMovimentacao = movimentacoes
                          .filter((m) => m.lancamento_id === l.id && !m.estornada)
                          .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1))[0]
                        if (!ultimaMovimentacao) return setErro('Nenhuma movimentação encontrada para estornar.')
                        const r = estornarMovimentacao(ultimaMovimentacao.id, usuarioNome)
                        if (!r.ok) setErro(r.erro ?? 'Não foi possível estornar.')
                      }}
                      className="text-xs font-medium text-mat-700/50 hover:text-brand-red"
                    >
                      Estornar último pagamento
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-mat-700/40 text-sm">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <LancamentoFormModal tipo={tipo} onClose={() => setMostrarForm(false)} onSalvo={() => setMostrarForm(false)} />
      )}
      {editando && (
        <LancamentoFormModal
          tipo={tipo}
          lancamentoInicial={editando}
          onClose={() => setEditando(null)}
          onSalvo={() => setEditando(null)}
        />
      )}
      {pagando && (
        <PagamentoModal
          lancamento={pagando}
          usuarioNome={usuarioNome}
          onClose={() => setPagando(null)}
          onConfirmado={() => setPagando(null)}
        />
      )}
    </div>
  )
}
