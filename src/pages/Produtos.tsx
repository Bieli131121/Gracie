import { useState } from 'react'
import { PackageX, Truck } from 'lucide-react'
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { SemAcesso } from '../components/SemAcesso'
import { EmptyState, Pagination } from '../components/ui'
import { usePaginacao } from '../lib/usePaginacao'
import { formatarCentavos, paraCentavos } from '../lib/money'

type Aba = 'produtos' | 'fornecedores'

export function Produtos() {
  const { temPermissao } = useAuth()
  const [aba, setAba] = useState<Aba>('produtos')

  if (!temPermissao('gerenciar_produtos')) {
    return <SemAcesso />
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-content-primary mb-1">Produtos e fornecedores</h1>
        <p className="text-sm text-content-secondary">Loja da academia — kimonos, faixas, suplementos e equipamentos</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['produtos', 'fornecedores'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`text-xs font-mono uppercase px-3 py-1.5 rounded border transition-colors ${
              aba === a
                ? 'bg-mat-900 text-white border-mat-900'
                : 'bg-white text-content-secondary border-border hover:border-border-strong'
            }`}
          >
            {a === 'produtos' ? 'Produtos' : 'Fornecedores'}
          </button>
        ))}
      </div>

      {aba === 'produtos' ? <AbaProdutos /> : <AbaFornecedores />}
    </div>
  )
}

// ============================================================
// Aba Produtos
// ============================================================
function AbaProdutos() {
  const { produtos, fornecedores, adicionarProduto, atualizarProduto, alternarProdutoAtivo } = useDemoStore()
  const [busca, setBusca] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<(typeof produtos)[number] | null>(null)

  const filtrados = produtos.filter(
    (p) => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria.toLowerCase().includes(busca.toLowerCase())
  )
  const { itensPagina, setPaginaAtual, ...paginacao } = usePaginacao(filtrados, 12)

  const estoqueBaixoCount = produtos.filter((p) => p.ativo && p.estoqueAtual <= p.estoqueMinimo).length

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou categoria..."
          className="w-full max-w-sm border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
        />
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2.5 rounded transition-colors shrink-0 ml-4"
        >
          + Novo produto
        </button>
      </div>

      {estoqueBaixoCount > 0 && (
        <p className="text-xs text-brand-red mb-4">
          {estoqueBaixoCount} produto{estoqueBaixoCount > 1 ? 's' : ''} com estoque no mínimo ou abaixo.
        </p>
      )}

      <div className="bg-surface rounded-md border border-border shadow-xs overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Produto</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Categoria</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Fornecedor</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Custo</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Venda</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Estoque</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {itensPagina.map((p) => {
              const estoqueBaixo = p.estoqueAtual <= p.estoqueMinimo
              return (
                <tr
                  key={p.id}
                  onClick={() => setEditando(p)}
                  className={`border-b border-border-subtle last:border-0 hover:bg-bg-subtle cursor-pointer ${!p.ativo ? 'opacity-40' : ''}`}
                >
                  <td className="px-5 py-3.5 font-medium text-content-primary">{p.nome}</td>
                  <td className="px-5 py-3.5 text-content-secondary text-xs">{p.categoria}</td>
                  <td className="px-5 py-3.5 text-content-secondary text-xs">{p.fornecedorNome}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-content-secondary">
                    {formatarCentavos(p.preco_custo_centavos)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-content-primary">
                    {formatarCentavos(p.preco_venda_centavos)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-xs font-mono px-2 py-1 rounded ${
                        estoqueBaixo ? 'bg-brand-red/10 text-brand-red' : 'bg-bg-subtle text-content-secondary'
                      }`}
                    >
                      {p.estoqueAtual} un.
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => alternarProdutoAtivo(p.id)}
                      className="text-xs font-medium text-content-secondary hover:text-brand-red"
                    >
                      {p.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState icon={PackageX} title="Nenhum produto encontrado" description="Ajuste a busca ou cadastre um novo produto." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination {...paginacao} onMudarPagina={setPaginaAtual} />
      </div>

      {mostrarForm && (
        <ProdutoModal
          fornecedores={fornecedores}
          onClose={() => setMostrarForm(false)}
          onSalvar={(dados) => {
            const resultado = adicionarProduto(dados)
            if (resultado.ok) setMostrarForm(false)
            return resultado
          }}
        />
      )}

      {editando && (
        <ProdutoModal
          produtoInicial={editando}
          fornecedores={fornecedores}
          onClose={() => setEditando(null)}
          onSalvar={(dados) => {
            const resultado = atualizarProduto(editando.id, dados)
            if (resultado.ok) setEditando(null)
            return resultado
          }}
        />
      )}
    </>
  )
}

function ProdutoModal({
  produtoInicial,
  fornecedores,
  onClose,
  onSalvar,
}: {
  produtoInicial?: {
    nome: string
    categoria: string
    fornecedorId: string | null
    preco_custo_centavos: number
    preco_venda_centavos: number
    estoqueAtual: number
    estoqueMinimo: number
  }
  fornecedores: { id: string; nome: string; ativo: boolean }[]
  onClose: () => void
  onSalvar: (dados: {
    nome: string
    categoria: string
    fornecedorId: string | null
    preco_custo_centavos: number
    preco_venda_centavos: number
    estoqueAtual: number
    estoqueMinimo: number
  }) => { ok: boolean; erro?: string }
}) {
  const [nome, setNome] = useState(produtoInicial?.nome ?? '')
  const [categoria, setCategoria] = useState(produtoInicial?.categoria ?? '')
  const [fornecedorId, setFornecedorId] = useState(produtoInicial?.fornecedorId ?? '')
  // Os campos ficam em reais na tela (mais natural pra digitar); só convertem pra
  // centavos na hora de montar os dados enviados ao store — igual aos formulários do financeiro.
  const [precoCusto, setPrecoCusto] = useState((produtoInicial?.preco_custo_centavos ?? 0) / 100)
  const [precoVenda, setPrecoVenda] = useState((produtoInicial?.preco_venda_centavos ?? 0) / 100)
  const [estoqueAtual, setEstoqueAtual] = useState(produtoInicial?.estoqueAtual ?? 0)
  const [estoqueMinimo, setEstoqueMinimo] = useState(produtoInicial?.estoqueMinimo ?? 0)
  const [erro, setErro] = useState<string | null>(null)

  function salvar() {
    const resultado = onSalvar({
      nome,
      categoria,
      fornecedorId: fornecedorId || null,
      preco_custo_centavos: paraCentavos(precoCusto),
      preco_venda_centavos: paraCentavos(precoVenda),
      estoqueAtual,
      estoqueMinimo,
    })
    if (!resultado.ok) setErro(resultado.erro ?? 'Não foi possível salvar o produto.')
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50 py-8">
      <div className="bg-surface rounded p-6 w-full max-w-md max-h-full overflow-y-auto">
        <h2 className="font-display text-lg text-content-primary mb-5">{produtoInicial ? 'Editar produto' : 'Novo produto'}</h2>

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Categoria</label>
        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Kimonos, Faixas, Suplementos..."
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Fornecedor</label>
        <select
          value={fornecedorId}
          onChange={(e) => setFornecedorId(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none bg-surface"
        >
          <option value="">Sem fornecedor definido</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
              Preço de custo (R$)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={precoCusto}
              onChange={(e) => setPrecoCusto(Number(e.target.value))}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
              Preço de venda (R$)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={precoVenda}
              onChange={(e) => setPrecoVenda(Number(e.target.value))}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
              Estoque atual
            </label>
            <input
              type="number"
              min={0}
              value={estoqueAtual}
              onChange={(e) => setEstoqueAtual(Number(e.target.value))}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
              Estoque mínimo
            </label>
            <input
              type="number"
              min={0}
              value={estoqueMinimo}
              onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
            />
          </div>
        </div>

        {erro && <p className="text-xs text-danger bg-danger-bg rounded px-3 py-2 mb-4">{erro}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-border text-content-secondary text-sm font-medium py-2.5 rounded hover:bg-bg-subtle transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={!nome.trim()}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Aba Fornecedores
// ============================================================
function AbaFornecedores() {
  const { fornecedores, adicionarFornecedor, alternarFornecedorAtivo } = useDemoStore()
  const [busca, setBusca] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const filtrados = fornecedores.filter(
    (f) => f.nome.toLowerCase().includes(busca.toLowerCase()) || f.categoria.toLowerCase().includes(busca.toLowerCase())
  )
  const { itensPagina, setPaginaAtual, ...paginacao } = usePaginacao(filtrados, 12)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou categoria..."
          className="w-full max-w-sm border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
        />
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2.5 rounded transition-colors shrink-0 ml-4"
        >
          + Novo fornecedor
        </button>
      </div>

      <div className="bg-surface rounded-md border border-border shadow-xs overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Fornecedor</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Categoria</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Contato</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Telefone</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">E-mail</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {itensPagina.map((f) => (
              <tr key={f.id} className={`border-b border-border-subtle last:border-0 hover:bg-bg-subtle ${!f.ativo ? 'opacity-40' : ''}`}>
                <td className="px-5 py-3.5 font-medium text-content-primary">{f.nome}</td>
                <td className="px-5 py-3.5 text-content-secondary text-xs">{f.categoria}</td>
                <td className="px-5 py-3.5 text-content-secondary text-xs">{f.contato}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-content-secondary">{f.telefone}</td>
                <td className="px-5 py-3.5 text-content-secondary text-xs">{f.email}</td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => alternarFornecedorAtivo(f.id)}
                    className="text-xs font-medium text-content-secondary hover:text-brand-red"
                  >
                    {f.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState icon={Truck} title="Nenhum fornecedor encontrado" description="Ajuste a busca ou cadastre um novo fornecedor." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination {...paginacao} onMudarPagina={setPaginaAtual} />
      </div>

      {mostrarForm && (
        <FornecedorModal
          onClose={() => setMostrarForm(false)}
          onSalvar={(dados) => {
            adicionarFornecedor(dados)
            setMostrarForm(false)
          }}
        />
      )}
    </>
  )
}

function FornecedorModal({
  onClose,
  onSalvar,
}: {
  onClose: () => void
  onSalvar: (dados: { nome: string; categoria: string; contato: string; telefone: string; email: string }) => void
}) {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [contato, setContato] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')

  function salvar() {
    if (!nome.trim()) return
    onSalvar({ nome, categoria, contato, telefone, email })
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50">
      <div className="bg-surface rounded p-6 w-full max-w-md">
        <h2 className="font-display text-lg text-content-primary mb-5">Novo fornecedor</h2>

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Categoria</label>
        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Kimonos, Suplementos, Equipamentos..."
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Pessoa de contato</label>
        <input
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Telefone</label>
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">E-mail</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 mb-6 text-sm focus:border-mat-900 outline-none"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-border text-content-secondary text-sm font-medium py-2.5 rounded hover:bg-bg-subtle transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={!nome.trim()}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
