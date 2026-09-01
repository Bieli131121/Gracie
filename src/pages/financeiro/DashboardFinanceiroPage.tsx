import { useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Wallet, TrendingUp, TrendingDown, Scale, Clock, AlertTriangle, CalendarClock } from 'lucide-react'
import { useDemoStore } from '../../lib/demoStore'
import { formatarCentavos } from '../../lib/money'
import { Card, StatCard } from '../../components/ui'

type Periodo = 'hoje' | 'semana' | 'mes' | 'mes_anterior' | 'ano' | 'personalizado'

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function calcularIntervalo(periodo: Periodo, inicioPersonalizado: string, fimPersonalizado: string): [string, string] {
  const hoje = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  switch (periodo) {
    case 'hoje':
      return [iso(hoje), iso(hoje)]
    case 'semana': {
      const d = new Date(hoje)
      d.setDate(d.getDate() - d.getDay())
      return [iso(d), iso(hoje)]
    }
    case 'mes': {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      return [iso(d), iso(hoje)]
    }
    case 'mes_anterior': {
      const ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
      return [iso(ini), iso(fim)]
    }
    case 'ano': {
      const d = new Date(hoje.getFullYear(), 0, 1)
      return [iso(d), iso(hoje)]
    }
    case 'personalizado':
      return [inicioPersonalizado, fimPersonalizado]
  }
}

const PERIODO_LABEL: Record<Periodo, string> = {
  hoje: 'Hoje',
  semana: 'Esta semana',
  mes: 'Este mês',
  mes_anterior: 'Mês anterior',
  ano: 'Este ano',
  personalizado: 'Personalizado',
}

export function DashboardFinanceiroPage() {
  const { contasFinanceiras, lancamentos } = useDemoStore()
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [inicioPersonalizado, setInicioPersonalizado] = useState(hojeISO())
  const [fimPersonalizado, setFimPersonalizado] = useState(hojeISO())

  const [dataInicio, dataFim] = calcularIntervalo(periodo, inicioPersonalizado, fimPersonalizado)

  const saldoAtual = contasFinanceiras.filter((c) => c.ativa).reduce((acc, c) => acc + c.saldoAtualCentavos, 0)

  const dadosPeriodo = useMemo(() => {
    const receitasPeriodo = lancamentos.filter(
      (l) => l.tipo === 'receita' && l.data_pagamento && l.data_pagamento >= dataInicio && l.data_pagamento <= dataFim
    )
    const despesasPeriodo = lancamentos.filter(
      (l) => l.tipo === 'despesa' && l.data_pagamento && l.data_pagamento >= dataInicio && l.data_pagamento <= dataFim
    )
    const totalReceitas = receitasPeriodo.reduce((acc, l) => acc + l.valor_pago_centavos, 0)
    const totalDespesas = despesasPeriodo.reduce((acc, l) => acc + l.valor_pago_centavos, 0)

    const porCategoria = new Map<string, number>()
    despesasPeriodo.forEach((l) => {
      porCategoria.set(l.categoriaNome, (porCategoria.get(l.categoriaNome) ?? 0) + l.valor_pago_centavos)
    })
    const despesasPorCategoria = Array.from(porCategoria.entries())
      .map(([categoria, centavos]) => ({ categoria, valor: centavos / 100 }))
      .sort((a, b) => b.valor - a.valor)

    return { totalReceitas, totalDespesas, despesasPorCategoria }
  }, [lancamentos, dataInicio, dataFim])

  const ativos = lancamentos.filter((l) => l.statusEfetivo !== 'cancelado')
  const contasAPagar = ativos.filter((l) => l.tipo === 'despesa' && l.statusEfetivo !== 'pago').reduce((acc, l) => acc + l.restanteCentavos, 0)
  const contasAReceber = ativos.filter((l) => l.tipo === 'receita' && l.statusEfetivo !== 'recebido').reduce((acc, l) => acc + l.restanteCentavos, 0)
  const vencidas = ativos.filter((l) => l.statusEfetivo === 'vencido').length
  const aVencer = ativos.filter((l) => (l.statusEfetivo === 'pendente' || l.statusEfetivo.startsWith('parcial')) && l.data_vencimento >= hojeISO()).length

  const resultado = dadosPeriodo.totalReceitas - dadosPeriodo.totalDespesas

  return (
    <div>
      {/* Saldo atual: não depende do período selecionado, por isso fica isolado num cartão de destaque */}
      <Card className="bg-mat-900 border-mat-900 mb-7 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-caption uppercase tracking-wide text-white/45 mb-1.5 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Saldo atual em caixa
          </div>
          <div className="font-mono text-3xl font-medium text-white">{formatarCentavos(saldoAtual)}</div>
        </div>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <h2 className="text-h4 font-medium text-content-primary">Resumo do período</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIODO_LABEL) as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors ${
                periodo === p ? 'bg-mat-900 text-white border-mat-900' : 'bg-surface text-content-secondary border-border hover:border-border-strong'
              }`}
            >
              {PERIODO_LABEL[p]}
            </button>
          ))}
        </div>
      </div>
      {periodo === 'personalizado' && (
        <div className="flex gap-2 mb-4">
          <input type="date" value={inicioPersonalizado} onChange={(e) => setInicioPersonalizado(e.target.value)} className="border border-border rounded px-2 py-1 text-xs bg-surface" />
          <input type="date" value={fimPersonalizado} onChange={(e) => setFimPersonalizado(e.target.value)} className="border border-border rounded px-2 py-1 text-xs bg-surface" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard label="Receitas do período" valor={formatarCentavos(dadosPeriodo.totalReceitas)} icon={TrendingUp} tom="success" />
        <StatCard label="Despesas do período" valor={formatarCentavos(dadosPeriodo.totalDespesas)} icon={TrendingDown} tom="danger" />
        <StatCard label="Resultado do período" valor={formatarCentavos(resultado)} icon={Scale} tom={resultado >= 0 ? 'success' : 'danger'} />
      </div>

      <h2 className="text-h4 font-medium text-content-primary mb-3">Em aberto agora</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Contas a pagar" valor={formatarCentavos(contasAPagar)} icon={Clock} />
        <StatCard label="Contas a receber" valor={formatarCentavos(contasAReceber)} icon={Clock} />
        <StatCard label="Vencidos" valor={String(vencidas)} icon={AlertTriangle} tom={vencidas > 0 ? 'danger' : 'neutral'} />
        <StatCard label="A vencer" valor={String(aVencer)} icon={CalendarClock} />
      </div>

      <Card>
        <h3 className="text-h4 font-medium text-content-primary mb-0.5">Despesas por categoria</h3>
        <p className="text-xs text-content-muted mb-4">Pagas no período selecionado</p>
        {dadosPeriodo.despesasPorCategoria.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosPeriodo.despesasPorCategoria} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1E0C" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#5B5B60' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11, fill: '#5B5B60' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E1' }}
              />
              <Bar dataKey="valor" name="Despesa" fill="#E22726" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-content-muted py-10 text-center">Nenhuma despesa paga no período selecionado.</p>
        )}
      </Card>
    </div>
  )
}
