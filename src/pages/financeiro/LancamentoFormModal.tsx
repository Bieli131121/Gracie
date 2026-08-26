import { useState } from 'react'
import { useDemoStore } from '../../lib/demoStore'
import { TipoLancamento } from '../../types'

interface LancamentoInicial {
  id: string
  descricao: string
  valor_centavos: number
  valor_pago_centavos: number
  data_competencia: string
  data_vencimento: string
  categoria_id: string | null
  centro_custo_id: string | null
  conta_financeira_id: string | null
  cliente_fornecedor: string | null
  observacoes: string | null
  numero_documento: string | null
}

const CAMPO = 'w-full border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none bg-white'
const LABEL = 'block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5'

export function LancamentoFormModal({
  tipo,
  lancamentoInicial,
  onClose,
  onSalvo,
}: {
  tipo: TipoLancamento
  lancamentoInicial?: LancamentoInicial
  onClose: () => void
  onSalvo: () => void
}) {
  const { categoriasFinanceiras, centrosCusto, contasFinanceiras, criarLancamento, atualizarLancamento } = useDemoStore()

  const hoje = new Date().toISOString().slice(0, 10)
  const [descricao, setDescricao] = useState(lancamentoInicial?.descricao ?? '')
  const [valor, setValor] = useState(lancamentoInicial ? lancamentoInicial.valor_centavos / 100 : 0)
  const [dataCompetencia, setDataCompetencia] = useState(lancamentoInicial?.data_competencia ?? hoje)
  const [dataVencimento, setDataVencimento] = useState(lancamentoInicial?.data_vencimento ?? hoje)
  const [categoriaId, setCategoriaId] = useState(lancamentoInicial?.categoria_id ?? '')
  const [centroCustoId, setCentroCustoId] = useState(lancamentoInicial?.centro_custo_id ?? '')
  const [contaId, setContaId] = useState(lancamentoInicial?.conta_financeira_id ?? '')
  const [clienteFornecedor, setClienteFornecedor] = useState(lancamentoInicial?.cliente_fornecedor ?? '')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [numeroDocumento, setNumeroDocumento] = useState(lancamentoInicial?.numero_documento ?? '')
  const [observacoes, setObservacoes] = useState(lancamentoInicial?.observacoes ?? '')
  const [erro, setErro] = useState<string | null>(null)

  const categorias = categoriasFinanceiras.filter((c) => c.tipo === tipo && c.ativa)
  const bloqueado = !!lancamentoInicial && lancamentoInicial.valor_pago_centavos > 0
  const rotulo = tipo === 'receita' ? 'Receita' : 'Despesa'
  const rotuloPessoa = tipo === 'receita' ? 'Cliente' : 'Fornecedor'

  function salvar() {
    if (lancamentoInicial) {
      const r = atualizarLancamento(lancamentoInicial.id, {
        descricao,
        valor,
        data_competencia: dataCompetencia,
        data_vencimento: dataVencimento,
        categoria_id: categoriaId || null,
        centro_custo_id: centroCustoId || null,
        conta_financeira_id: contaId || null,
        cliente_fornecedor: clienteFornecedor,
        observacoes,
        numero_documento: numeroDocumento,
      })
      if (!r.ok) return setErro(r.erro ?? 'Não foi possível salvar.')
    } else {
      const r = criarLancamento({
        tipo,
        descricao,
        valor,
        data_competencia: dataCompetencia,
        data_vencimento: dataVencimento,
        categoria_id: categoriaId || null,
        centro_custo_id: centroCustoId || null,
        conta_financeira_id: contaId || null,
        cliente_fornecedor: clienteFornecedor,
        forma_pagamento: formaPagamento,
        observacoes,
        numero_documento: numeroDocumento,
      })
      if (!r.ok) return setErro(r.erro ?? 'Não foi possível salvar.')
    }
    onSalvo()
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-sm p-6 w-full max-w-lg">
        <h2 className="font-display text-lg text-mat-900 mb-1">
          {lancamentoInicial ? `Editar ${rotulo.toLowerCase()}` : `Nova ${rotulo.toLowerCase()}`}
        </h2>
        {bloqueado && (
          <p className="text-xs text-brand-red mb-4">
            Este lançamento já possui pagamento registrado — o valor não pode mais ser alterado.
          </p>
        )}
        {erro && <p className="text-xs text-brand-red mb-4 bg-brand-red/10 px-3 py-2 rounded-sm">{erro}</p>}

        <div className="mb-4">
          <label className={LABEL}>Descrição</label>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className={CAMPO} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Valor (R$)</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              disabled={bloqueado}
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              className={`${CAMPO} ${bloqueado ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className={LABEL}>{rotuloPessoa}</label>
            <input value={clienteFornecedor} onChange={(e) => setClienteFornecedor(e.target.value)} className={CAMPO} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Data de competência</label>
            <input type="date" value={dataCompetencia} onChange={(e) => setDataCompetencia(e.target.value)} className={CAMPO} />
          </div>
          <div>
            <label className={LABEL}>Data de vencimento</label>
            <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className={CAMPO} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Categoria</label>
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={CAMPO}>
              <option value="">Selecione...</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Centro de custo</label>
            <select value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)} className={CAMPO}>
              <option value="">Nenhum</option>
              {centrosCusto
                .filter((c) => c.ativo)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Conta financeira prevista</label>
            <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={CAMPO}>
              <option value="">A definir no pagamento</option>
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
            <label className={LABEL}>Número/documento</label>
            <input value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} className={CAMPO} />
          </div>
        </div>

        {!lancamentoInicial && (
          <div className="mb-4">
            <label className={LABEL}>Forma de pagamento prevista</label>
            <input
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              placeholder="Pix, boleto, cartão..."
              className={CAMPO}
            />
          </div>
        )}

        <div className="mb-6">
          <label className={LABEL}>Observações</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            className={CAMPO}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-mat-700/20 text-mat-700 text-sm font-medium py-2.5 rounded-sm hover:bg-gi-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={!descricao.trim() || !(valor > 0)}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded-sm transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
