import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { Perfil, PermissionKey } from '../types'
import { useDemoStore } from './demoStore'

// ============================================================
// MODO DEMO: true = login validado contra a lista de usuários
// em memória (src/lib/demoStore.tsx), sem depender de Supabase.
// Ideal para mostrar o sistema para o cliente antes de configurar
// o banco de dados real.
// Quando a academia tiver o Supabase configurado (.env preenchido
// + schema.sql rodado + usuários criados lá), troque para false
// e o login volta a validar de verdade contra o Supabase Auth.
// ============================================================
export const DEMO_MODE = true

interface AuthContextValue {
  logado: boolean
  perfil: Perfil | null
  loading: boolean
  demoMode: boolean
  loginDemo: (email: string, senha: string) => boolean
  signOut: () => Promise<void>
  temPermissao: (chave: PermissionKey) => boolean
}

const AuthContext = createContext<AuthContextValue>({
  logado: false,
  perfil: null,
  loading: true,
  demoMode: DEMO_MODE,
  loginDemo: () => false,
  signOut: async () => {},
  temPermissao: () => false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  // DEMO_MODE é uma constante fixa do build (não muda em tempo de execução),
  // então esta chamada de hook é sempre consistente entre renders.
  const demoStore = useDemoStore()

  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [demoLogado, setDemoLogado] = useState(false)
  const [loading, setLoading] = useState(!DEMO_MODE)
  // Espelha a tabela permissoes_papel do Supabase — carregada uma vez no
  // login e usada pra decidir o que mostrar na interface. A fonte da
  // verdade continua sendo o RLS no banco: isto aqui só evita mostrar
  // botões/menus que a ação seguinte seria bloqueada de qualquer forma.
  const [permissoesReais, setPermissoesReais] = useState<Record<string, PermissionKey[]>>({})

  useEffect(() => {
    if (DEMO_MODE) return // nada a carregar do Supabase no modo demo

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) carregarPerfil(data.session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) carregarPerfil(s.user.id)
      else {
        setPerfil(null)
        setLoading(false)
      }
    })

    carregarPermissoes()

    return () => listener.subscription.unsubscribe()
  }, [])

  async function carregarPerfil(userId: string) {
    const { data } = await supabase.from('perfis').select('*').eq('id', userId).single()
    setPerfil(data as Perfil | null)
    setLoading(false)
  }

  async function carregarPermissoes() {
    const { data } = await supabase.from('permissoes_papel').select('role, permissao')
    if (!data) return
    const agrupado: Record<string, PermissionKey[]> = {}
    for (const linha of data as { role: string; permissao: PermissionKey }[]) {
      agrupado[linha.role] = [...(agrupado[linha.role] ?? []), linha.permissao]
    }
    setPermissoesReais(agrupado)
  }

  function loginDemo(email: string, senha: string) {
    if (!demoStore) return false
    const usuario = demoStore.autenticar(email, senha)
    if (!usuario) return false
    setPerfil({ id: usuario.id, nome: usuario.nome, role: usuario.role, telefone: null })
    setDemoLogado(true)
    return true
  }

  async function signOut() {
    if (DEMO_MODE) {
      setDemoLogado(false)
      setPerfil(null)
      return
    }
    await supabase.auth.signOut()
  }

  function temPermissao(chave: PermissionKey) {
    if (!perfil) return false
    if (DEMO_MODE && demoStore) return demoStore.permissoes[perfil.role]?.includes(chave) ?? false
    // Fora do modo demo: reflete a tabela permissoes_papel carregada do Supabase — a
    // mesma matriz que a tela Administração > Permissões edita. A aplicação real da
    // regra continua no RLS (tem_permissao() no banco); isto aqui é só para a UI.
    return permissoesReais[perfil.role]?.includes(chave) ?? false
  }

  const logado = DEMO_MODE ? demoLogado : !!session

  return (
    <AuthContext.Provider value={{ logado, perfil, loading, demoMode: DEMO_MODE, loginDemo, signOut, temPermissao }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
