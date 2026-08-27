import { useEffect, useState } from 'react'
import { useAlunoAuth } from '../../lib/alunoAuth'
import { useDemoStore } from '../../lib/demoStore'
import { DEMO_MODE } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Faixa } from '../../components/Faixa'
import { Presenca } from '../../types'
import logo from '../../assets/logo.png'

/** Busca as presenças do aluno logado — do demoStore em modo demo, do Supabase em modo real (RLS já restringe às próprias). */
function usePresencasDoAluno(alunoId: string) {
  const demoStore = useDemoStore()
  const [presencasReais, setPresencasReais] = useState<Presenca[]>([])
  const [carregando, setCarregando] = useState(!DEMO_MODE)

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
  }, [alunoId])

  if (DEMO_MODE) return { presencas: demoStore.presencasDoAluno(alunoId), carregando: false }
  return { presencas: presencasReais, carregando }
}

export function PortalAlunoPainel() {
  const { aluno, sair } = useAlunoAuth()
  const { presencas, carregando } = usePresencasDoAluno(aluno?.id ?? '')

  if (!aluno) return null

  const inicioMes = new Date()
  inicioMes.setDate(1)
  const chaveInicioMes = inicioMes.toISOString().slice(0, 10)
  const presencasNoMes = presencas.filter((p) => p.data >= chaveInicioMes).length

  return (
    <div className="min-h-screen bg-gi-50">
      <header className="bg-mat-900 text-gi-50 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Gracie Barra" className="w-9 h-9" />
          <div>
            <div className="font-display text-sm tracking-tight leading-tight">GRACIE BARRA</div>
            <div className="text-[10px] font-mono text-gi-100/40">portal do aluno</div>
          </div>
        </div>
        <button onClick={sair} className="text-xs font-medium text-brand-red hover:text-white transition-colors">
          Sair
        </button>
      </header>

      <main className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-sm border border-mat-700/10 p-6 mb-6 flex items-center gap-4">
          <Faixa cor={aluno.faixa_atual} grau={aluno.grau_atual} tamanho="md" />
          <div>
            <div className="font-display text-lg text-mat-900">{aluno.nome}</div>
            <div className="text-xs text-mat-700/60">
              Matriculado em {new Date(aluno.data_matricula).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-sm border border-mat-700/10 p-5">
            <div className="text-2xl font-display text-mat-900">{presencas.length}</div>
            <div className="text-xs text-mat-700/60 mt-1">Presenças no total</div>
          </div>
          <div className="bg-white rounded-sm border border-mat-700/10 p-5">
            <div className="text-2xl font-display text-mat-900">{presencasNoMes}</div>
            <div className="text-xs text-mat-700/60 mt-1">Presenças este mês</div>
          </div>
        </div>

        <h2 className="font-display text-base text-mat-900 mb-3">Minhas presenças</h2>
        <div className="bg-white rounded-sm border border-mat-700/10 overflow-hidden">
          {carregando ? (
            <p className="px-5 py-10 text-center text-mat-700/40 text-sm">Carregando...</p>
          ) : presencas.length === 0 ? (
            <p className="px-5 py-10 text-center text-mat-700/40 text-sm">Nenhuma presença registrada ainda.</p>
          ) : (
            <ul>
              {presencas.map((p) => (
                <li
                  key={p.id}
                  className="px-5 py-3.5 border-b border-mat-700/5 last:border-0 flex items-center justify-between"
                >
                  <span className="text-sm text-mat-900">
                    {new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                  </span>
                  <span className="font-mono text-xs text-mat-700/60">{p.hora}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
