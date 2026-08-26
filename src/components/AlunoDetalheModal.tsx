import { useState } from 'react'
import { Aluno, FaixaCor } from '../types'
import { useDemoStore } from '../lib/demoStore'
import { Faixa } from '../components/Faixa'

interface Props {
  aluno: Aluno
  onClose: () => void
}

const LABEL_FAIXA: Record<string, string> = {
  branca: 'Branca',
  azul: 'Azul',
  roxa: 'Roxa',
  marrom: 'Marrom',
  preta: 'Preta',
}

export function AlunoDetalheModal({ aluno, onClose }: Props) {
  const { presencasDoAluno, registrarPresenca, calcularElegibilidade, concederGrau, promoverFaixa } = useDemoStore()
  const [dataNova, setDataNova] = useState(new Date().toISOString().slice(0, 10))
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)

  const presencas = presencasDoAluno(aluno.id)
  const elegibilidade = calcularElegibilidade(aluno.id)

  function handleRegistrarPresenca() {
    const resultado = registrarPresenca(aluno.id, dataNova)
    setMensagem(resultado.ok ? 'Presença registrada com sucesso.' : resultado.erro ?? 'Erro ao registrar presença.')
    setTimeout(() => setMensagem(null), 3000)
  }

  if (editando) {
    return <EditarAlunoForm aluno={aluno} onCancelar={() => setEditando(false)} onSalvo={() => setEditando(false)} />
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50 py-8">
      <div className="bg-white rounded-sm w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="p-6 border-b border-mat-700/10 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-mat-900 mb-2">{aluno.nome}</h2>
            <Faixa cor={aluno.faixa_atual} grau={aluno.grau_atual} tamanho="md" mostrarLabel />
            <p className="text-xs text-mat-700/50 mt-2 font-mono">
              Matrícula em {new Date(aluno.data_matricula).toLocaleDateString('pt-BR')}
              {aluno.data_ultima_graduacao &&
                ` · Última graduação em ${new Date(aluno.data_ultima_graduacao).toLocaleDateString('pt-BR')}`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setEditando(true)}
              className="text-xs font-medium border border-mat-700/20 px-3 py-1.5 rounded-sm hover:bg-gi-50 transition-colors"
            >
              Editar dados
            </button>
            <button onClick={onClose} className="text-mat-700/40 hover:text-mat-900 text-xl leading-none px-1">
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ---------- Elegibilidade para graduação ---------- */}
          {elegibilidade && (
            <div
              className={`rounded-sm border p-4 ${
                elegibilidade.proximaFaixa === null
                  ? 'border-mat-700/15 bg-gi-50'
                  : elegibilidade.apto
                    ? 'border-green-600/30 bg-green-50'
                    : 'border-amber-600/30 bg-amber-50'
              }`}
            >
              {elegibilidade.proximaFaixa === null ? (
                <p className="text-sm text-mat-700/70">
                  Faixa preta — não há próxima faixa no currículo padrão. Graus podem continuar sendo concedidos.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm text-mat-900">
                      {elegibilidade.apto ? '✓ Apto à graduação' : 'Ainda não apto à graduação'} para faixa{' '}
                      {LABEL_FAIXA[elegibilidade.proximaFaixa]}
                    </h3>
                  </div>
                  <ul className="space-y-1.5 text-xs font-mono">
                    <li className={elegibilidade.tempoOk ? 'text-green-700' : 'text-mat-700/60'}>
                      {elegibilidade.tempoOk ? '✓' : '○'} Tempo na faixa atual: {elegibilidade.mesesNaFaixa.toFixed(1)}{' '}
                      / {elegibilidade.mesesMinimos} meses mínimos
                    </li>
                    <li className={elegibilidade.frequenciaOk ? 'text-green-700' : 'text-mat-700/60'}>
                      {elegibilidade.frequenciaOk ? '✓' : '○'} Frequência: {elegibilidade.frequenciaMedia} aulas/semana
                      (mínimo {elegibilidade.frequenciaMinima}) · {elegibilidade.totalPresencas} presenças desde a
                      última graduação
                    </li>
                    {elegibilidade.idadeMinima != null && (
                      <li className={elegibilidade.idadeOk ? 'text-green-700' : 'text-mat-700/60'}>
                        {elegibilidade.idadeOk ? '✓' : '○'} Idade mínima:{' '}
                        {elegibilidade.idadeAtual != null ? `${elegibilidade.idadeAtual} anos` : 'não informada'} /{' '}
                        {elegibilidade.idadeMinima} anos exigidos
                      </li>
                    )}
                  </ul>
                  <p className="text-[11px] text-mat-700/50 mt-3">
                    A elegibilidade é calculada automaticamente. A decisão final da graduação é sempre do professor.
                  </p>
                </>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => concederGrau(aluno.id)}
                  className="text-xs font-medium border border-mat-700/20 px-3 py-1.5 rounded-sm hover:bg-white transition-colors"
                >
                  + Conceder grau
                </button>
                {elegibilidade.proximaFaixa && (
                  <button
                    onClick={() => promoverFaixa(aluno.id)}
                    disabled={!elegibilidade.apto}
                    className="text-xs font-medium bg-brand-red hover:bg-brand-redDark text-white px-3 py-1.5 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Promover para {LABEL_FAIXA[elegibilidade.proximaFaixa]}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ---------- Cadastrar presença ---------- */}
          <div>
            <h3 className="font-medium text-sm text-mat-900 mb-2">Cadastrar presença</h3>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dataNova}
                onChange={(e) => setDataNova(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none"
              />
              <button
                onClick={handleRegistrarPresenca}
                className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2 rounded-sm transition-colors"
              >
                Registrar
              </button>
            </div>
            {mensagem && <p className="text-xs text-mat-700/60 mt-2">{mensagem}</p>}
          </div>

          {/* ---------- Relatório de presenças ---------- */}
          <div>
            <h3 className="font-medium text-sm text-mat-900 mb-2">
              Relatório de presenças <span className="text-mat-700/50 font-normal">({presencas.length} no total)</span>
            </h3>
            <div className="border border-mat-700/10 rounded-sm max-h-56 overflow-y-auto">
              {presencas.length === 0 ? (
                <p className="text-sm text-mat-700/40 text-center py-8">Nenhuma presença registrada ainda.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {presencas.map((p) => (
                      <tr key={p.id} className="border-b border-mat-700/5 last:border-0">
                        <td className="px-4 py-2 font-mono text-xs text-mat-700/70">
                          {new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-2 text-xs text-mat-700/50 text-right font-mono">{p.hora}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditarAlunoForm({
  aluno,
  onCancelar,
  onSalvo,
}: {
  aluno: Aluno
  onCancelar: () => void
  onSalvo: () => void
}) {
  const { atualizarAluno } = useDemoStore()
  const [nome, setNome] = useState(aluno.nome)
  const [telefone, setTelefone] = useState(aluno.telefone ?? '')
  const [email, setEmail] = useState(aluno.email ?? '')
  const [dataNascimento, setDataNascimento] = useState(aluno.data_nascimento ?? '')
  const [faixa, setFaixa] = useState<FaixaCor>(aluno.faixa_atual)
  const [grau, setGrau] = useState(aluno.grau_atual)
  const [observacoes, setObservacoes] = useState(aluno.observacoes ?? '')

  function salvar() {
    if (!nome.trim()) return
    atualizarAluno(aluno.id, {
      nome,
      telefone,
      email,
      data_nascimento: dataNascimento,
      faixa_atual: faixa,
      grau_atual: grau,
      observacoes,
    })
    onSalvo()
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50 py-8">
      <div className="bg-white rounded-sm w-full max-w-lg max-h-full overflow-y-auto">
        <div className="p-6 border-b border-mat-700/10">
          <h2 className="font-display text-lg text-mat-900">Editar dados do aluno</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">E-mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">
              Data de nascimento
            </label>
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="w-full border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Faixa</label>
              <select
                value={faixa}
                onChange={(e) => setFaixa(e.target.value as FaixaCor)}
                className="w-full border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none bg-white"
              >
                <option value="branca">Branca</option>
                <option value="azul">Azul</option>
                <option value="roxa">Roxa</option>
                <option value="marrom">Marrom</option>
                <option value="preta">Preta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">Grau</label>
              <input
                type="number"
                min={0}
                max={6}
                value={grau}
                onChange={(e) => setGrau(Number(e.target.value))}
                className="w-full border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-mat-700/60 mb-1.5">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full border border-mat-700/20 rounded-sm px-3 py-2 text-sm focus:border-brand-red outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancelar}
              className="flex-1 border border-mat-700/20 text-mat-700 text-sm font-medium py-2.5 rounded-sm hover:bg-gi-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={!nome.trim()}
              className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded-sm transition-colors disabled:opacity-50"
            >
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
