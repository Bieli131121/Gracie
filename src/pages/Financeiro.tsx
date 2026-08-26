import { useState } from 'react'
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { useIsMobile } from '../lib/useIsMobile'
import { StatusMensalidade } from '../types'
import { SemAcesso } from '../components/SemAcesso'
import { DashboardFinanceiroPage } from './financeiro/DashboardFinanceiroPage'
import { LancamentosPage } from './financeiro/LancamentosPage'
import { ContasFinanceirasPage } from './financeiro/ContasFinanceirasPage'
import { CategoriasPage } from './financeiro/CategoriasPage'
import { RecorrenciasPage } from './financeiro/RecorrenciasPage'
import { FluxoCaixaPage } from './financeiro/FluxoCaixaPage'
import { AuditoriaPage } from './financeiro/AuditoriaPage'

const STATUS_STYLE: Record<StatusMensalidade, string> = {
  pago: 'bg-brand-blue/10 text-brand-blue',
  pendente: 'bg-mat-900/8 text-mat-700',
  atrasado: 'bg-brand-red/10 text-brand-red',
  cancelado: 'bg-mat-700/10 text-mat-700/40',
}

const STATUS_LABEL: Record<StatusMensalidade, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

type Aba =
  | 'dashboard'
  | 'mensalidades'
  | 'receitas'
  | 'despesas'
  | 'fluxo_caixa'
  | 'contas_financeiras'
  | 'categorias'
  | 'recorrencias'
  | 'auditoria'

const ABAS: { id: Aba; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'mensalidades', label: 'Mensalidades' },
  { id: 'receitas', label: 'Receitas / A receber' },
  { id: 'despesas', label: 'Despesas / A pagar' },
  { id: 'fluxo_caixa', label: 'Fluxo de caixa' },
  { id: 'contas_financeiras', label: 'Contas financeiras' },
  { id: 'categorias', label: 'Categorias e centros de custo' },
  { id: 'recorrencias', label: 'Recorrências' },
  { id: 'auditoria', label: 'Saúde financeira' },
]

export function Financeiro() {
  const { temPermissao, perfil } = useAuth()
  const [aba, setAba] = useState<Aba>('dashboard')

  if (!temPermissao('ver_financeiro')) {
    return <SemAcesso />
  }

  const podeGerenciar = temPermissao('gerenciar_financeiro')
  const usuarioNome = perfil?.nome ?? 'Usuário'

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-mat-900 mb-1">Financeiro</h1>
        <p className="text-sm text-mat-700/60">
          Contas, receitas, despesas, fluxo de caixa e auditoria financeira da academia.
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`text-xs font-mono uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              aba === a.id
                ? 'bg-mat-900 text-white border-mat-900'
                : 'bg-white text-mat-700/60 border-mat-700/15 hover:border-mat-700/30'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'dashboard' && <DashboardFinanceiroPage />}
      {aba === 'mensalidades' && <AbaMensalidades podeGerenciar={podeGerenciar} usuarioNome={usuarioNome} />}
      {aba === 'receitas' && <LancamentosPage tipo="receita" usuarioNome={usuarioNome} podeGerenciar={podeGerenciar} />}
      {aba === 'despesas' && <LancamentosPage tipo="despesa" usuarioNome={usuarioNome} podeGerenciar={podeGerenciar} />}
      {aba === 'fluxo_caixa' && <FluxoCaixaPage />}
      {aba === 'contas_financeiras' && <ContasFinanceirasPage podeGerenciar={podeGerenciar} usuarioNome={usuarioNome} />}
      {aba === 'categorias' && <CategoriasPage podeGerenciar={podeGerenciar} />}
      {aba === 'recorrencias' && <RecorrenciasPage podeGerenciar={podeGerenciar} usuarioNome={usuarioNome} />}
      {aba === 'auditoria' && <AuditoriaPage />}
    </div>
  )
}

// ============================================================
// Aba Mensalidades (funcionalidade original, preservada)
// ============================================================
function AbaMensalidades({ podeGerenciar, usuarioNome }: { podeGerenciar: boolean; usuarioNome: string }) {
  const { mensalidades, marcarPago, desfazerPagamentoMensalidade } = useDemoStore()
  const [filtro, setFiltro] = useState<StatusMensalidade | 'todos'>('todos')
  const isMobile = useIsMobile()

  const filtradas = mensalidades.filter((m) => filtro === 'todos' || m.status === filtro)
  const totalAtrasado = mensalidades.filter((m) => m.status === 'atrasado').reduce((a, m) => a + Number(m.valor), 0)

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-mat-700/60">
          {totalAtrasado > 0 ? (
            <span className="text-brand-red font-medium">
              R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso
            </span>
          ) : (
            'Nenhuma mensalidade em atraso'
          )}
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['todos', 'pendente', 'atrasado', 'pago'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`text-xs font-mono uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              filtro === s
                ? 'bg-mat-900 text-white border-mat-900'
                : 'bg-white text-mat-700/60 border-mat-700/15 hover:border-mat-700/30'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-white rounded-sm border border-mat-700/10 px-5 py-10 text-center text-mat-700/40 text-sm">
          Nenhuma mensalidade encontrada.
        </div>
      ) : isMobile ? (
        // ---------- Mobile: lista de cards (tabela fica ilegível numa tela pequena) ----------
        <div className="flex flex-col gap-3">
          {filtradas.map((m) => (
            <div key={m.id} className="bg-white rounded-sm border border-mat-700/10 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="font-medium text-mat-900">{m.alunoNome}</span>
                <span className={`text-xs font-mono px-2 py-1 rounded-sm shrink-0 ${STATUS_STYLE[m.status]}`}>
                  {STATUS_LABEL[m.status]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="font-mono text-xs text-mat-700/70">
                  Vence {new Date(m.vencimento).toLocaleDateString('pt-BR')}
                </span>
                <span className="font-mono text-mat-900">
                  R$ {Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {podeGerenciar && (
                <div className="pt-2 border-t border-mat-700/5">
                  {m.status !== 'pago' ? (
                    <button
                      onClick={() => marcarPago(m.id)}
                      className="text-xs font-medium text-brand-red hover:text-brand-redDark"
                    >
                      Marcar pago
                    </button>
                  ) : (
                    <button
                      onClick={() => desfazerPagamentoMensalidade(m.id, usuarioNome)}
                      className="text-xs font-medium text-mat-700/50 hover:text-brand-red"
                    >
                      Desfazer pagamento
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // ---------- Desktop: tabela ----------
        <div className="bg-white rounded-sm border border-mat-700/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mat-700/10 text-left">
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Aluno</th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Vencimento</th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Valor</th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((m) => (
                <tr key={m.id} className="border-b border-mat-700/5 last:border-0 hover:bg-gi-50">
                  <td className="px-5 py-3.5 font-medium text-mat-900">{m.alunoNome}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-mat-700/70">
                    {new Date(m.vencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-mat-900">
                    R$ {Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-mono px-2 py-1 rounded-sm ${STATUS_STYLE[m.status]}`}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {m.status !== 'pago' && podeGerenciar && (
                      <button
                        onClick={() => marcarPago(m.id)}
                        className="text-xs font-medium text-brand-red hover:text-brand-redDark"
                      >
                        Marcar pago
                      </button>
                    )}
                    {m.status === 'pago' && podeGerenciar && (
                      <button
                        onClick={() => desfazerPagamentoMensalidade(m.id, usuarioNome)}
                        className="text-xs font-medium text-mat-700/50 hover:text-brand-red"
                      >
                        Desfazer pagamento
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
