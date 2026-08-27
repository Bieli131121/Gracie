import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAlunoAuth } from '../../lib/alunoAuth'
import { formatarCpf } from '../../lib/cpf'
import logo from '../../assets/logo.png'

type Etapa = 'cpf' | 'login' | 'cadastro'

export function PortalAlunoAcesso() {
  const { verificarCpf, login, cadastrarPrimeiroAcesso } = useAlunoAuth()

  const [etapa, setEtapa] = useState<Etapa>('cpf')
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [nomeEncontrado, setNomeEncontrado] = useState<string | null>(null)

  async function continuarComCpf(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    const status = await verificarCpf(cpf)
    setCarregando(false)
    if (!status.encontrado) {
      setErro('CPF não encontrado. Procure a recepção da academia para verificar seu cadastro.')
      return
    }
    setNomeEncontrado(status.nome ?? null)
    setEtapa(status.jaTemAcesso ? 'login' : 'cadastro')
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    const resultado = await login(cpf, senha)
    setCarregando(false)
    if (!resultado.ok) setErro(resultado.erro ?? 'Não foi possível entrar.')
  }

  async function handleCadastro(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    setCarregando(true)
    const resultado = await cadastrarPrimeiroAcesso(cpf, senha)
    setCarregando(false)
    if (!resultado.ok) setErro(resultado.erro ?? 'Não foi possível cadastrar sua senha.')
  }

  function voltar() {
    setEtapa('cpf')
    setSenha('')
    setConfirmarSenha('')
    setErro(null)
  }

  return (
    <div className="min-h-screen bg-mat-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src={logo} alt="Gracie Barra" className="w-20 h-20 mx-auto mb-4" />
          <div className="font-display text-lg text-gi-50 tracking-tight">GRACIE BARRA</div>
          <div className="text-xs font-mono text-gi-100/40 mt-1">portal do aluno</div>
        </div>

        <div className="bg-gi-50 rounded-sm p-8">
          {etapa === 'cpf' && (
            <form onSubmit={continuarComCpf}>
              <label className="block text-xs font-mono uppercase tracking-wide text-mat-700 mb-1.5">CPF</label>
              <input
                type="text"
                required
                inputMode="numeric"
                autoFocus
                value={cpf}
                onChange={(e) => setCpf(formatarCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full border border-mat-700/20 rounded-sm px-3 py-2.5 mb-5 text-sm focus:border-brand-red outline-none"
              />
              {erro && <p className="text-brand-red text-xs mb-4">{erro}</p>}
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-brand-red hover:bg-brand-redDark text-white font-medium py-2.5 rounded-sm transition-colors disabled:opacity-50"
              >
                {carregando ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          )}

          {etapa === 'login' && (
            <form onSubmit={handleLogin}>
              <p className="text-sm text-mat-700 mb-4">
                Olá, <span className="font-medium">{nomeEncontrado}</span>! Digite sua senha.
              </p>
              <label className="block text-xs font-mono uppercase tracking-wide text-mat-700 mb-1.5">Senha</label>
              <input
                type="password"
                required
                autoFocus
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-mat-700/20 rounded-sm px-3 py-2.5 mb-5 text-sm focus:border-brand-red outline-none"
              />
              {erro && <p className="text-brand-red text-xs mb-4">{erro}</p>}
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-brand-red hover:bg-brand-redDark text-white font-medium py-2.5 rounded-sm transition-colors mb-3 disabled:opacity-50"
              >
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                type="button"
                onClick={voltar}
                className="w-full text-mat-700/60 text-xs font-medium py-1 hover:text-mat-900 transition-colors"
              >
                Usar outro CPF
              </button>
            </form>
          )}

          {etapa === 'cadastro' && (
            <form onSubmit={handleCadastro}>
              <p className="text-sm text-mat-700 mb-4">
                Olá, <span className="font-medium">{nomeEncontrado}</span>! Este é seu primeiro acesso — crie uma senha.
              </p>
              <label className="block text-xs font-mono uppercase tracking-wide text-mat-700 mb-1.5">Nova senha</label>
              <input
                type="password"
                required
                autoFocus
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="mínimo 6 caracteres"
                className="w-full border border-mat-700/20 rounded-sm px-3 py-2.5 mb-4 text-sm focus:border-brand-red outline-none"
              />
              <label className="block text-xs font-mono uppercase tracking-wide text-mat-700 mb-1.5">Confirmar senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="repita a senha"
                className="w-full border border-mat-700/20 rounded-sm px-3 py-2.5 mb-5 text-sm focus:border-brand-red outline-none"
              />
              {erro && <p className="text-brand-red text-xs mb-4">{erro}</p>}
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-brand-red hover:bg-brand-redDark text-white font-medium py-2.5 rounded-sm transition-colors mb-3 disabled:opacity-50"
              >
                {carregando ? 'Cadastrando...' : 'Cadastrar senha e entrar'}
              </button>
              <button
                type="button"
                onClick={voltar}
                className="w-full text-mat-700/60 text-xs font-medium py-1 hover:text-mat-900 transition-colors"
              >
                Usar outro CPF
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs font-mono text-gi-100/40 mt-5">
          <Link to="/" className="hover:text-gi-100/70 transition-colors">
            sou da equipe — acessar sistema
          </Link>
        </p>
      </div>
    </div>
  )
}
