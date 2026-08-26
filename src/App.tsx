import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { DemoStoreProvider } from './lib/demoStore'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Alunos } from './pages/Alunos'
import { CheckIn } from './pages/CheckIn'
import { Financeiro } from './pages/Financeiro'
import { Usuarios } from './pages/Usuarios'
import { Produtos } from './pages/Produtos'

function RotasProtegidas() {
  const { logado, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gi-50">
        <span className="font-mono text-sm text-mat-700/50">carregando...</span>
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
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <DemoStoreProvider>
        <AuthProvider>
          <RotasProtegidas />
        </AuthProvider>
      </DemoStoreProvider>
    </HashRouter>
  )
}
