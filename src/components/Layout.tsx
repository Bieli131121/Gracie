import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  Users,
  ClipboardCheck,
  ShoppingCart,
  Wallet,
  Package,
  ShieldCheck,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { PermissionKey, ROLE_LABEL } from '../types'
import logo from '../assets/logo.png'

const LINKS: { to: string; label: string; end?: boolean; permissao: PermissionKey; icon: typeof LayoutGrid }[] = [
  { to: '/', label: 'Painel', end: true, permissao: 'ver_painel', icon: LayoutGrid },
  { to: '/alunos', label: 'Alunos', permissao: 'gerenciar_alunos', icon: Users },
  { to: '/checkin', label: 'Check-in', permissao: 'fazer_checkin', icon: ClipboardCheck },
  { to: '/venda', label: 'Venda', permissao: 'registrar_venda', icon: ShoppingCart },
  { to: '/financeiro', label: 'Financeiro', permissao: 'ver_financeiro', icon: Wallet },
  { to: '/produtos', label: 'Produtos', permissao: 'gerenciar_produtos', icon: Package },
  { to: '/usuarios', label: 'Administração', permissao: 'gerenciar_usuarios', icon: ShieldCheck },
]

export function Layout() {
  const { perfil, signOut, temPermissao } = useAuth()
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)
  const linksVisiveis = LINKS.filter((link) => temPermissao(link.permissao))
  const paginaAtual = LINKS.find((l) => (l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)))

  const fecharMenu = () => setMenuAberto(false)

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ---------- Barra superior — mobile ---------- */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Gracie Barra" className="w-7 h-7" />
          <span className="text-sm font-medium text-content-primary">{paginaAtual?.label ?? 'GB Sistema'}</span>
        </div>
        <button
          onClick={() => setMenuAberto((v) => !v)}
          aria-label="Abrir menu"
          className="p-2 -mr-2 text-content-secondary"
        >
          {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {menuAberto && (
        <div className="md:hidden fixed inset-0 bg-mat-950/50 z-30 animate-fade-in" onClick={fecharMenu} aria-hidden="true" />
      )}

      {/* ---------- Sidebar ---------- */}
      <aside
        className={`w-64 md:w-60 shrink-0 bg-mat-900 text-white flex flex-col fixed md:static inset-y-0 left-0 z-40
          transition-transform duration-200 ease-out
          ${menuAberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="px-5 py-5 hidden md:flex items-center gap-3">
          <img src={logo} alt="Gracie Barra" className="w-9 h-9" />
          <div>
            <div className="font-display text-xs tracking-tight text-white leading-tight">GRACIE BARRA</div>
            <div className="text-[10px] font-mono text-white/35 mt-0.5 uppercase tracking-wide">gestão</div>
          </div>
        </div>
        <div className="h-14 md:hidden shrink-0" />

        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          <div className="text-caption uppercase text-white/30 font-medium px-2.5 mb-2 mt-1">Menu</div>
          {linksVisiveis.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={fecharMenu}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded text-sm font-medium mb-0.5 transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                    <span>{link.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white shrink-0">
              {perfil?.nome?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-white truncate leading-tight">{perfil?.nome ?? 'Carregando...'}</div>
              <div className="text-[11px] font-mono uppercase tracking-wide text-white/40">
                {perfil ? ROLE_LABEL[perfil.role] : '—'}
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      <main key={location.pathname} className="flex-1 overflow-auto pt-14 md:pt-0 min-w-0 animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
