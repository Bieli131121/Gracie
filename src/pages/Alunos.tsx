import { useState } from 'react'
import { UserX } from 'lucide-react'
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { Aluno as AlunoType, FaixaCor } from '../types'
import { Faixa } from '../components/Faixa'
import { SemAcesso } from '../components/SemAcesso'
import { AlunoDetalheModal } from '../components/AlunoDetalheModal'
import { formatarCpf, cpfValido } from '../lib/cpf'
import { EmptyState, Pagination } from '../components/ui'
import { usePaginacao } from '../lib/usePaginacao'

export function Alunos() {
  const { temPermissao } = useAuth()
  const { alunos, adicionarAluno } = useDemoStore()
  const [busca, setBusca] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoType | null>(null)

  if (!temPermissao('gerenciar_alunos')) {
    return <SemAcesso />
  }

  const filtrados = alunos.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase()))
  const { itensPagina, setPaginaAtual, ...paginacao } = usePaginacao(filtrados, 12)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-content-primary mb-1">Alunos</h1>
          <p className="text-sm text-content-secondary">{alunos.length} ativos</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2.5 rounded transition-colors"
        >
          + Novo aluno
        </button>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome..."
        className="w-full max-w-sm border border-border rounded px-3 py-2 text-sm mb-6 focus:border-mat-900 outline-none bg-surface"
      />

      <div className="bg-surface rounded-md border border-border shadow-xs overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Nome</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Faixa</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Matrícula</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Contato</th>
            </tr>
          </thead>
          <tbody>
            {itensPagina.map((aluno) => (
              <tr
                key={aluno.id}
                onClick={() => setAlunoSelecionado(aluno)}
                className="border-b border-border-subtle last:border-0 hover:bg-bg-subtle cursor-pointer"
              >
                <td className="px-5 py-3.5 font-medium text-content-primary">{aluno.nome}</td>
                <td className="px-5 py-3.5">
                  <Faixa cor={aluno.faixa_atual} grau={aluno.grau_atual} tamanho="sm" mostrarLabel />
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-content-secondary">
                  {new Date(aluno.data_matricula).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-5 py-3.5 text-content-secondary">{aluno.telefone ?? aluno.email ?? '—'}</td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={4} className="p-0">
                  <EmptyState icon={UserX} title="Nenhum aluno encontrado" description="Ajuste a busca ou cadastre um novo aluno." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination {...paginacao} onMudarPagina={setPaginaAtual} />
      </div>

      {mostrarForm && (
        <NovoAlunoModal
          onClose={() => setMostrarForm(false)}
          onSalvar={async (dados) => {
            const resultado = await adicionarAluno(dados)
            if (resultado.ok) setMostrarForm(false)
            return resultado
          }}
        />
      )}

      {alunoSelecionado && (
        <AlunoDetalheModal
          aluno={alunos.find((a) => a.id === alunoSelecionado.id) ?? alunoSelecionado}
          onClose={() => setAlunoSelecionado(null)}
        />
      )}
    </div>
  )
}

function NovoAlunoModal({
  onClose,
  onSalvar,
}: {
  onClose: () => void
  onSalvar: (dados: {
    nome: string
    telefone: string
    email: string
    faixa: FaixaCor
    cpf: string
    senhaAcesso?: string
  }) => Promise<{ ok: boolean; erro?: string }>
}) {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [faixa, setFaixa] = useState<FaixaCor>('branca')
  const [definirSenha, setDefinirSenha] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const senhaValida = !definirSenha || (senha.length >= 6 && senha === confirmarSenha)

  async function salvar() {
    if (!nome.trim() || !cpfValido(cpf) || !senhaValida) return
    setErro(null)
    setSalvando(true)
    const resultado = await onSalvar({ nome, telefone, email, faixa, cpf, senhaAcesso: definirSenha ? senha : undefined })
    setSalvando(false)
    if (!resultado.ok) setErro(resultado.erro ?? 'Não foi possível salvar o aluno.')
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50 py-8">
      <div className="bg-surface rounded p-6 w-full max-w-md max-h-full overflow-y-auto">
        <h2 className="font-display text-lg text-content-primary mb-5">Novo aluno</h2>

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">CPF</label>
        <input
          value={cpf}
          onChange={(e) => setCpf(formatarCpf(e.target.value))}
          placeholder="000.000.000-00"
          className="w-full border border-border rounded px-3 py-2 mb-1 text-sm focus:border-mat-900 outline-none"
        />
        <p className="text-xs text-content-muted mb-4">Usado pelo aluno para entrar no portal (portal-aluno)</p>

        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={definirSenha}
            onChange={(e) => {
              setDefinirSenha(e.target.checked)
              if (!e.target.checked) {
                setSenha('')
                setConfirmarSenha('')
              }
            }}
            className="rounded border-border-strong"
          />
          <span className="text-sm text-content-secondary">Já cadastrar uma senha de acesso ao portal</span>
        </label>

        {definirSenha && (
          <div className="bg-bg-subtle rounded p-4 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="mínimo 6 caracteres"
                className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="repita a senha"
                className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
              />
            </div>
            {senha.length > 0 && senha.length < 6 && (
              <p className="text-xs text-brand-red">A senha precisa ter pelo menos 6 caracteres.</p>
            )}
            {confirmarSenha.length > 0 && senha !== confirmarSenha && (
              <p className="text-xs text-brand-red">As senhas não coincidem.</p>
            )}
            <p className="text-xs text-content-muted">
              Se preferir, deixe desmarcado — o aluno cadastra a própria senha no primeiro acesso ao portal.
            </p>
          </div>
        )}

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
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Faixa inicial</label>
        <select
          value={faixa}
          onChange={(e) => setFaixa(e.target.value as FaixaCor)}
          className="w-full border border-border rounded px-3 py-2 mb-6 text-sm focus:border-mat-900 outline-none bg-surface"
        >
          <option value="branca">Branca</option>
          <option value="azul">Azul</option>
          <option value="roxa">Roxa</option>
          <option value="marrom">Marrom</option>
          <option value="preta">Preta</option>
        </select>

        {erro && <p className="text-xs text-danger mb-4">{erro}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-border text-content-secondary text-sm font-medium py-2.5 rounded hover:bg-bg-subtle transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={!nome.trim() || !cpfValido(cpf) || !senhaValida || salvando}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
