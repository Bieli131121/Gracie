import { useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { SemAcesso } from '../components/SemAcesso'
import { useIsMobile } from '../lib/useIsMobile'
import { EmptyState } from '../components/ui'
import { formatarCentavos } from '../lib/money'

interface ItemCarrinho {
  produtoId: string
  quantidade: number
}

export function Venda() {
  const { temPermissao, perfil } = useAuth()
  const { produtos, contasFinanceiras, venderProdutos } = useDemoStore()
  const isMobile = useIsMobile()

  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [clienteNome, setClienteNome] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [contaId, setContaId] = useState(contasFinanceiras.find((c) => c.ativa)?.id ?? '')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [finalizando, setFinalizando] = useState(false)
  const [mostrarCarrinhoMobile, setMostrarCarrinhoMobile] = useState(false)

  if (!temPermissao('registrar_venda')) {
    return <SemAcesso />
  }

  const disponiveis = produtos.filter(
    (p) => p.ativo && p.estoqueAtual > 0 && p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  function quantidadeNoCarrinho(produtoId: string) {
    return carrinho.find((i) => i.produtoId === produtoId)?.quantidade ?? 0
  }

  function adicionar(produtoId: string) {
    const produto = produtos.find((p) => p.id === produtoId)
    if (!produto) return
    setErro(null)
    setCarrinho((prev) => {
      const atual = prev.find((i) => i.produtoId === produtoId)
      const qtdAtual = atual?.quantidade ?? 0
      if (qtdAtual + 1 > produto.estoqueAtual) return prev // não deixa passar do estoque
      if (atual) return prev.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + 1 } : i))
      return [...prev, { produtoId, quantidade: 1 }]
    })
  }

  function remover(produtoId: string) {
    setCarrinho((prev) =>
      prev
        .map((i) => (i.produtoId === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i))
        .filter((i) => i.quantidade > 0)
    )
  }

  function limparCarrinho() {
    setCarrinho([])
    setClienteNome('')
    setErro(null)
  }

  const totalCentavos = carrinho.reduce((soma, item) => {
    const produto = produtos.find((p) => p.id === item.produtoId)
    return produto ? soma + produto.preco_venda_centavos * item.quantidade : soma
  }, 0)
  const totalItens = carrinho.reduce((soma, i) => soma + i.quantidade, 0)

  async function finalizarVenda() {
    setErro(null)
    setSucesso(null)
    setFinalizando(true)
    const resultado = await venderProdutos(
      carrinho,
      { clienteNome, formaPagamento, contaFinanceiraId: contaId, data: new Date().toISOString().slice(0, 10) },
      perfil?.nome
    )
    setFinalizando(false)
    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível concluir a venda.')
      return
    }
    setSucesso(`Venda de ${formatarCentavos(resultado.totalCentavos ?? totalCentavos)} registrada com sucesso.`)
    limparCarrinho()
    setMostrarCarrinhoMobile(false)
    setTimeout(() => setSucesso(null), 4000)
  }

  const carrinhoConteudo = (
    <div className="bg-surface rounded-md border border-border shadow-xs p-5 flex flex-col h-full">
      <h2 className="font-display text-base text-content-primary mb-4">Carrinho</h2>

      {carrinho.length === 0 ? (
        <p className="text-sm text-content-muted text-center py-10">Nenhum item adicionado ainda.</p>
      ) : (
        <ul className="flex-1 overflow-y-auto -mx-1 px-1 mb-4">
          {carrinho.map((item) => {
            const produto = produtos.find((p) => p.id === item.produtoId)
            if (!produto) return null
            return (
              <li key={item.produtoId} className="flex items-center justify-between gap-2 py-2.5 border-b border-border-subtle last:border-0">
                <div className="min-w-0">
                  <div className="text-sm text-content-primary truncate">{produto.nome}</div>
                  <div className="text-xs text-content-muted font-mono">{formatarCentavos(produto.preco_venda_centavos)} un.</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => remover(produto.id)}
                    className="w-7 h-7 rounded border border-border text-content-secondary hover:bg-bg-subtle flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-sm font-mono w-5 text-center">{item.quantidade}</span>
                  <button
                    onClick={() => adicionar(produto.id)}
                    disabled={item.quantidade >= produto.estoqueAtual}
                    className="w-7 h-7 rounded border border-border text-content-secondary hover:bg-bg-subtle flex items-center justify-center disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
            Cliente (opcional)
          </label>
          <input
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            placeholder="Nome do aluno ou cliente"
            className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Recebido em</label>
            <select
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
            >
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
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Pagamento</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
            >
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_debito">Cartão débito</option>
              <option value="cartao_credito">Cartão crédito</option>
            </select>
          </div>
        </div>

        {erro && <p className="text-xs text-brand-red">{erro}</p>}

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-content-secondary">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
          <span className="font-display text-xl text-content-primary">
            R$ {(totalCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <button
          onClick={finalizarVenda}
          disabled={carrinho.length === 0 || !contaId || finalizando}
          className="w-full bg-brand-red hover:bg-brand-redDark text-white font-medium py-3 rounded transition-colors disabled:opacity-40"
        >
          {finalizando ? 'Registrando...' : 'Finalizar venda'}
        </button>
        {carrinho.length > 0 && (
          <button onClick={limparCarrinho} className="w-full text-xs text-content-muted hover:text-brand-red transition-colors">
            Esvaziar carrinho
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-content-primary mb-1">Venda</h1>
        <p className="text-sm text-content-secondary">Registre a venda de produtos da loja — a receita e o estoque são atualizados na hora.</p>
      </div>

      {sucesso && (
        <div className="bg-brand-blue/10 border border-brand-blue/30 text-brand-blueDark text-sm rounded px-4 py-3 mb-4">
          {sucesso}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* ---------- Catálogo ---------- */}
        <div className="flex-1 min-w-0">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full max-w-sm border border-border rounded px-3 py-2 text-sm mb-4 focus:border-mat-900 outline-none bg-surface"
            autoFocus
          />

          {disponiveis.length === 0 ? (
            <div className="bg-surface rounded-md border border-border shadow-xs">
              <EmptyState icon={PackageSearch} title="Nenhum produto disponível" description="Verifique a busca ou o estoque dos produtos." />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {disponiveis.map((produto) => {
                const qtd = quantidadeNoCarrinho(produto.id)
                return (
                  <button
                    key={produto.id}
                    onClick={() => adicionar(produto.id)}
                    disabled={qtd >= produto.estoqueAtual}
                    className={`text-left bg-surface rounded border p-3.5 transition-colors relative disabled:opacity-40 ${
                      qtd > 0 ? 'border-brand-red' : 'border-border hover:border-border-strong'
                    }`}
                  >
                    {qtd > 0 && (
                      <span className="absolute -top-2 -right-2 bg-brand-red text-white text-xs font-mono w-6 h-6 rounded-full flex items-center justify-center">
                        {qtd}
                      </span>
                    )}
                    <div className="text-sm text-content-primary font-medium mb-1 line-clamp-2">{produto.nome}</div>
                    <div className="text-xs text-content-muted mb-2">{produto.categoria}</div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-content-primary">{formatarCentavos(produto.preco_venda_centavos)}</span>
                      <span className="text-xs text-content-muted">{produto.estoqueAtual} un.</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ---------- Carrinho: fixo ao lado no desktop, painel deslizante no mobile ---------- */}
        {!isMobile && <div className="w-full md:w-96 shrink-0">{carrinhoConteudo}</div>}
      </div>

      {/* ---------- Botão flutuante + gaveta do carrinho no mobile ---------- */}
      {isMobile && (
        <>
          {carrinho.length > 0 && !mostrarCarrinhoMobile && (
            <button
              onClick={() => setMostrarCarrinhoMobile(true)}
              className="fixed bottom-5 left-4 right-4 bg-brand-red text-white font-medium py-3.5 rounded shadow-lg flex items-center justify-between px-5 z-30"
            >
              <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
              <span>Ver carrinho · R$ {(totalCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </button>
          )}
          {mostrarCarrinhoMobile && (
            <div className="fixed inset-0 z-40 flex flex-col">
              <div className="flex-1 bg-mat-900/60" onClick={() => setMostrarCarrinhoMobile(false)} />
              <div className="bg-bg-subtle rounded-t-lg max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <div className="w-10 h-1 bg-white/15 rounded-full mx-auto" />
                </div>
                <div className="p-4 overflow-y-auto">{carrinhoConteudo}</div>
                <button
                  onClick={() => setMostrarCarrinhoMobile(false)}
                  className="text-center text-xs text-content-muted py-3 border-t border-border"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
