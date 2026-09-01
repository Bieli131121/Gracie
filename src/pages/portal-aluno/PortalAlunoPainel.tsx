import { useEffect, useState } from 'react'
import { CalendarX2, Camera } from 'lucide-react'
import { useAlunoAuth } from '../../lib/alunoAuth'
import { useDemoStore } from '../../lib/demoStore'
import { DEMO_MODE } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Faixa } from '../../components/Faixa'
import { Presenca } from '../../types'
import { Skeleton, EmptyState, Badge } from '../../components/ui'
import { PortalAlunoCheckin } from './PortalAlunoCheckin'
import logo from '../../assets/logo.png'

/** Busca as presenças do aluno logado — do demoStore em modo demo, do Supabase em modo real (RLS já restringe às próprias). */
function usePresencasDoAluno(alunoId: string) {
  const demoStore = useDemoStore()
  const [presencasReais, setPresencasReais] = useState<Presenca[]>([])
  const [carregando, setCarregando] = useState(!DEMO_MODE)
  const [chaveRecarga, setChaveRecarga] = useState(0)

  useEffect(() => {
    if (DEMO_MODE || !alunoId) return
    let ativo = true
    setCarregando(true)
    supabase
      .from('presencas')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('data', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setPresencasReais((data as Presenca[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [alunoId, chaveRecarga])

  const recarregar = () => setChaveRecarga((c) => c + 1)

  if (DEMO_MODE) return { presencas: demoStore.presencasDoAluno(alunoId), carregando: false, recarregar }
  return { presencas: presencasReais, carregando, recarregar }
}

export function PortalAlunoPainel() {
  const { aluno, sair } = useAlunoAuth()
  const { presencas, carregando, recarregar } = usePresencasDoAluno(aluno?.id ?? '')
  const [mostrarCheckin, setMostrarCheckin] = useState(false)

  if (!aluno) return null

  const hoje = new Date().toISOString().slice(0, 10)
  const jaFezCheckinHoje = presencas.some((p) => p.data === hoje)

  const inicioMes = new Date()
  inicioMes.setDate(1)
  const chaveInicioMes = inicioMes.toISOString().slice(0, 10)
  const presencasNoMes = presencas.filter((p) => p.data >= chaveInicioMes).length

  return (
    <div className="min-h-screen bg-bg-subtle">
      <header className="bg-mat-900 text-gi-50 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Gracie Barra" className="w-9 h-9" />
          <div>
            <div className="font-display text-sm tracking-tight leading-tight">GRACIE BARRA</div>
            <div className="text-[10px] font-mono text-white/40">portal do aluno</div>
          </div>
        </div>
        <button onClick={sair} className="text-xs font-medium text-brand-red hover:text-white transition-colors">
          Sair
        </button>
      </header>

      <main className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-surface rounded-md border border-border shadow-xs p-6 mb-6 flex items-center gap-4">
          <Faixa cor={aluno.faixa_atual} grau={aluno.grau_atual} tamanho="md" />
          <div>
            <div className="font-display text-lg text-content-primary">{aluno.nome}</div>
            <div className="text-xs text-content-secondary">
              Matriculado em {new Date(aluno.data_matricula).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {jaFezCheckinHoje ? (
          <div className="rounded-md border border-success/30 bg-success-bg px-5 py-4 mb-6 flex items-center gap-3">
            <Badge tom="success">Check-in feito hoje</Badge>
            <span className="text-sm text-content-secondary">Já registramos sua presença de hoje. Até a próxima aula!</span>
          </div>
        ) : (
          <button
            onClick={() => setMostrarCheckin(true)}
            className="w-full bg-brand-red hover:bg-brand-redDark text-white font-medium py-4 rounded-md mb-6 flex items-center justify-center gap-2.5 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Fazer check-in de hoje
          </button>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface rounded-md border border-border shadow-xs p-5">
            <div className="text-2xl font-display text-content-primary">{presencas.length}</div>
            <div className="text-xs text-content-secondary mt-1">Presenças no total</div>
          </div>
          <div className="bg-surface rounded-md border border-border shadow-xs p-5">
            <div className="text-2xl font-display text-content-primary">{presencasNoMes}</div>
            <div className="text-xs text-content-secondary mt-1">Presenças este mês</div>
          </div>
        </div>

        <h2 className="font-display text-base text-content-primary mb-3">Minhas presenças</h2>
        <div className="bg-surface rounded-md border border-border shadow-xs overflow-hidden">
          {carregando ? (
            <div className="divide-y divide-border-subtle">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          ) : presencas.length === 0 ? (
            <EmptyState icon={CalendarX2} title="Nenhuma presença registrada ainda" />
          ) : (
            <ul>
              {presencas.map((p) => (
                <li
                  key={p.id}
                  className="px-5 py-3.5 border-b border-border-subtle last:border-0 flex items-center justify-between"
                >
                  <span className="text-sm text-content-primary">
                    {new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                  </span>
                  <span className="font-mono text-xs text-content-secondary">{p.hora}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {mostrarCheckin && (
        <PortalAlunoCheckin
          onClose={() => setMostrarCheckin(false)}
          onSucesso={() => {
            setMostrarCheckin(false)
            recarregar()
          }}
        />
      )}
    </div>
  )
}
