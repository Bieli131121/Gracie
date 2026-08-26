import { useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useDemoStore } from '../../lib/demoStore'
import { formatarCentavos } from '../../lib/money'

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
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(PERIODO_LABEL) as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`text-xs font-mono uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              periodo === p ? 'bg-mat-900 text-white border-mat-900' : 'bg-white text-mat-700/60 border-mat-700/15 hover:border-mat-700/30'
            }`}
          >
            {PERIODO_LABEL[p]}
          </button>
        ))}
        {periodo === 'personalizado' && (
          <>
            <input type="date" value={inicioPersonalizado} onChange={(e) => setInicioPersonalizado(e.target.value)} className="border border-mat-700/20 rounded-sm px-2 py-1 text-xs bg-white" />
            <input type="date" value={fimPersonalizado} onChange={(e) => setFimPersonalizado(e.target.value)} className="border border-mat-700/20 rounded-sm px-2 py-1 text-xs bg-white" />
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Kpi label="Saldo atual" valor={formatarCentavos(saldoAtual)} />
        <Kpi label="Receitas do período" valor={formatarCentavos(dadosPeriodo.totalReceitas)} tom="verde" />
        <Kpi label="Despesas do período" valor={formatarCentavos(dadosPeriodo.totalDespesas)} tom="vermelho" />
        <Kpi label="Resultado do período" valor={formatarCentavos(resultado)} tom={resultado >= 0 ? 'verde' : 'vermelho'} />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Kpi label="Contas a pagar (em aberto)" valor={formatarCentavos(contasAPagar)} compacto />
        <Kpi label="Contas a receber (em aberto)" valor={formatarCentavos(contasAReceber)} compacto />
        <Kpi label="Lançamentos vencidos" valor={vencidas} compacto tom={vencidas > 0 ? 'vermelho' : 'neutro'} />
        <Kpi label="A vencer" valor={aVencer} compacto />
      </div>

      <div className="bg-white rounded-sm border border-mat-700/10 p-5">
        <h3 className="font-medium text-sm text-mat-900 mb-1">Despesas por categoria</h3>
        <p className="text-xs text-mat-700/50 mb-4">Pagas no período selecionado</p>
        {dadosPeriodo.despesasPorCategoria.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosPeriodo.despesasPorCategoria} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33333812" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#333338' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11, fill: '#333338' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #33333820' }}
              />
              <Bar dataKey="valor" name="Despesa" fill="#E22726" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-mat-700/40 py-10 text-center">Nenhuma despesa paga no período selecionado.</p>
        )}
      </div>
    </div>
  )
}

type Tom = 'neutro' | 'verde' | 'vermelho'

function Kpi({ label, valor, tom = 'neutro', compacto = false }: { label: string; valor: string | number; tom?: Tom; compacto?: boolean }) {
  const estilos: Record<Tom, { borda: string; fundo: string; texto: string }> = {
    neutro: { borda: 'border-mat-700/10', fundo: 'bg-white', texto: 'text-mat-900' },
    verde: { borda: 'border-emerald-600/20', fundo: 'bg-emerald-600/5', texto: 'text-emerald-700' },
    vermelho: { borda: 'border-brand-red/30', fundo: 'bg-brand-red/5', texto: 'text-brand-red' },
  }
  const e = estilos[tom]
  return (
    <div className={`rounded-sm p-4 border ${e.fundo} ${e.borda}`}>
      <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-2">{label}</div>
      <div className={`font-display ${compacto ? 'text-xl' : 'text-2xl'} ${e.texto}`}>{valor}</div>
    </div>
  )
}
