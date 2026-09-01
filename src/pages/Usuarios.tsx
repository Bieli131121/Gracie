import { useState } from 'react'
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { UserRole, PermissionKey, PERMISSOES_LABEL, ROLE_LABEL } from '../types'
import { SemAcesso } from '../components/SemAcesso'

const PAPEIS: UserRole[] = ['admin', 'professor', 'financeiro', 'aluno']
const PERMISSOES_ORDEM: PermissionKey[] = [
  'ver_painel',
  'gerenciar_alunos',
  'fazer_checkin',
  'registrar_venda',
  'ver_financeiro',
  'gerenciar_financeiro',
  'gerenciar_produtos',
  'gerenciar_usuarios',
]

export function Usuarios() {
  const { temPermissao } = useAuth()
  const { usuarios, permissoes, adicionarUsuario, alternarUsuarioAtivo, alternarPermissao } = useDemoStore()
  const [mostrarForm, setMostrarForm] = useState(false)

  if (!temPermissao('gerenciar_usuarios')) {
    return <SemAcesso />
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-content-primary mb-1">Administração</h1>
          <p className="text-sm text-content-secondary">Usuários do sistema e o que cada papel pode fazer</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2.5 rounded transition-colors"
        >
          + Novo usuário
        </button>
      </div>

      {/* Lista de usuários */}
      <div className="bg-surface rounded-md border border-border shadow-xs overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Nome</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">E-mail</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Papel</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-subtle">
                <td className="px-5 py-3.5 font-medium text-content-primary">{u.nome}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-content-secondary">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded ${
                      u.role === 'admin' ? 'bg-brand-red/10 text-brand-red' : 'bg-brand-blue/10 text-brand-blue'
                    }`}
                  >
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-mono ${u.ativo ? 'text-content-secondary' : 'text-brand-red'}`}>
                    {u.ativo ? 'Ativo' : 'Desativado'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => alternarUsuarioAtivo(u.id)}
                    className="text-xs font-medium text-content-secondary hover:text-brand-red"
                  >
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Matriz de permissões */}
      <div>
        <h2 className="font-display text-lg text-content-primary mb-1">Permissões por papel</h2>
        <p className="text-sm text-content-secondary mb-4">
          Marque o que cada tipo de usuário pode acessar. Vale para todos os usuários daquele papel.
        </p>
        <div className="bg-surface rounded-md border border-border shadow-xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium">
                  Função
                </th>
                {PAPEIS.map((papel) => (
                  <th
                    key={papel}
                    className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-content-muted font-medium text-center"
                  >
                    {ROLE_LABEL[papel]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSOES_ORDEM.map((chave) => (
                <tr key={chave} className="border-b border-border-subtle last:border-0 hover:bg-bg-subtle">
                  <td className="px-5 py-3.5 text-content-primary">{PERMISSOES_LABEL[chave]}</td>
                  {PAPEIS.map((papel) => (
                    <td key={papel} className="px-5 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={permissoes[papel]?.includes(chave) ?? false}
                        onChange={() => alternarPermissao(papel, chave)}
                        className="w-4 h-4 accent-brand-red cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarForm && (
        <NovoUsuarioModal
          onClose={() => setMostrarForm(false)}
          onSalvar={adicionarUsuario}
        />
      )}
    </div>
  )
}

function NovoUsuarioModal({
  onClose,
  onSalvar,
}: {
  onClose: () => void
  onSalvar: (dados: { nome: string; email: string; senha: string; role: UserRole }) => Promise<{ ok: boolean; erro?: string }>
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<UserRole>('professor')
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    const resultado = await onSalvar({ nome, email, senha, role })
    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível salvar.')
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50">
      <div className="bg-surface rounded p-6 w-full max-w-md">
        <h2 className="font-display text-lg text-content-primary mb-5">Novo usuário</h2>

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="mínimo 6 caracteres"
          className="w-full border border-border rounded px-3 py-2 mb-4 text-sm focus:border-mat-900 outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Papel</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full border border-border rounded px-3 py-2 mb-6 text-sm focus:border-mat-900 outline-none bg-surface"
        >
          <option value="admin">Administrador</option>
          <option value="professor">Professor</option>
          <option value="financeiro">Financeiro</option>
          <option value="aluno">Aluno</option>
        </select>

        {erro && <p className="text-brand-red text-xs mb-4">{erro}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-border text-content-secondary text-sm font-medium py-2.5 rounded hover:bg-bg-subtle transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={!nome.trim() || !email.trim() || senha.length < 6}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
