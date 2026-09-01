import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { AlunoAuthProvider, useAlunoAuth } from './lib/alunoAuth'
import { DemoStoreProvider } from './lib/demoStore'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Alunos } from './pages/Alunos'
import { CheckIn } from './pages/CheckIn'
import { Venda } from './pages/Venda'
import { Financeiro } from './pages/Financeiro'
import { Usuarios } from './pages/Usuarios'
import { Produtos } from './pages/Produtos'
import { PortalAlunoAcesso } from './pages/portal-aluno/PortalAlunoAcesso'
import { PortalAlunoPainel } from './pages/portal-aluno/PortalAlunoPainel'
import { ToastProvider } from './components/ui'

// ---------- Sistema interno (equipe: admin, professor, financeiro) ----------
function RotasEquipe() {
  const { logado, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <span className="font-mono text-sm text-content-muted">carregando...</span>
      </div>
    )
  }

  if (!logado) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alunos" element={<Alunos />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/venda" element={<Venda />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

// ---------- Portal do aluno (login por CPF, independente do login da equipe) ----------
function RotasPortalAluno() {
  const { logado } = useAlunoAuth()
  return logado ? <PortalAlunoPainel /> : <PortalAlunoAcesso />
}

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <DemoStoreProvider>
          <Routes>
            <Route
              path="/portal-aluno/*"
              element={
                <AlunoAuthProvider>
                  <RotasPortalAluno />
                </AlunoAuthProvider>
              }
            />
            <Route
              path="/*"
              element={
                <AuthProvider>
                  <RotasEquipe />
                </AuthProvider>
              }
            />
          </Routes>
        </DemoStoreProvider>
      </HashRouter>
    </ToastProvider>
  )
}
