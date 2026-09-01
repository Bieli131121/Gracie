import { useState } from 'react'
import { useDemoStore } from '../lib/demoStore'
import { useAuth } from '../lib/auth'
import { Faixa } from '../components/Faixa'
import { SemAcesso } from '../components/SemAcesso'

export function CheckIn() {
  const { temPermissao } = useAuth()
  const { alunos, presentesHoje, marcarPresenca } = useDemoStore()
  const [busca, setBusca] = useState('')

  if (!temPermissao('fazer_checkin')) {
    return <SemAcesso />
  }

  const filtrados = alunos.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-content-primary mb-1">Check-in</h1>
        <p className="text-sm text-content-secondary">
          {presentesHoje.size} de {alunos.length} alunos hoje ·{' '}
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar aluno para dar check-in..."
        className="w-full max-w-sm border border-border rounded px-3 py-2 text-sm mb-6 focus:border-mat-900 outline-none bg-surface"
        autoFocus
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtrados.map((aluno) => {
          const presente = presentesHoje.has(aluno.id)
          return (
            <button
              key={aluno.id}
              onClick={() => marcarPresenca(aluno.id)}
              disabled={presente}
              className={`text-left rounded border p-4 transition-colors ${
                presente
                  ? 'bg-brand-blue/5 border-brand-blue/30 cursor-default'
                  : 'bg-white border-border hover:border-brand-red/40'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-sm text-content-primary">{aluno.nome}</span>
                {presente && <span className="text-brand-blue text-xs font-mono">✓ presente</span>}
              </div>
              <Faixa cor={aluno.faixa_atual} grau={aluno.grau_atual} tamanho="sm" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
