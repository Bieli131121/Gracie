import { useState } from 'react'
import { Camera, MapPin, X } from 'lucide-react'
import { Aluno, FaixaCor } from '../types'
import { useDemoStore } from '../lib/demoStore'
import { DEMO_MODE } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { formatarCpf, cpfValido } from '../lib/cpf'
import { Faixa } from '../components/Faixa'
import { Badge } from './ui'

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
  const { presencasDoAluno, registrarPresenca, calcularElegibilidade, concederGrau, promoverFaixa, resetarSenhaAluno } =
    useDemoStore()
  const [dataNova, setDataNova] = useState(new Date().toISOString().slice(0, 10))
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [selfieAberta, setSelfieAberta] = useState<string | null>(null)
  const [carregandoSelfie, setCarregandoSelfie] = useState(false)

  async function verSelfie(fotoUrl: string) {
    if (DEMO_MODE) {
      setSelfieAberta(fotoUrl) // no demo, foto_url já é a data URL da imagem
      return
    }
    setCarregandoSelfie(true)
    const { data } = await supabase.storage.from('checkin-selfies').createSignedUrl(fotoUrl, 60)
    setCarregandoSelfie(false)
    if (data?.signedUrl) setSelfieAberta(data.signedUrl)
  }

  const presencas = presencasDoAluno(aluno.id)
  const elegibilidade = calcularElegibilidade(aluno.id)
  // Em modo demo, "senha_acesso" indica o primeiro acesso; em modo real, o
  // indicador de verdade é ter uma conta do Supabase Auth vinculada (perfil_id).
  const temAcessoPortal = DEMO_MODE ? !!aluno.senha_acesso : !!aluno.perfil_id

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
      <div className="bg-surface rounded w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-content-primary mb-2">{aluno.nome}</h2>
            <Faixa cor={aluno.faixa_atual} grau={aluno.grau_atual} tamanho="md" mostrarLabel />
            <p className="text-xs text-content-muted mt-2 font-mono">
              Matrícula em {new Date(aluno.data_matricula).toLocaleDateString('pt-BR')}
              {aluno.data_ultima_graduacao &&
                ` · Última graduação em ${new Date(aluno.data_ultima_graduacao).toLocaleDateString('pt-BR')}`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setEditando(true)}
              className="text-xs font-medium border border-border px-3 py-1.5 rounded hover:bg-bg-subtle transition-colors"
            >
              Editar dados
            </button>
            <button onClick={onClose} className="text-content-muted hover:text-content-primary text-xl leading-none px-1">
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ---------- Portal do aluno ---------- */}
          <div className="rounded border border-border bg-bg-subtle p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wide text-content-muted mb-1">CPF (login no portal)</p>
              <p className="text-sm text-content-primary">{aluno.cpf || '— não cadastrado —'}</p>
              <p className="text-xs text-content-muted mt-1">
                {temAcessoPortal ? 'Já fez o primeiro acesso ao portal' : 'Aluno ainda não fez o primeiro acesso'}
              </p>
            </div>
            {temAcessoPortal && DEMO_MODE && (
              <button
                onClick={() => {
                  if (confirm('Resetar a senha do portal? O aluno precisará cadastrar uma nova senha no próximo acesso.')) {
                    resetarSenhaAluno(aluno.id)
                  }
                }}
                className="text-xs font-medium border border-border px-3 py-1.5 rounded hover:bg-white transition-colors shrink-0"
              >
                Resetar senha
              </button>
            )}
            {temAcessoPortal && !DEMO_MODE && (
              <p className="text-xs text-content-muted shrink-0 max-w-[160px] text-right">
                Reset de senha fora do modo demo precisa ser feito direto no Supabase.
              </p>
            )}
          </div>

          {/* ---------- Elegibilidade para graduação ---------- */}
          {elegibilidade && (
            <div
              className={`rounded border p-4 ${
                elegibilidade.proximaFaixa === null
                  ? 'border-border bg-bg-subtle'
                  : elegibilidade.apto
                    ? 'border-green-600/30 bg-green-50'
                    : 'border-amber-600/30 bg-amber-50'
              }`}
            >
              {elegibilidade.proximaFaixa === null ? (
                <p className="text-sm text-content-secondary">
                  Faixa preta — não há próxima faixa no currículo padrão. Graus podem continuar sendo concedidos.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm text-content-primary">
                      {elegibilidade.apto ? '✓ Apto à graduação' : 'Ainda não apto à graduação'} para faixa{' '}
                      {LABEL_FAIXA[elegibilidade.proximaFaixa]}
                    </h3>
                  </div>
                  <ul className="space-y-1.5 text-xs font-mono">
                    <li className={elegibilidade.tempoOk ? 'text-green-700' : 'text-content-secondary'}>
                      {elegibilidade.tempoOk ? '✓' : '○'} Tempo na faixa atual: {elegibilidade.mesesNaFaixa.toFixed(1)}{' '}
                      / {elegibilidade.mesesMinimos} meses mínimos
                    </li>
                    <li className={elegibilidade.frequenciaOk ? 'text-green-700' : 'text-content-secondary'}>
                      {elegibilidade.frequenciaOk ? '✓' : '○'} Frequência: {elegibilidade.frequenciaMedia} aulas/semana
                      (mínimo {elegibilidade.frequenciaMinima}) · {elegibilidade.totalPresencas} presenças desde a
                      última graduação
                    </li>
                    {elegibilidade.idadeMinima != null && (
                      <li className={elegibilidade.idadeOk ? 'text-green-700' : 'text-content-secondary'}>
                        {elegibilidade.idadeOk ? '✓' : '○'} Idade mínima:{' '}
                        {elegibilidade.idadeAtual != null ? `${elegibilidade.idadeAtual} anos` : 'não informada'} /{' '}
                        {elegibilidade.idadeMinima} anos exigidos
                      </li>
                    )}
                  </ul>
                  <p className="text-[11px] text-content-muted mt-3">
                    A elegibilidade é calculada automaticamente. A decisão final da graduação é sempre do professor.
                  </p>
                </>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => concederGrau(aluno.id)}
                  className="text-xs font-medium border border-border px-3 py-1.5 rounded hover:bg-white transition-colors"
                >
                  + Conceder grau
                </button>
                {elegibilidade.proximaFaixa && (
                  <button
                    onClick={() => promoverFaixa(aluno.id)}
                    disabled={!elegibilidade.apto}
                    className="text-xs font-medium bg-brand-red hover:bg-brand-redDark text-white px-3 py-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Promover para {LABEL_FAIXA[elegibilidade.proximaFaixa]}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ---------- Cadastrar presença ---------- */}
          <div>
            <h3 className="font-medium text-sm text-content-primary mb-2">Cadastrar presença</h3>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dataNova}
                onChange={(e) => setDataNova(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
              />
              <button
                onClick={handleRegistrarPresenca}
                className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-4 py-2 rounded transition-colors"
              >
                Registrar
              </button>
            </div>
            {mensagem && <p className="text-xs text-content-secondary mt-2">{mensagem}</p>}
          </div>

          {/* ---------- Relatório de presenças ---------- */}
          <div>
            <h3 className="font-medium text-sm text-content-primary mb-2">
              Relatório de presenças <span className="text-content-muted font-normal">({presencas.length} no total)</span>
            </h3>
            <div className="border border-border rounded max-h-56 overflow-y-auto">
              {presencas.length === 0 ? (
                <p className="text-sm text-content-muted text-center py-8">Nenhuma presença registrada ainda.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {presencas.map((p) => (
                      <tr key={p.id} className="border-b border-border-subtle last:border-0">
                        <td className="px-4 py-2 font-mono text-xs text-content-secondary">
                          {new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-2 text-xs text-content-muted font-mono">{p.hora}</td>
                        <td className="px-4 py-2">
                          {p.origem === 'auto' ? (
                            <Badge tom="info">App</Badge>
                          ) : (
                            <span className="text-xs text-content-muted">Equipe</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-content-muted">
                          {p.distancia_metros != null && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {p.distancia_metros}m
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {p.foto_url && (
                            <button
                              onClick={() => verSelfie(p.foto_url!)}
                              disabled={carregandoSelfie}
                              className="text-content-muted hover:text-brand-red disabled:opacity-40"
                              aria-label="Ver selfie do check-in"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {selfieAberta && (
        <div
          className="fixed inset-0 bg-mat-950/80 z-[60] flex items-center justify-center px-4"
          onClick={() => setSelfieAberta(null)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelfieAberta(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white"
              aria-label="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={selfieAberta} alt="Selfie do check-in" className="w-full rounded-lg" />
          </div>
        </div>
      )}
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
  const [cpf, setCpf] = useState(aluno.cpf)
  const [telefone, setTelefone] = useState(aluno.telefone ?? '')
  const [email, setEmail] = useState(aluno.email ?? '')
  const [dataNascimento, setDataNascimento] = useState(aluno.data_nascimento ?? '')
  const [faixa, setFaixa] = useState<FaixaCor>(aluno.faixa_atual)
  const [grau, setGrau] = useState(aluno.grau_atual)
  const [observacoes, setObservacoes] = useState(aluno.observacoes ?? '')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!nome.trim() || !cpfValido(cpf)) return
    setErro(null)
    setSalvando(true)
    const resultado = await atualizarAluno(aluno.id, {
      nome,
      cpf,
      telefone,
      email,
      data_nascimento: dataNascimento,
      faixa_atual: faixa,
      grau_atual: grau,
      observacoes,
    })
    setSalvando(false)
    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível salvar as alterações.')
      return
    }
    onSalvo()
  }

  return (
    <div className="fixed inset-0 bg-mat-900/60 flex items-center justify-center px-4 z-50 py-8">
      <div className="bg-surface rounded w-full max-w-lg max-h-full overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h2 className="font-display text-lg text-content-primary">Editar dados do aluno</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">CPF</label>
            <input
              value={cpf}
              onChange={(e) => setCpf(formatarCpf(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
            />
            <p className="text-xs text-content-muted mt-1">Usado pelo aluno para entrar no portal</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">E-mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
              Data de nascimento
            </label>
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Faixa</label>
              <select
                value={faixa}
                onChange={(e) => setFaixa(e.target.value as FaixaCor)}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none bg-surface"
              >
                <option value="branca">Branca</option>
                <option value="azul">Azul</option>
                <option value="roxa">Roxa</option>
                <option value="marrom">Marrom</option>
                <option value="preta">Preta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">Grau</label>
              <input
                type="number"
                min={0}
                max={6}
                value={grau}
                onChange={(e) => setGrau(Number(e.target.value))}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-content-secondary mb-1.5">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:border-mat-900 outline-none resize-none"
            />
          </div>

          {erro && <p className="text-xs text-danger">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancelar}
              className="flex-1 border border-border text-content-secondary text-sm font-medium py-2.5 rounded hover:bg-bg-subtle transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={!nome.trim() || !cpfValido(cpf) || salvando}
              className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
