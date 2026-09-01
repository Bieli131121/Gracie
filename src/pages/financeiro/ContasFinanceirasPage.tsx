import { useState } from 'react'
import { useDemoStore } from '../../lib/demoStore'
import { TipoContaFinanceira } from '../../types'
import { formatarCentavos } from '../../lib/money'

const TIPO_LABEL: Record<TipoContaFinanceira, string> = {
  caixa: 'Caixa',
  banco: 'Banco',
  conta_corrente: 'Conta corrente',
  conta_digital: 'Conta digital',
  cartao: 'Cartão',
  outra: 'Outra',
}

const CAMPO = 'w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-white'
const LABEL = 'block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5'

export function ContasFinanceirasPage({ podeGerenciar, usuarioNome }: { podeGerenciar: boolean; usuarioNome: string }) {
  const { contasFinanceiras, criarContaFinanceira, alternarContaFinanceiraAtiva, ajustarSaldoConta } = useDemoStore()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [ajustando, setAjustando] = useState<(typeof contasFinanceiras)[number] | null>(null)

  const totalGeral = contasFinanceiras.filter((c) => c.ativa).reduce((acc, c) => acc + c.saldoAtualCentavos, 0)

  return (
    <div>
      <div className="bg-surface rounded-md border border-border shadow-xs p-4 mb-6 max-w-xs">
        <div className="text-xs font-mono uppercase tracking-wide text-content-muted mb-1">Saldo total (contas ativas)</div>
        <div className="font-display text-2xl text-content-primary">{formatarCentavos(totalGeral)}</div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-content-primary">Contas financeiras</h2>
        {podeGerenciar && (
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2.5 rounded transition-colors"
          >
            + Nova conta
          </button>
        )}
      </div>

      <div className="bg-surface rounded-md border border-border shadow-xs overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Conta</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Tipo</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Saldo inicial</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Saldo atual</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {contasFinanceiras.map((c) => (
              <tr key={c.id} className={`border-b border-border-subtle last:border-0 hover:bg-bg-subtle ${!c.ativa ? 'opacity-40' : ''}`}>
                <td className="px-5 py-3.5 font-medium text-content-primary">{c.nome}</td>
                <td className="px-5 py-3.5 text-xs text-content-secondary">{TIPO_LABEL[c.tipo]}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-content-secondary">
                  {formatarCentavos(c.saldo_inicial_centavos)}
                </td>
                <td
                  className={`px-5 py-3.5 font-mono font-medium ${
                    c.saldoAtualCentavos < 0 ? 'text-brand-red' : 'text-content-primary'
                  }`}
                >
                  {formatarCentavos(c.saldoAtualCentavos)}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  {podeGerenciar && (
                    <>
                      <button
                        onClick={() => setAjustando(c)}
                        className="text-xs font-medium text-content-secondary hover:text-content-primary mr-3"
                      >
                        Ajustar saldo
                      </button>
                      <button
                        onClick={() => alternarContaFinanceiraAtiva(c.id)}
                        className="text-xs font-medium text-content-muted hover:text-brand-red"
                      >
                        {c.ativa ? 'Desativar' : 'Reativar'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarForm && <NovaContaModal onClose={() => setMostrarForm(false)} onSalvar={criarContaFinanceira} />}
      {ajustando && (
        <AjusteSaldoModal
          conta={ajustando}
          onClose={() => setAjustando(null)}
          onAjustar={(valor, motivo) => ajustarSaldoConta(ajustando.id, valor, motivo, usuarioNome)}
        />
      )}
    </div>
  )
}

function NovaContaModal({
  onClose,
  onSalvar,
}: {
  onClose: () => void
  onSalvar: (dados: { nome: string; tipo: TipoContaFinanceira; saldoInicial: number }) => Promise<{ ok: boolean; erro?: string }>
}) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoContaFinanceira>('conta_corrente')
  const [saldoInicial, setSaldoInicial] = useState(0)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    const r = await onSalvar({ nome, tipo, saldoInicial })
    if (!r.ok) return setErro(r.erro ?? 'Não foi possível salvar.')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50">
      <div className="bg-surface rounded p-6 w-full max-w-md">
        <h2 className="font-display text-lg text-content-primary mb-5">Nova conta financeira</h2>
        {erro && <p className="text-xs text-brand-red mb-4 bg-brand-red/10 px-3 py-2 rounded">{erro}</p>}

        <label className={LABEL}>Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} className={`${CAMPO} mb-4`} />

        <label className={LABEL}>Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoContaFinanceira)} className={`${CAMPO} mb-4`}>
          {Object.entries(TIPO_LABEL).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>

        <label className={LABEL}>Saldo inicial (R$)</label>
        <input
          type="number"
          step={0.01}
          value={saldoInicial}
          onChange={(e) => setSaldoInicial(Number(e.target.value))}
          className={`${CAMPO} mb-6`}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border text-content-secondary text-sm font-medium py-2.5 rounded hover:bg-bg-subtle transition-colors">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={!nome.trim()}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function AjusteSaldoModal({
  conta,
  onClose,
  onAjustar,
}: {
  conta: { nome: string; saldoAtualCentavos: number }
  onClose: () => void
  onAjustar: (valor: number, motivo: string) => Promise<{ ok: boolean; erro?: string }>
}) {
  const [valor, setValor] = useState(0)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  async function confirmar() {
    const r = await onAjustar(valor, motivo)
    if (!r.ok) return setErro(r.erro ?? 'Não foi possível ajustar.')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50">
      <div className="bg-surface rounded p-6 w-full max-w-md">
        <h2 className="font-display text-lg text-content-primary mb-1">Ajustar saldo</h2>
        <p className="text-sm text-content-secondary mb-5">{conta.nome} — saldo atual: {formatarCentavos(conta.saldoAtualCentavos)}</p>
        {erro && <p className="text-xs text-brand-red mb-4 bg-brand-red/10 px-3 py-2 rounded">{erro}</p>}

        <label className={LABEL}>Valor do ajuste (R$) — use negativo para reduzir</label>
        <input
          type="number"
          step={0.01}
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          className={`${CAMPO} mb-4`}
        />

        <label className={LABEL}>Motivo (obrigatório, fica registrado na auditoria)</label>
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className={`${CAMPO} mb-6`} />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border text-content-secondary text-sm font-medium py-2.5 rounded hover:bg-bg-subtle transition-colors">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={valor === 0 || !motivo.trim()}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50"
          >
            Confirmar ajuste
          </button>
        </div>
      </div>
    </div>
  )
}
