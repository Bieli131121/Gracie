import { useState } from 'react'
import { useDemoStore } from '../../lib/demoStore'
import { TipoLancamento } from '../../types'
import { formatarCentavos } from '../../lib/money'

export function PagamentoModal({
  lancamento,
  usuarioNome,
  onClose,
  onConfirmado,
}: {
  lancamento: {
    id: string
    tipo: TipoLancamento
    descricao: string
    valor_centavos: number
    valor_pago_centavos: number
    conta_financeira_id: string | null
  }
  usuarioNome: string
  onClose: () => void
  onConfirmado: () => void
}) {
  const { contasFinanceiras, registrarPagamentoRecebimento } = useDemoStore()
  const restanteCentavos = lancamento.valor_centavos - lancamento.valor_pago_centavos
  const hoje = new Date().toISOString().slice(0, 10)

  const [valor, setValor] = useState(restanteCentavos / 100)
  const [data, setData] = useState(hoje)
  const [contaId, setContaId] = useState(
    lancamento.conta_financeira_id ?? contasFinanceiras.find((c) => c.ativa)?.id ?? ''
  )
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [erro, setErro] = useState<string | null>(null)

  const acao = lancamento.tipo === 'despesa' ? 'Pagamento' : 'Recebimento'

  async function confirmar() {
    if (!contaId) return setErro('Selecione a conta financeira.')
    const r = await registrarPagamentoRecebimento(
      lancamento.id,
      { valor, data, contaFinanceiraId: contaId, formaPagamento },
      usuarioNome
    )
    if (!r.ok) return setErro(r.erro ?? 'Não foi possível registrar.')
    onConfirmado()
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50">
      <div className="bg-surface rounded p-6 w-full max-w-md">
        <h2 className="font-display text-lg text-content-primary mb-1">{acao}</h2>
        <p className="text-sm text-content-secondary mb-5">{lancamento.descricao}</p>

        <div className="bg-bg-subtle rounded px-4 py-3 mb-5 text-xs font-mono flex justify-between">
          <span className="text-content-secondary">Restante devido</span>
          <span className="text-content-primary font-medium">{formatarCentavos(restanteCentavos)}</span>
        </div>

        {erro && <p className="text-xs text-brand-red mb-4 bg-brand-red/10 px-3 py-2 rounded">{erro}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
              Valor a {lancamento.tipo === 'despesa' ? 'pagar' : 'receber'} (R$)
            </label>
            <input
              type="number"
              min={0.01}
              max={restanteCentavos / 100}
              step={0.01}
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
              Conta financeira
            </label>
            <select
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
            >
              {contasFinanceiras
                .filter((c) => c.ativa)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
              Forma de pagamento
            </label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
            >
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
              <option value="boleto">Boleto</option>
              <option value="transferência">Transferência</option>
            </select>
          </div>
        </div>

        {valor > 0 && valor < restanteCentavos / 100 && (
          <p className="text-xs text-brand-blue mb-4">
            Pagamento parcial — restará {formatarCentavos(restanteCentavos - Math.round(valor * 100))} em aberto.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-border text-content-secondary text-sm font-medium py-2.5 rounded hover:bg-bg-subtle transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!(valor > 0)}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50"
          >
            Confirmar {acao.toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  )
}
