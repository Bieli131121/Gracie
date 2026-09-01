import { useState } from 'react'
import { FileX } from 'lucide-react'
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { useIsMobile } from '../lib/useIsMobile'
import { StatusMensalidade } from '../types'
import { formatarCentavos } from '../lib/money'
import { SemAcesso } from '../components/SemAcesso'
import { PageHeader, Card, Badge, Button, EmptyState } from '../components/ui'
import { DashboardFinanceiroPage } from './financeiro/DashboardFinanceiroPage'
import { LancamentosPage } from './financeiro/LancamentosPage'
import { ContasFinanceirasPage } from './financeiro/ContasFinanceirasPage'
import { CategoriasPage } from './financeiro/CategoriasPage'
import { RecorrenciasPage } from './financeiro/RecorrenciasPage'
import { FluxoCaixaPage } from './financeiro/FluxoCaixaPage'
import { AuditoriaPage } from './financeiro/AuditoriaPage'

const STATUS_TOM: Record<StatusMensalidade, 'info' | 'neutral' | 'danger'> = {
  pago: 'info',
  pendente: 'neutral',
  atrasado: 'danger',
  cancelado: 'neutral',
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

// Abas do dia a dia — sempre visíveis, em destaque.
const ABAS_PRINCIPAIS: { id: Aba; label: string }[] = [
  { id: 'dashboard', label: 'Visão geral' },
  { id: 'mensalidades', label: 'Mensalidades' },
  { id: 'receitas', label: 'Receitas' },
  { id: 'despesas', label: 'Despesas' },
  { id: 'fluxo_caixa', label: 'Fluxo de caixa' },
]

// Configuração e consulta ocasional — agrupadas num seletor à parte para não competir por atenção.
const ABAS_CONFIG: { id: Aba; label: string }[] = [
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
  const abaConfigAtiva = ABAS_CONFIG.some((a) => a.id === aba)

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Financeiro"
        description={ABAS_PRINCIPAIS.find((a) => a.id === aba)?.label ?? ABAS_CONFIG.find((a) => a.id === aba)?.label}
      />

      <div className="flex flex-wrap items-center gap-2 mb-7 pb-5 border-b border-border">
        {ABAS_PRINCIPAIS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`text-sm font-medium px-3.5 py-2 rounded transition-colors ${
              aba === a.id ? 'bg-mat-900 text-white' : 'text-content-secondary hover:bg-bg-subtle hover:text-content-primary'
            }`}
          >
            {a.label}
          </button>
        ))}

        <select
          value={abaConfigAtiva ? aba : ''}
          onChange={(e) => setAba(e.target.value as Aba)}
          className={`ml-0 sm:ml-auto text-sm font-medium px-3 py-2 rounded border outline-none cursor-pointer ${
            abaConfigAtiva
              ? 'bg-mat-900 text-white border-mat-900'
              : 'bg-surface text-content-secondary border-border hover:border-border-strong'
          }`}
        >
          <option value="" disabled>
            Configurações...
          </option>
          {ABAS_CONFIG.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
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
  const totalAtrasadoCentavos = mensalidades.filter((m) => m.status === 'atrasado').reduce((a, m) => a + m.valor_centavos, 0)

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm">
          {totalAtrasadoCentavos > 0 ? (
            <span className="text-danger font-medium">{formatarCentavos(totalAtrasadoCentavos)} em atraso</span>
          ) : (
            <span className="text-content-muted">Nenhuma mensalidade em atraso</span>
          )}
        </p>
      </div>

      <div className="flex gap-2 mb-5">
        {(['todos', 'pendente', 'atrasado', 'pago'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors capitalize ${
              filtro === s
                ? 'bg-mat-900 text-white border-mat-900'
                : 'bg-surface text-content-secondary border-border hover:border-border-strong'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <Card padding="none">
          <EmptyState icon={FileX} title="Nenhuma mensalidade encontrada" description="Ajuste o filtro para ver outras mensalidades." />
        </Card>
      ) : isMobile ? (
        // ---------- Mobile: lista de cards (tabela fica ilegível numa tela pequena) ----------
        <div className="flex flex-col gap-3">
          {filtradas.map((m) => (
            <Card key={m.id} padding="sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="font-medium text-content-primary">{m.alunoNome}</span>
                <Badge tom={STATUS_TOM[m.status]}>{STATUS_LABEL[m.status]}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="font-mono text-xs text-content-secondary">
                  Vence {new Date(m.vencimento).toLocaleDateString('pt-BR')}
                </span>
                <span className="font-mono text-content-primary">
                  {formatarCentavos(m.valor_centavos)}
                </span>
              </div>
              {podeGerenciar && (
                <div className="pt-2 border-t border-border-subtle">
                  {m.status !== 'pago' ? (
                    <button onClick={() => marcarPago(m.id)} className="text-xs font-medium text-brand-red hover:text-brand-redDark">
                      Marcar pago
                    </button>
                  ) : (
                    <button
                      onClick={() => desfazerPagamentoMensalidade(m.id, usuarioNome)}
                      className="text-xs font-medium text-content-muted hover:text-danger"
                    >
                      Desfazer pagamento
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        // ---------- Desktop: tabela ----------
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Aluno</th>
                <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Vencimento</th>
                <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Valor</th>
                <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Status</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((m) => (
                <tr key={m.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-subtle transition-colors">
                  <td className="px-5 py-3.5 font-medium text-content-primary">{m.alunoNome}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-content-secondary">
                    {new Date(m.vencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-content-primary">
                    {formatarCentavos(m.valor_centavos)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tom={STATUS_TOM[m.status]}>{STATUS_LABEL[m.status]}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {m.status !== 'pago' && podeGerenciar && (
                      <button onClick={() => marcarPago(m.id)} className="text-xs font-medium text-brand-red hover:text-brand-redDark">
                        Marcar pago
                      </button>
                    )}
                    {m.status === 'pago' && podeGerenciar && (
                      <button
                        onClick={() => desfazerPagamentoMensalidade(m.id, usuarioNome)}
                        className="text-xs font-medium text-content-muted hover:text-danger"
                      >
                        Desfazer pagamento
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
