import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, DEMO_MODE } from '../lib/auth'
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_SENHA } from '../lib/demoStore'
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
    <div className="min-h-screen bg-mat-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src={logo} alt="Gracie Barra" className="w-20 h-20 mx-auto mb-4" />
          <div className="font-display text-lg text-gi-50 tracking-tight">GRACIE BARRA</div>
          <div className="text-xs font-mono text-gi-100/40 mt-1">sistema de gestão</div>
        </div>
        <form onSubmit={handleSubmit} className="bg-gi-50 rounded-sm p-8">
          <label className="block text-xs font-mono uppercase tracking-wide text-mat-700 mb-1.5">
            E-mail
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-mat-700/20 rounded-sm px-3 py-2.5 mb-4 text-sm focus:border-brand-red outline-none"
            placeholder="professor@academia.com"
          />
          <label className="block text-xs font-mono uppercase tracking-wide text-mat-700 mb-1.5">
            Senha
          </label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border border-mat-700/20 rounded-sm px-3 py-2.5 mb-5 text-sm focus:border-brand-red outline-none"
            placeholder="••••••••"
          />
          {erro && <p className="text-brand-red text-xs mb-4">{erro}</p>}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-brand-red hover:bg-brand-redDark text-white font-medium py-2.5 rounded-sm transition-colors disabled:opacity-50"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        {DEMO_MODE && (
          <p className="text-center text-xs font-mono text-gi-100/40 mt-5">
            modo demonstração · login já preenchido
          </p>
        )}
      </div>
    </div>
  )
}
