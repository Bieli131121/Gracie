import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { PermissionKey, ROLE_LABEL } from '../types'
import logo from '../assets/logo.png'

const LINKS: { to: string; label: string; end?: boolean; permissao: PermissionKey }[] = [
  { to: '/', label: 'Painel', end: true, permissao: 'ver_painel' },
  { to: '/alunos', label: 'Alunos', permissao: 'gerenciar_alunos' },
  { to: '/checkin', label: 'Check-in', permissao: 'fazer_checkin' },
  { to: '/financeiro', label: 'Financeiro', permissao: 'ver_financeiro' },
  { to: '/produtos', label: 'Produtos', permissao: 'gerenciar_produtos' },
  { to: '/usuarios', label: 'Administração', permissao: 'gerenciar_usuarios' },
]

export function Layout() {
  const { perfil, signOut, temPermissao } = useAuth()
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)
  const linksVisiveis = LINKS.filter((link) => temPermissao(link.permissao))

  // Fecha o menu automaticamente ao trocar de página (mobile)
  const fecharMenu = () => setMenuAberto(false)

  return (
    <div className="flex min-h-screen bg-gi-50">
      {/* ---------- Barra superior — só aparece no mobile ---------- */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-mat-900 text-gi-50 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Gracie Barra" className="w-8 h-8" />
          <span className="font-display text-sm tracking-tight">GRACIE BARRA</span>
        </div>
        <button
          onClick={() => setMenuAberto((v) => !v)}
          aria-label="Abrir menu"
          className="p-2 -mr-2 text-gi-50"
        >
          {menuAberto ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* ---------- Fundo escurecido ao abrir o menu no mobile ---------- */}
      {menuAberto && (
        <div className="md:hidden fixed inset-0 bg-mat-900/60 z-30" onClick={fecharMenu} aria-hidden="true" />
      )}

      {/* ---------- Sidebar: fixa no desktop, gaveta deslizante no mobile ---------- */}
      <aside
        className={`w-64 md:w-60 shrink-0 bg-mat-900 text-gi-50 flex flex-col fixed md:static inset-y-0 left-0 z-40
          transition-transform duration-200 ease-out
          ${menuAberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="px-6 py-6 border-b border-mat-700 hidden md:flex items-center gap-3">
          <img src={logo} alt="Gracie Barra" className="w-11 h-11" />
          <div>
            <div className="font-display text-sm tracking-tight text-gi-50 leading-tight">GRACIE<br/>BARRA</div>
            <div className="text-[10px] font-mono text-gi-100/40 mt-0.5">sistema de gestão</div>
          </div>
        </div>
        {/* Espaço equivalente à barra superior mobile, pra gaveta não começar por baixo dela */}
        <div className="h-14 md:hidden shrink-0" />
        <nav className="flex-1 py-4 overflow-y-auto">
          {linksVisiveis.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={fecharMenu}
              className={({ isActive }) =>
                `block px-6 py-3 text-sm font-medium border-l-2 transition-colors ${
                  isActive
                    ? 'border-brand-red bg-mat-800 text-gi-50'
                    : 'border-transparent text-gi-100/60 hover:text-gi-50 hover:bg-mat-800/50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-mat-700 text-xs shrink-0">
          <div
            className={`font-mono mb-1 uppercase text-[10px] tracking-wide ${
              perfil?.role === 'admin' ? 'text-brand-red' : 'text-brand-blue'
            }`}
          >
            {perfil ? ROLE_LABEL[perfil.role] : '—'}
          </div>
          <div className="text-gi-50 mb-3">{perfil?.nome ?? 'Carregando...'}</div>
          <button
            onClick={signOut}
            className="text-brand-red hover:text-white transition-colors font-medium"
          >
            Sair
          </button>
        </div>
      </aside>

      <main key={location.pathname} className="flex-1 overflow-auto pt-14 md:pt-0 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
