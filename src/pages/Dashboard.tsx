import { useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { DollarSign, TrendingDown, Wallet, Percent, Users, Target, CalendarCheck, Repeat, Plus } from 'lucide-react'
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { SemAcesso } from '../components/SemAcesso'
import { StatusAulaExperimental } from '../types'
import { PageHeader, StatCard, Card, Button, Input, Select, Badge } from '../components/ui'

const COR = {
  azul: '#1E5FA8',
  vermelho: '#E22726',
  cinzaClaro: '#B8B8B4',
}

const STATUS_LEAD_LABEL: Record<StatusAulaExperimental, string> = {
  agendada: 'Agendada',
  compareceu: 'Compareceu',
  convertido: 'Convertido',
  nao_compareceu: 'Não compareceu',
  perdido: 'Perdido',
}

const STATUS_LEAD_TOM: Record<StatusAulaExperimental, 'neutral' | 'info' | 'success' | 'danger'> = {
  agendada: 'neutral',
  compareceu: 'info',
  convertido: 'success',
  nao_compareceu: 'danger',
  perdido: 'neutral',
}

function formatarReais(valor: number) {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function Dashboard() {
  const { temPermissao } = useAuth()
  const {
    alunos,
    mensalidades,
    presentesHoje,
    historicoFinanceiro,
    frequenciaMediaSemanal,
    indicadoresCaptacao,
    aulasExperimentais,
    atualizarStatusLead,
  } = useDemoStore()
  const [mostrarNovoLead, setMostrarNovoLead] = useState(false)

  if (!temPermissao('ver_painel')) {
    return <SemAcesso />
  }

  const mesAtual = historicoFinanceiro[historicoFinanceiro.length - 1]
  const mesAnterior = historicoFinanceiro[historicoFinanceiro.length - 2]
  const mensalidadesAtrasadas = mensalidades.filter((m) => m.status === 'atrasado').length

  const margemLucro = mesAtual.faturamento > 0 ? Math.round((mesAtual.lucro / mesAtual.faturamento) * 100) : 0
  const alunosInicioMes = Math.max(alunos.length - mesAtual.novosAlunos, 1)
  const taxaCaptacao = Math.round((mesAtual.novosAlunos / alunosInicioMes) * 100)

  const variacaoFaturamento =
    mesAnterior && mesAnterior.faturamento !== 0
      ? ((mesAtual.faturamento - mesAnterior.faturamento) / Math.abs(mesAnterior.faturamento)) * 100
      : undefined
  const variacaoDespesas =
    mesAnterior && mesAnterior.despesas !== 0
      ? ((mesAtual.despesas - mesAnterior.despesas) / Math.abs(mesAnterior.despesas)) * 100
      : undefined
  const variacaoLucro =
    mesAnterior && mesAnterior.lucro !== 0
      ? ((mesAtual.lucro - mesAnterior.lucro) / Math.abs(mesAnterior.lucro)) * 100
      : undefined

  const leadsRecentes = [...aulasExperimentais].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 8)

  return (
    <div className="p-4 md:p-8 max-w-[1400px]">
      <PageHeader title="Painel gerencial" description={`Captação, conversão, frequência e resultado financeiro — ${mesAtual.mesLabel}`} />

      {/* ---------- Financeiro do mês ---------- */}
      <div className="text-caption uppercase font-medium text-content-muted mb-2.5">Financeiro do mês</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatCard label="Faturamento" valor={formatarReais(mesAtual.faturamento)} icon={DollarSign} variacao={variacaoFaturamento} />
        <StatCard label="Despesas" valor={formatarReais(mesAtual.despesas)} icon={TrendingDown} variacao={variacaoDespesas} invertido />
        <StatCard
          label="Lucro"
          valor={formatarReais(mesAtual.lucro)}
          icon={Wallet}
          variacao={variacaoLucro}
          tom={mesAtual.lucro >= 0 ? 'success' : 'danger'}
          destaque
        />
        <StatCard label="Margem de lucro" valor={`${margemLucro}%`} icon={Percent} tom={margemLucro >= 20 ? 'success' : 'neutral'} />
      </div>

      {/* ---------- Captação e operação ---------- */}
      <div className="text-caption uppercase font-medium text-content-muted mb-2.5">Captação e operação</div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard label="Alunos ativos" valor={String(alunos.length)} icon={Users} />
        <StatCard label="Taxa de captação" valor={`${taxaCaptacao}%`} icon={Target} />
        <StatCard label="Exp. no mês" valor={String(indicadoresCaptacao.totalMes)} icon={CalendarCheck} />
        <StatCard label="Conversão" valor={`${indicadoresCaptacao.taxaConversao}%`} icon={Repeat} />
        <StatCard label="Freq. média" valor={`${frequenciaMediaSemanal}x/sem`} icon={Users} />
      </div>

      {/* ---------- Gráficos ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className="text-h4 font-medium text-content-primary mb-0.5">Faturamento, despesas e lucro</h3>
          <p className="text-xs text-content-muted mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={historicoFinanceiro} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1E0C" vertical={false} />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: '#5B5B60' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5B5B60' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip formatter={(value: number) => formatarReais(value)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E1' }} />
              <Bar dataKey="faturamento" name="Faturamento" fill={COR.azul} radius={[3, 3, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill={COR.cinzaClaro} radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke={COR.vermelho} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-h4 font-medium text-content-primary mb-0.5">Captação de alunos</h3>
          <p className="text-xs text-content-muted mb-4">Novas matrículas por mês</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={historicoFinanceiro} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1E0C" vertical={false} />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: '#5B5B60' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5B5B60' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E1' }} />
              <Bar dataKey="novosAlunos" name="Novos alunos" fill={COR.azul} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ---------- Funil de captação ---------- */}
      <Card padding="none">
        <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-h4 font-medium text-content-primary">Aulas experimentais recentes</h3>
            <p className="text-xs text-content-muted mt-0.5">Funil de captação — atualize o status conforme o lead avança</p>
          </div>
          <Button size="sm" onClick={() => setMostrarNovoLead(true)}>
            <Plus className="w-3.5 h-3.5" />
            Agendar experimental
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Nome</th>
                <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Origem</th>
                <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Data</th>
                <th className="px-5 py-2.5 text-caption uppercase tracking-wide text-content-muted font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {leadsRecentes.map((lead) => (
                <tr key={lead.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-subtle transition-colors">
                  <td className="px-5 py-3 font-medium text-content-primary">{lead.nome}</td>
                  <td className="px-5 py-3 text-content-secondary text-xs">{lead.origem}</td>
                  <td className="px-5 py-3 font-mono text-xs text-content-secondary">
                    {new Date(lead.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => atualizarStatusLead(lead.id, e.target.value as StatusAulaExperimental)}
                      className="text-xs font-medium bg-transparent border-0 outline-none cursor-pointer rounded"
                    >
                      {(Object.keys(STATUS_LEAD_LABEL) as StatusAulaExperimental[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LEAD_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1">
                      <Badge tom={STATUS_LEAD_TOM[lead.status]}>{STATUS_LEAD_LABEL[lead.status]}</Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {mensalidadesAtrasadas > 0 && (
        <p className="text-xs text-danger mt-4">
          {mensalidadesAtrasadas} mensalidade{mensalidadesAtrasadas > 1 ? 's' : ''} em atraso — veja em Financeiro.
        </p>
      )}

      {presentesHoje.size > 0 && (
        <p className="text-xs text-content-muted mt-1">{presentesHoje.size} check-in(s) registrados hoje.</p>
      )}

      {mostrarNovoLead && <NovoLeadModal onClose={() => setMostrarNovoLead(false)} />}
    </div>
  )
}

function NovoLeadModal({ onClose }: { onClose: () => void }) {
  const { agendarAulaExperimental } = useDemoStore()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [origem, setOrigem] = useState('Instagram')

  function salvar() {
    if (!nome.trim()) return
    agendarAulaExperimental({ nome, telefone, origem })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-mat-950/50 flex items-center justify-center px-4 z-50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-modal p-6 w-full max-w-md animate-scale-in">
        <h2 className="text-h3 font-display text-content-primary mb-5">Agendar aula experimental</h2>

        <div className="space-y-4 mb-6">
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          <Input label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          <Select label="Origem do lead" value={origem} onChange={(e) => setOrigem(e.target.value)}>
            <option>Instagram</option>
            <option>Facebook</option>
            <option>Google</option>
            <option>Indicação</option>
            <option>Passou na frente</option>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!nome.trim()} className="flex-1">
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
