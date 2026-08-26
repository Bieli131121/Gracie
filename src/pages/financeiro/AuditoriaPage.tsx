import { useDemoStore } from '../../lib/demoStore'
import { formatarCentavos } from '../../lib/money'

const OPERACAO_LABEL: Record<string, string> = {
  criacao: 'Criação',
  alteracao: 'Alteração',
  pagamento: 'Pagamento',
  recebimento: 'Recebimento',
  cancelamento: 'Cancelamento',
  estorno: 'Estorno',
  ajuste_saldo: 'Ajuste de saldo',
  geracao_recorrencia: 'Geração de recorrência',
}

export function AuditoriaPage() {
  const { saudeFinanceira, auditoria } = useDemoStore()
  const saude = saudeFinanceira()
  const tudoOk =
    saude.semConta === 0 && saude.semCategoria === 0 && saude.possiveisDuplicados.length === 0 && saude.contasComSaldoNegativo.length === 0

  return (
    <div>
      <h2 className="font-display text-lg text-mat-900 mb-4">Saúde financeira</h2>

      {tudoOk ? (
        <div className="bg-emerald-600/10 text-emerald-700 text-sm px-4 py-3 rounded-sm mb-8">
          Nenhuma inconsistência encontrada nos lançamentos e contas ativas.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {saude.semConta > 0 && (
            <div className="bg-white border border-brand-red/20 rounded-sm p-4">
              <div className="text-xs font-mono uppercase tracking-wide text-brand-red mb-1">Sem conta financeira</div>
              <div className="text-sm text-mat-700">{saude.semConta} lançamento(s) sem conta financeira definida.</div>
            </div>
          )}
          {saude.semCategoria > 0 && (
            <div className="bg-white border border-brand-red/20 rounded-sm p-4">
              <div className="text-xs font-mono uppercase tracking-wide text-brand-red mb-1">Sem categoria</div>
              <div className="text-sm text-mat-700">{saude.semCategoria} lançamento(s) sem categoria definida.</div>
            </div>
          )}
          {saude.contasComSaldoNegativo.length > 0 && (
            <div className="bg-white border border-brand-red/20 rounded-sm p-4">
              <div className="text-xs font-mono uppercase tracking-wide text-brand-red mb-1">Saldo negativo</div>
              <div className="text-sm text-mat-700">{saude.contasComSaldoNegativo.join(', ')}</div>
            </div>
          )}
          {saude.possiveisDuplicados.length > 0 && (
            <div className="bg-white border border-brand-red/20 rounded-sm p-4 col-span-2">
              <div className="text-xs font-mono uppercase tracking-wide text-brand-red mb-2">Possíveis lançamentos duplicados</div>
              <ul className="text-sm text-mat-700 space-y-1">
                {saude.possiveisDuplicados.map((d, i) => (
                  <li key={i}>
                    {d.descricao} — {formatarCentavos(d.valor_centavos)} ({d.ids.length} ocorrências idênticas)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <h2 className="font-display text-lg text-mat-900 mb-4">Histórico de auditoria</h2>
      <div className="bg-white rounded-sm border border-mat-700/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mat-700/10 text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Data/hora</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Operação</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Descrição</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Usuário</th>
            </tr>
          </thead>
          <tbody>
            {auditoria.slice(0, 100).map((a) => (
              <tr key={a.id} className="border-b border-mat-700/5 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-mat-700/70 whitespace-nowrap">
                  {new Date(a.data_hora).toLocaleString('pt-BR')}
                </td>
                <td className="px-5 py-3 text-xs text-mat-700/70">{OPERACAO_LABEL[a.operacao] ?? a.operacao}</td>
                <td className="px-5 py-3 text-mat-900">{a.descricao}</td>
                <td className="px-5 py-3 text-xs text-mat-700/60">{a.usuario_nome}</td>
              </tr>
            ))}
            {auditoria.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-mat-700/40 text-sm">
                  Nenhuma operação registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
