import { useMemo, useState } from 'react'
import { useDemoStore } from '../../lib/demoStore'
import { formatarCentavos } from '../../lib/money'

function primeiroDiaDoMes(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}
function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}
function somarDias(dataISO: string, dias: number): string {
  const d = new Date(dataISO + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}
function fmtData(dataISO: string): string {
  return new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function FluxoCaixaPage() {
  const { contasFinanceiras, movimentacoes, ajustesSaldo, lancamentos } = useDemoStore()
  const [contaId, setContaId] = useState<string>('todas')
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes())
  const [dataFim, setDataFim] = useState(hojeISO())

  const contasConsideradas = contaId === 'todas' ? contasFinanceiras.map((c) => c.id) : [contaId]

  // ---------- Realizado ----------
  const realizado = useMemo(() => {
    const movsPeriodo = movimentacoes.filter(
      (m) => !m.estornada && contasConsideradas.includes(m.conta_financeira_id) && m.data >= dataInicio && m.data <= dataFim
    )

    const saldoInicialContas = contasFinanceiras
      .filter((c) => contasConsideradas.includes(c.id))
      .reduce((acc, c) => acc + c.saldo_inicial_centavos, 0)

    const movsAntes = movimentacoes.filter(
      (m) => !m.estornada && contasConsideradas.includes(m.conta_financeira_id) && m.data < dataInicio
    )
    const ajustesAntes = ajustesSaldo.filter((a) => contasConsideradas.includes(a.conta_financeira_id) && a.data < dataInicio)
    const ajustesPeriodo = ajustesSaldo.filter(
      (a) => contasConsideradas.includes(a.conta_financeira_id) && a.data >= dataInicio && a.data <= dataFim
    )

    let saldoAcumulado =
      saldoInicialContas +
      movsAntes.reduce((acc, m) => acc + (m.tipo === 'entrada' ? m.valor_centavos : -m.valor_centavos), 0) +
      ajustesAntes.reduce((acc, a) => acc + a.valor_centavos, 0)

    const datas = Array.from(
      new Set([...movsPeriodo.map((m) => m.data), ...ajustesPeriodo.map((a) => a.data)])
    ).sort()

    const linhas = datas.map((data) => {
      const doDia = movsPeriodo.filter((m) => m.data === data)
      const ajustesDoDia = ajustesPeriodo.filter((a) => a.data === data)
      const entrada = doDia.filter((m) => m.tipo === 'entrada').reduce((acc, m) => acc + m.valor_centavos, 0)
      const saida = doDia.filter((m) => m.tipo === 'saida').reduce((acc, m) => acc + m.valor_centavos, 0)
      const ajuste = ajustesDoDia.reduce((acc, a) => acc + a.valor_centavos, 0)
      saldoAcumulado += entrada - saida + ajuste
      return { data, entrada, saida, ajuste, saldo: saldoAcumulado }
    })

    return { linhas, saldoInicial: saldoInicialContas + movsAntes.reduce((acc, m) => acc + (m.tipo === 'entrada' ? m.valor_centavos : -m.valor_centavos), 0) + ajustesAntes.reduce((acc, a) => acc + a.valor_centavos, 0), saldoFinal: saldoAcumulado }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movimentacoes, ajustesSaldo, contasFinanceiras, contaId, dataInicio, dataFim])

  // ---------- Previsto ----------
  const previsto = useMemo(() => {
    const hoje = hojeISO()
    const limite = somarDias(hoje, 60)
    const pendentes = lancamentos.filter(
      (l) =>
        l.statusEfetivo !== 'cancelado' &&
        l.statusEfetivo !== 'pago' &&
        l.statusEfetivo !== 'recebido' &&
        l.restanteCentavos > 0 &&
        (contaId === 'todas' || l.conta_financeira_id === contaId) &&
        l.data_vencimento <= limite
    )
    const entradasPrevistas = pendentes.filter((l) => l.tipo === 'receita').reduce((acc, l) => acc + l.restanteCentavos, 0)
    const saidasPrevistas = pendentes.filter((l) => l.tipo === 'despesa').reduce((acc, l) => acc + l.restanteCentavos, 0)
    const vencidas = pendentes.filter((l) => l.statusEfetivo === 'vencido')
    const aVencer = pendentes.filter((l) => l.statusEfetivo !== 'vencido').sort((a, b) => (a.data_vencimento > b.data_vencimento ? 1 : -1))
    return { entradasPrevistas, saidasPrevistas, vencidas, aVencer }
  }, [lancamentos, contaId])

  const saldoAtual = contasFinanceiras
    .filter((c) => contasConsideradas.includes(c.id))
    .reduce((acc, c) => acc + c.saldoAtualCentavos, 0)
  const saldoProjetado = saldoAtual + previsto.entradasPrevistas - previsto.saidasPrevistas

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Conta</label>
          <select
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
            className="border border-mat-700/20 rounded-sm px-3 py-2 text-sm bg-white"
          >
            <option value="todas">Todas as contas</option>
            {contasFinanceiras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">De</label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="border border-mat-700/20 rounded-sm px-3 py-2 text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Até</label>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="border border-mat-700/20 rounded-sm px-3 py-2 text-sm bg-white" />
        </div>
      </div>

      <h2 className="font-display text-lg text-mat-900 mb-3">Realizado</h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">Saldo no início do período</div>
          <div className="font-display text-lg text-mat-900">{formatarCentavos(realizado.saldoInicial)}</div>
        </div>
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">Saldo no fim do período</div>
          <div className="font-display text-lg text-mat-900">{formatarCentavos(realizado.saldoFinal)}</div>
        </div>
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">Saldo atual (hoje)</div>
          <div className="font-display text-lg text-mat-900">{formatarCentavos(saldoAtual)}</div>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-mat-700/10 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mat-700/10 text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Data</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Entradas</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Saídas</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Saldo do dia</th>
            </tr>
          </thead>
          <tbody>
            {realizado.linhas.map((l) => (
              <tr key={l.data} className="border-b border-mat-700/5 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-mat-700/70">{fmtData(l.data)}</td>
                <td className="px-5 py-3 font-mono text-emerald-700">{l.entrada > 0 ? formatarCentavos(l.entrada) : '—'}</td>
                <td className="px-5 py-3 font-mono text-brand-red">{l.saida > 0 ? formatarCentavos(l.saida) : '—'}</td>
                <td className="px-5 py-3 font-mono font-medium text-mat-900">{formatarCentavos(l.saldo)}</td>
              </tr>
            ))}
            {realizado.linhas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-mat-700/40 text-sm">
                  Nenhuma movimentação no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="font-display text-lg text-mat-900 mb-3">Previsto (próximos 60 dias)</h2>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">Entradas previstas</div>
          <div className="font-display text-lg text-emerald-700">{formatarCentavos(previsto.entradasPrevistas)}</div>
        </div>
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">Saídas previstas</div>
          <div className="font-display text-lg text-brand-red">{formatarCentavos(previsto.saidasPrevistas)}</div>
        </div>
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">Saldo projetado</div>
          <div className="font-display text-lg text-mat-900">{formatarCentavos(saldoProjetado)}</div>
        </div>
        <div className="bg-white rounded-sm border border-mat-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-mat-700/50 mb-1">Contas vencidas</div>
          <div className="font-display text-lg text-brand-red">{previsto.vencidas.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-mat-700/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mat-700/10 text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Vencimento</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Descrição</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Tipo</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {[...previsto.vencidas, ...previsto.aVencer].map((l) => (
              <tr key={l.id} className="border-b border-mat-700/5 last:border-0">
                <td className={`px-5 py-3 font-mono text-xs ${l.statusEfetivo === 'vencido' ? 'text-brand-red' : 'text-mat-700/70'}`}>
                  {fmtData(l.data_vencimento)}
                </td>
                <td className="px-5 py-3 text-mat-900">{l.descricao}</td>
                <td className="px-5 py-3 text-xs text-mat-700/60">{l.tipo === 'receita' ? 'A receber' : 'A pagar'}</td>
                <td className={`px-5 py-3 font-mono ${l.tipo === 'receita' ? 'text-emerald-700' : 'text-brand-red'}`}>
                  {formatarCentavos(l.restanteCentavos)}
                </td>
              </tr>
            ))}
            {previsto.vencidas.length + previsto.aVencer.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-mat-700/40 text-sm">
                  Nada previsto para os próximos 60 dias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
