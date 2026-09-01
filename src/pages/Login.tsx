import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, DEMO_MODE } from '../lib/auth'
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_SENHA } from '../lib/demoStore'
import { Button, Input } from '../components/ui'
import logo from '../assets/logo.png'

export function Login() {
  const { loginDemo } = useAuth()
  const [email, setEmail] = useState(DEMO_MODE ? DEMO_ADMIN_EMAIL : '')
  const [senha, setSenha] = useState(DEMO_MODE ? DEMO_ADMIN_SENHA : '')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (DEMO_MODE) {
      const ok = loginDemo(email, senha)
      if (!ok) setErro('E-mail ou senha incorretos.')
      return
    }

    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-mat-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <img src={logo} alt="Gracie Barra" className="w-16 h-16 mx-auto mb-4" />
          <div className="font-display text-base text-white tracking-tight">GRACIE BARRA</div>
          <div className="text-xs font-mono text-white/35 mt-1 uppercase tracking-wide">sistema de gestão</div>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface rounded-lg shadow-modal p-7 border border-white/5">
          <div className="space-y-4 mb-5">
            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="professor@academia.com"
            />
            <Input
              label="Senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {erro && <p className="text-danger text-xs mb-4">{erro}</p>}
          <Button type="submit" loading={carregando} className="w-full">
            Entrar
          </Button>
        </form>
        {DEMO_MODE && (
          <p className="text-center text-xs font-mono text-white/30 mt-5">
            modo demonstração · login já preenchido
          </p>
        )}
        <p className="text-center text-xs font-mono text-white/30 mt-3">
          <a href="#/portal-aluno" className="hover:text-white/60 transition-colors">
            sou aluno — acessar minhas presenças
          </a>
        </p>
      </div>
    </div>
  )
}
