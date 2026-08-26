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
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { SemAcesso } from '../components/SemAcesso'
import { StatusAulaExperimental } from '../types'

const COR = {
  azul: '#1E5FA8',
  vermelho: '#E22726',
  cinza: '#333338',
  cinzaClaro: '#8A8A8E',
}

const STATUS_LEAD_LABEL: Record<StatusAulaExperimental, string> = {
  agendada: 'Agendada',
  compareceu: 'Compareceu',
  convertido: 'Convertido',
  nao_compareceu: 'Não compareceu',
  perdido: 'Perdido',
}

const STATUS_LEAD_STYLE: Record<StatusAulaExperimental, string> = {
  agendada: 'bg-mat-900/8 text-mat-700',
  compareceu: 'bg-brand-blue/10 text-brand-blue',
  convertido: 'bg-brand-blue/15 text-brand-blue font-medium',
  nao_compareceu: 'bg-brand-red/10 text-brand-red',
  perdido: 'bg-mat-700/10 text-mat-700/50',
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

  const variacaoLucro =
    mesAnterior && mesAnterior.lucro !== 0
      ? Math.round(((mesAtual.lucro - mesAnterior.lucro) / Math.abs(mesAnterior.lucro)) * 100)
      : null

  const leadsRecentes = [...aulasExperimentais]
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .slice(0, 8)

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl text-mat-900 mb-1">Painel gerencial</h1>
      <p className="text-sm text-mat-700/60 mb-8">
        Captação, conversão, frequência e resultado financeiro — {mesAtual.mesLabel}
      </p>

      {/* ---------- KPIs financeiros principais ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Kpi label="Faturamento do mês" valor={formatarReais(mesAtual.faturamento)} tom="azul" />
        <Kpi label="Despesas do mês" valor={formatarReais(mesAtual.despesas)} tom="neutro" />
        <Kpi
          label="Lucro do mês"
          valor={formatarReais(mesAtual.lucro)}
          sub={variacaoLucro !== null ? `${variacaoLucro >= 0 ? '+' : ''}${variacaoLucro}% vs mês anterior` : undefined}
          tom={mesAtual.lucro >= 0 ? 'azul' : 'vermelho'}
        />
        <Kpi label="Margem de lucro" valor={`${margemLucro}%`} tom={margemLucro >= 20 ? 'azul' : 'neutro'} />
      </div>

      {/* ---------- KPIs operacionais ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Kpi label="Alunos ativos" valor={alunos.length} compacto />
        <Kpi label="Taxa de captação" valor={`${taxaCaptacao}%`} sub={`${mesAtual.novosAlunos} novos no mês`} compacto />
        <Kpi label="Aulas experimentais" valor={indicadoresCaptacao.totalMes} sub="agendadas no mês" compacto />
        <Kpi label="Taxa de conversão" valor={`${indicadoresCaptacao.taxaConversao}%`} sub="experimental → aluno" compacto />
        <Kpi label="Frequência média" valor={`${frequenciaMediaSemanal}x`} sub="aulas/semana por aluno" compacto />
      </div>

      {/* ---------- Gráficos ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-sm border border-mat-700/10 p-5">
          <h3 className="font-medium text-sm text-mat-900 mb-1">Faturamento, despesas e lucro</h3>
          <p className="text-xs text-mat-700/50 mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={historicoFinanceiro} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33333812" vertical={false} />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: '#333338' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#333338' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                formatter={(value: number) => formatarReais(value)}
                contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #33333820' }}
              />
              <Bar dataKey="faturamento" name="Faturamento" fill={COR.azul} radius={[3, 3, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill={COR.cinzaClaro} radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke={COR.vermelho} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-sm border border-mat-700/10 p-5">
          <h3 className="font-medium text-sm text-mat-900 mb-1">Captação de alunos</h3>
          <p className="text-xs text-mat-700/50 mb-4">Novas matrículas por mês</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={historicoFinanceiro} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33333812" vertical={false} />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: '#333338' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#333338' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #33333820' }} />
              <Bar dataKey="novosAlunos" name="Novos alunos" fill={COR.azul} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---------- Funil de captação / aulas experimentais ---------- */}
      <div className="bg-white rounded-sm border border-mat-700/10 overflow-hidden">
        <div className="p-5 border-b border-mat-700/10 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm text-mat-900">Aulas experimentais recentes</h3>
            <p className="text-xs text-mat-700/50 mt-0.5">Funil de captação — atualize o status conforme o lead avança</p>
          </div>
          <button
            onClick={() => setMostrarNovoLead(true)}
            className="bg-brand-red hover:bg-brand-redDark text-white text-xs font-medium px-3 py-2 rounded-sm transition-colors shrink-0"
          >
            + Agendar aula experimental
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mat-700/10 text-left">
              <th className="px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Nome</th>
              <th className="px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Origem</th>
              <th className="px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Data</th>
              <th className="px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {leadsRecentes.map((lead) => (
              <tr key={lead.id} className="border-b border-mat-700/5 last:border-0 hover:bg-gi-50">
                <td className="px-5 py-3 font-medium text-mat-900">{lead.nome}</td>
                <td className="px-5 py-3 text-mat-700/70 text-xs">{lead.origem}</td>
                <td className="px-5 py-3 font-mono text-xs text-mat-700/70">
                  {new Date(lead.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-5 py-3">
                  <select
                    value={lead.status}
                    onChange={(e) => atualizarStatusLead(lead.id, e.target.value as StatusAulaExperimental)}
                    className={`text-xs font-mono px-2 py-1 rounded-sm border-0 outline-none cursor-pointer ${STATUS_LEAD_STYLE[lead.status]}`}
                  >
                    {(Object.keys(STATUS_LEAD_LABEL) as StatusAulaExperimental[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LEAD_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mensalidadesAtrasadas > 0 && (
        <p className="text-xs text-brand-red mt-4">
          {mensalidadesAtrasadas} mensalidade{mensalidadesAtrasadas > 1 ? 's' : ''} em atraso — veja em Financeiro.
        </p>
      )}

      {presentesHoje.size > 0 && (
        <p className="text-xs text-mat-700/40 mt-1">{presentesHoje.size} check-in(s) registrados hoje.</p>
      )}

      {mostrarNovoLead && <NovoLeadModal onClose={() => setMostrarNovoLead(false)} />}
    </div>
  )
}

type Tom = 'neutro' | 'azul' | 'vermelho'

function Kpi({
  label,
  valor,
  sub,
  tom = 'neutro',
  compacto = false,
}: {
  label: string
  valor: string | number
  sub?: string
  tom?: Tom
  compacto?: boolean
}) {
  const estilos: Record<Tom, { borda: string; fundo: string; texto: string }> = {
    neutro: { borda: 'border-mat-700/10', fundo: 'bg-white', texto: 'text-mat-900' },
    azul: { borda: 'border-brand-blue/25', fundo: 'bg-brand-blue/5', texto: 'text-brand-blue' },
    vermelho: { borda: 'border-brand-red/30', fundo: 'bg-brand-red/5', texto: 'text-brand-red' },
  }
  const e = estilos[tom]
  return (
    <div className={`rounded-sm p-4 border ${e.fundo} ${e.borda}`}>
      <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-2">{label}</div>
      <div className={`font-display ${compacto ? 'text-xl' : 'text-2xl'} ${e.texto}`}>{valor}</div>
      {sub && <div className="text-[11px] text-mat-700/40 mt-1">{sub}</div>}
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
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-md">
        <h2 className="font-display text-lg text-mat-900 mb-5">Agendar aula experimental</h2>

        <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-mat-700/20 rounded-sm px-3 py-2 mb-4 text-sm focus:border-brand-red outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Telefone</label>
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full border border-mat-700/20 rounded-sm px-3 py-2 mb-4 text-sm focus:border-brand-red outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Origem do lead</label>
        <select
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          className="w-full border border-mat-700/20 rounded-sm px-3 py-2 mb-6 text-sm focus:border-brand-red outline-none bg-white"
        >
          <option>Instagram</option>
          <option>Facebook</option>
          <option>Google</option>
          <option>Indicação</option>
          <option>Passou na frente</option>
        </select>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-mat-700/20 text-mat-700 text-sm font-medium py-2.5 rounded-sm hover:bg-gi-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={!nome.trim()}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded-sm transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
