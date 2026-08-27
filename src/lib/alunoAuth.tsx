import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Aluno } from '../types'
import { useDemoStore } from './demoStore'
import { DEMO_MODE } from './auth'
import { supabase } from './supabase'
import { cpfParaEmailAuth, normalizarCpf } from './cpf'

// ============================================================
// Autenticação do PORTAL DO ALUNO — totalmente separada do login
// da equipe (src/lib/auth.tsx). O aluno entra com CPF + a senha
// que ele mesmo cadastra no primeiro acesso; nunca usa e-mail/senha
// de admin, professor ou financeiro.
//
// MODO DEMO: a "senha" fica em memória (campo senha_acesso do
// Aluno, dentro do demoStore) — sem persistir entre recarregamentos,
// igual ao resto do modo demo do sistema.
//
// MODO REAL (DEMO_MODE = false em src/lib/auth.tsx): usa o Supabase
// Auth de verdade. Como o Supabase exige e-mail, o CPF é convertido
// num e-mail sintético (cpfParaEmailAuth) só para uso interno do
// Auth — o aluno nunca vê nem digita esse e-mail. As funções SQL
// aluno_status_cpf / vincular_aluno_por_cpf (ver supabase/schema.sql)
// fazem a ponte entre CPF e o registro em `alunos` respeitando o RLS.
// ============================================================

interface AlunoAuthContextValue {
  aluno: Aluno | null
  logado: boolean
  loading: boolean
  verificarCpf: (cpf: string) => Promise<{ encontrado: boolean; jaTemAcesso: boolean; nome?: string }>
  login: (cpf: string, senha: string) => Promise<{ ok: boolean; erro?: string }>
  cadastrarPrimeiroAcesso: (cpf: string, senha: string) => Promise<{ ok: boolean; erro?: string }>
  sair: () => Promise<void>
}

const AlunoAuthContext = createContext<AlunoAuthContextValue | null>(null)

export function AlunoAuthProvider({ children }: { children: ReactNode }) {
  return DEMO_MODE ? <AlunoAuthProviderDemo>{children}</AlunoAuthProviderDemo> : <AlunoAuthProviderReal>{children}</AlunoAuthProviderReal>
}

// ---------- Implementação: modo demo ----------
function AlunoAuthProviderDemo({ children }: { children: ReactNode }) {
  const { autenticarAluno, cadastrarSenhaAluno, buscarAlunoPorCpf } = useDemoStore()
  const [aluno, setAluno] = useState<Aluno | null>(null)

  async function verificarCpf(cpf: string) {
    const encontrado = buscarAlunoPorCpf(cpf)
    if (!encontrado) return { encontrado: false, jaTemAcesso: false }
    return { encontrado: true, jaTemAcesso: !!encontrado.senha_acesso, nome: encontrado.nome }
  }

  async function login(cpf: string, senha: string) {
    if (!cpf.trim() || !senha) return { ok: false, erro: 'Informe CPF e senha.' }
    const encontrado = autenticarAluno(cpf, senha)
    if (!encontrado) return { ok: false, erro: 'CPF ou senha incorretos.' }
    setAluno(encontrado)
    return { ok: true }
  }

  async function cadastrarPrimeiroAcesso(cpf: string, senha: string) {
    const resultado = cadastrarSenhaAluno(cpf, senha)
    if (!resultado.ok) return resultado
    return login(cpf, senha)
  }

  async function sair() {
    setAluno(null)
  }

  return (
    <AlunoAuthContext.Provider
      value={{ aluno, logado: !!aluno, loading: false, verificarCpf, login, cadastrarPrimeiroAcesso, sair }}
    >
      {children}
    </AlunoAuthContext.Provider>
  )
}

// ---------- Implementação: Supabase real ----------
function AlunoAuthProviderReal({ children }: { children: ReactNode }) {
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [loading, setLoading] = useState(true)

  async function carregarAlunoDaSessao() {
    const { data: sessao } = await supabase.auth.getSession()
    const userId = sessao.session?.user.id
    if (!userId) {
      setAluno(null)
      setLoading(false)
      return
    }
    const { data } = await supabase.from('alunos').select('*').eq('perfil_id', userId).maybeSingle()
    setAluno((data as Aluno) ?? null)
    setLoading(false)
  }

  useEffect(() => {
    carregarAlunoDaSessao()
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      carregarAlunoDaSessao()
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function verificarCpf(cpf: string) {
    const { data: status, error } = await supabase.rpc('aluno_status_cpf', { p_cpf: normalizarCpf(cpf) })
    const linha = Array.isArray(status) ? status[0] : status
    if (error || !linha) return { encontrado: false, jaTemAcesso: false }
    return { encontrado: true, jaTemAcesso: !!linha.ja_tem_acesso, nome: linha.nome as string }
  }

  async function login(cpf: string, senha: string) {
    if (!cpf.trim() || !senha) return { ok: false, erro: 'Informe CPF e senha.' }
    const { error } = await supabase.auth.signInWithPassword({
      email: cpfParaEmailAuth(cpf),
      password: senha,
    })
    if (error) return { ok: false, erro: 'CPF ou senha incorretos.' }
    return { ok: true }
  }

  async function cadastrarPrimeiroAcesso(cpf: string, senha: string) {
    if (senha.length < 6) return { ok: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' }

    // Consulta se o CPF existe e ainda não tem acesso, sem expor o registro inteiro.
    const status = await verificarCpf(cpf)
    if (!status.encontrado) {
      return { ok: false, erro: 'CPF não encontrado. Procure a recepção da academia.' }
    }
    if (status.jaTemAcesso) {
      return { ok: false, erro: 'Este CPF já tem uma senha cadastrada. Faça login normalmente.' }
    }

    const { error: erroCadastro } = await supabase.auth.signUp({
      email: cpfParaEmailAuth(cpf),
      password: senha,
    })
    if (erroCadastro) return { ok: false, erro: 'Não foi possível cadastrar sua senha. Tente novamente.' }

    // A partir daqui já está autenticado (signUp loga automaticamente quando
    // a confirmação de e-mail está desligada, o que faz sentido aqui já que
    // o e-mail é sintético e não existe de verdade).
    const { error: erroVinculo } = await supabase.rpc('vincular_aluno_por_cpf', {
      p_cpf: normalizarCpf(cpf),
      p_nome: status.nome,
    })
    if (erroVinculo) return { ok: false, erro: 'Não foi possível concluir o vínculo do acesso. Fale com a recepção.' }

    await carregarAlunoDaSessao()
    return { ok: true }
  }

  async function sair() {
    await supabase.auth.signOut()
    setAluno(null)
  }

  return (
    <AlunoAuthContext.Provider
      value={{ aluno, logado: !!aluno, loading, verificarCpf, login, cadastrarPrimeiroAcesso, sair }}
    >
      {children}
    </AlunoAuthContext.Provider>
  )
}

export function useAlunoAuth() {
  const ctx = useContext(AlunoAuthContext)
  if (!ctx) throw new Error('useAlunoAuth precisa estar dentro de AlunoAuthProvider')
  return ctx
}
