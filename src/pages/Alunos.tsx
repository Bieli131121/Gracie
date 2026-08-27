import { useState } from 'react'
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { Aluno as AlunoType, FaixaCor } from '../types'
import { Faixa } from '../components/Faixa'
import { SemAcesso } from '../components/SemAcesso'
import { AlunoDetalheModal } from '../components/AlunoDetalheModal'
import { formatarCpf, cpfValido } from '../lib/cpf'

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

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-mat-900 mb-1">Alunos</h1>
          <p className="text-sm text-mat-700/60">{alunos.length} ativos</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2.5 rounded-sm transition-colors"
        >
          + Novo aluno
        </button>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome..."
        className="w-full max-w-sm border border-mat-700/20 rounded-sm px-3 py-2 text-sm mb-6 focus:border-brand-red outline-none bg-white"
      />

      <div className="bg-white rounded-sm border border-mat-700/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mat-700/10 text-left">
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Nome</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Faixa</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Matrícula</th>
              <th className="px-5 py-3 font-mono text-xs uppercase tracking-wide text-mat-700/50 font-medium">Contato</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((aluno) => (
              <tr
                key={aluno.id}
                onClick={() => setAlunoSelecionado(aluno)}
                className="border-b border-mat-700/5 last:border-0 hover:bg-gi-50 cursor-pointer"
              >
                <td className="px-5 py-3.5 font-medium text-mat-900">{aluno.nome}</td>
                <td className="px-5 py-3.5">
                  <Faixa cor={aluno.faixa_atual} grau={aluno.grau_atual} tamanho="sm" mostrarLabel />
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-mat-700/70">
                  {new Date(aluno.data_matricula).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-5 py-3.5 text-mat-700/70">{aluno.telefone ?? aluno.email ?? '—'}</td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-mat-700/40 text-sm">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <NovoAlunoModal
          onClose={() => setMostrarForm(false)}
          onSalvar={(dados) => {
            adicionarAluno(dados)
            setMostrarForm(false)
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
  onSalvar: (dados: { nome: string; telefone: string; email: string; faixa: FaixaCor; cpf: string }) => void
}) {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [faixa, setFaixa] = useState<FaixaCor>('branca')

  function salvar() {
    if (!nome.trim() || !cpfValido(cpf)) return
    onSalvar({ nome, telefone, email, faixa, cpf })
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-md">
        <h2 className="font-display text-lg text-mat-900 mb-5">Novo aluno</h2>

        <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-mat-700/20 rounded-sm px-3 py-2 mb-4 text-sm focus:border-brand-red outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">CPF</label>
        <input
          value={cpf}
          onChange={(e) => setCpf(formatarCpf(e.target.value))}
          placeholder="000.000.000-00"
          className="w-full border border-mat-700/20 rounded-sm px-3 py-2 mb-1 text-sm focus:border-brand-red outline-none"
        />
        <p className="text-xs text-mat-700/40 mb-4">Usado pelo aluno para entrar no portal (portal-aluno)</p>

        <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Telefone</label>
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full border border-mat-700/20 rounded-sm px-3 py-2 mb-4 text-sm focus:border-brand-red outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">E-mail</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-mat-700/20 rounded-sm px-3 py-2 mb-4 text-sm focus:border-brand-red outline-none"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Faixa inicial</label>
        <select
          value={faixa}
          onChange={(e) => setFaixa(e.target.value as FaixaCor)}
          className="w-full border border-mat-700/20 rounded-sm px-3 py-2 mb-6 text-sm focus:border-brand-red outline-none bg-white"
        >
          <option value="branca">Branca</option>
          <option value="azul">Azul</option>
          <option value="roxa">Roxa</option>
          <option value="marrom">Marrom</option>
          <option value="preta">Preta</option>
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
            disabled={!nome.trim() || !cpfValido(cpf)}
            className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded-sm transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
