import { useState } from 'react'
import { Plus, FileSearch } from 'lucide-react'
import { useDemoStore } from '../../lib/demoStore'
import { TipoLancamento, StatusLancamento } from '../../types'
import { formatarCentavos } from '../../lib/money'
import { Card, StatCard, Badge, Button, EmptyState, Pagination } from '../../components/ui'
import { usePaginacao } from '../../lib/usePaginacao'
import { LancamentoFormModal } from './LancamentoFormModal'
import { PagamentoModal } from './PagamentoModal'

const STATUS_TOM: Record<StatusLancamento, 'neutral' | 'danger' | 'info' | 'success'> = {
  pendente: 'neutral',
  vencido: 'danger',
  parcialmente_pago: 'info',
  parcialmente_recebido: 'info',
  pago: 'success',
  recebido: 'success',
  cancelado: 'neutral',
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

  const { itensPagina, setPaginaAtual, ...paginacao } = usePaginacao(filtrados, 15)

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total em aberto" valor={formatarCentavos(totalEmAberto)} />
        <StatCard label="Vencido" valor={formatarCentavos(totalVencido)} tom="danger" />
        <StatCard label={`${quitadoLabel} (total)`} valor={formatarCentavos(totalQuitado)} tom="success" />
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por descrição ou cliente/fornecedor..."
          className="w-full max-w-sm border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
        />
        {podeGerenciar && (
          <Button onClick={() => setMostrarForm(true)} className="shrink-0">
            <Plus className="w-4 h-4" />
            Nova {tipo === 'receita' ? 'receita' : 'despesa'}
          </Button>
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
            className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors ${
              filtro === f
                ? 'bg-mat-900 text-white border-mat-900'
                : 'bg-surface text-content-secondary border-border hover:border-border-strong'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {erro && <p className="text-xs text-danger mb-4 bg-danger-bg px-3 py-2 rounded">{erro}</p>}

      <Card padding="none">
        {filtrados.length === 0 ? (
          <EmptyState icon={FileSearch} title="Nenhum lançamento encontrado" description="Ajuste os filtros ou cadastre um novo lançamento." />
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left">
              <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Descrição</th>
              <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Categoria</th>
              <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Vencimento</th>
              <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Valor</th>
              <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Restante</th>
              <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Status</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {itensPagina.map((l) => (
              <tr key={l.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-subtle transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-content-primary">{l.descricao}</div>
                  {l.cliente_fornecedor && <div className="text-xs text-content-muted">{l.cliente_fornecedor}</div>}
                </td>
                <td className="px-5 py-3.5 text-xs text-content-secondary">{l.categoriaNome}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-content-secondary">
                  {new Date(l.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-5 py-3.5 font-mono text-content-primary">{formatarCentavos(l.valor_centavos)}</td>
                <td className="px-5 py-3.5 font-mono text-content-secondary">
                  {l.restanteCentavos > 0 ? formatarCentavos(l.restanteCentavos) : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <Badge tom={STATUS_TOM[l.statusEfetivo]}>{STATUS_LABEL[l.statusEfetivo]}</Badge>
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
                      className="text-xs font-medium text-content-secondary hover:text-content-primary mr-3"
                    >
                      Editar
                    </button>
                  )}
                  {podeGerenciar && l.statusEfetivo !== 'cancelado' && l.valor_pago_centavos === 0 && (
                    <button
                      onClick={async () => {
                        setErro(null)
                        const r = await cancelarLancamento(l.id, usuarioNome)
                        if (!r.ok) setErro(r.erro ?? 'Não foi possível cancelar.')
                      }}
                      className="text-xs font-medium text-content-muted hover:text-danger"
                    >
                      Cancelar
                    </button>
                  )}
                  {podeGerenciar && l.valor_pago_centavos > 0 && (
                    <button
                      onClick={async () => {
                        setErro(null)
                        const ultimaMovimentacao = movimentacoes
                          .filter((m) => m.lancamento_id === l.id && !m.estornada)
                          .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1))[0]
                        if (!ultimaMovimentacao) return setErro('Nenhuma movimentação encontrada para estornar.')
                        const r = await estornarMovimentacao(ultimaMovimentacao.id, usuarioNome)
                        if (!r.ok) setErro(r.erro ?? 'Não foi possível estornar.')
                      }}
                      className="text-xs font-medium text-content-muted hover:text-danger"
                    >
                      Estornar último pagamento
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        <Pagination {...paginacao} onMudarPagina={setPaginaAtual} />
      </Card>

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
