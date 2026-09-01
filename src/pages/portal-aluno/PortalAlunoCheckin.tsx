import { useEffect, useRef, useState } from 'react'
import { MapPin, Camera, RotateCcw, Check, X, Loader2, AlertTriangle } from 'lucide-react'
import { useAlunoAuth } from '../../lib/alunoAuth'
import { useDemoStore } from '../../lib/demoStore'
import { validarLocalizacao, RAIO_PERMITIDO_METROS } from '../../lib/localizacaoAcademia'

type Etapa = 'localizando' | 'erro_localizacao' | 'camera' | 'revisando' | 'enviando' | 'sucesso' | 'erro_envio'

export function PortalAlunoCheckin({ onClose, onSucesso }: { onClose: () => void; onSucesso: () => void }) {
  const { aluno } = useAlunoAuth()
  const { autoCheckinAluno } = useDemoStore()

  const [etapa, setEtapa] = useState<Etapa>('localizando')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [distanciaEstimativa, setDistanciaEstimativa] = useState<number | null>(null)
  const [foto, setFoto] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [distanciaFinal, setDistanciaFinal] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // ---------- Passo 1: geolocalização ----------
  function obterLocalizacao() {
    setEtapa('localizando')
    setErro(null)
    if (!navigator.geolocation) {
      setErro('Seu navegador não tem suporte a geolocalização.')
      setEtapa('erro_localizacao')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        const { distancia } = validarLocalizacao(lat, lng)
        setDistanciaEstimativa(distancia)
        setEtapa('camera')
      },
      (err) => {
        setErro(
          err.code === err.PERMISSION_DENIED
            ? 'Você precisa permitir o acesso à localização pra fazer o check-in.'
            : 'Não foi possível obter sua localização. Verifique o GPS e tente de novo.'
        )
        setEtapa('erro_localizacao')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    obterLocalizacao()
    return () => pararCamera()
  }, [])

  // ---------- Passo 2: câmera ----------
  useEffect(() => {
    if (etapa !== 'camera') return
    let ativo = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (!ativo) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {
        if (ativo) {
          setErro('Não foi possível acessar a câmera. Verifique a permissão do navegador.')
          setEtapa('erro_localizacao')
        }
      })
    return () => {
      ativo = false
    }
  }, [etapa])

  function pararCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function capturarFoto() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Espelha horizontalmente pra ficar como o aluno se vê no vídeo (efeito "espelho" natural de selfie).
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setFoto(canvas.toDataURL('image/jpeg', 0.8))
    pararCamera()
    setEtapa('revisando')
  }

  function tirarOutra() {
    setFoto(null)
    setEtapa('camera')
  }

  async function confirmar() {
    if (!aluno || !foto || !coords) return
    setEtapa('enviando')
    const resultado = await autoCheckinAluno(aluno.id, { fotoDataUrl: foto, latitude: coords.lat, longitude: coords.lng })
    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível confirmar sua presença.')
      setEtapa('erro_envio')
      return
    }
    setDistanciaFinal(resultado.distancia ?? distanciaEstimativa)
    setEtapa('sucesso')
    setTimeout(onSucesso, 1800)
  }

  return (
    <div className="fixed inset-0 bg-mat-950 z-50 flex flex-col text-white">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-sm font-medium">Check-in</span>
        <button onClick={onClose} aria-label="Fechar" className="p-1 text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {etapa === 'localizando' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-white/70" />
            <p className="text-sm text-white/70">Obtendo sua localização...</p>
          </>
        )}

        {etapa === 'erro_localizacao' && (
          <>
            <AlertTriangle className="w-9 h-9 mb-4 text-brand-red" />
            <p className="text-sm text-white/80 mb-6 max-w-xs">{erro}</p>
            <button
              onClick={obterLocalizacao}
              className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-5 py-2.5 rounded transition-colors"
            >
              Tentar de novo
            </button>
          </>
        )}

        {etapa === 'camera' && (
          <div className="w-full max-w-sm">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[3/4] mb-5">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
              {coords && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 rounded-full px-3 py-1 text-xs">
                  <MapPin className="w-3 h-3" />
                  {distanciaEstimativa != null && distanciaEstimativa <= RAIO_PERMITIDO_METROS
                    ? 'Você está na academia'
                    : `${distanciaEstimativa}m da academia`}
                </div>
              )}
            </div>
            <button
              onClick={capturarFoto}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto"
              aria-label="Tirar foto"
            >
              <Camera className="w-7 h-7 text-mat-900" />
            </button>
            <p className="text-xs text-white/50 mt-4">Tire uma selfie pra confirmar sua presença</p>
          </div>
        )}

        {etapa === 'revisando' && foto && (
          <div className="w-full max-w-sm">
            <img src={foto} alt="Selfie capturada" className="w-full rounded-lg mb-5 aspect-[3/4] object-cover" />
            <div className="flex gap-3">
              <button
                onClick={tirarOutra}
                className="flex-1 border border-white/20 text-white text-sm font-medium py-2.5 rounded flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Tirar outra
              </button>
              <button
                onClick={confirmar}
                className="flex-1 bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium py-2.5 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" /> Confirmar
              </button>
            </div>
          </div>
        )}

        {etapa === 'enviando' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-white/70" />
            <p className="text-sm text-white/70">Confirmando presença...</p>
          </>
        )}

        {etapa === 'erro_envio' && (
          <>
            <AlertTriangle className="w-9 h-9 mb-4 text-brand-red" />
            <p className="text-sm text-white/80 mb-6 max-w-xs">{erro}</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="border border-white/20 text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-white/5 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => setEtapa('camera')}
                className="bg-brand-red hover:bg-brand-redDark text-white text-sm font-medium px-5 py-2.5 rounded transition-colors"
              >
                Tentar de novo
              </button>
            </div>
          </>
        )}

        {etapa === 'sucesso' && (
          <>
            <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-success" />
            </div>
            <p className="text-base font-medium mb-1">Presença confirmada!</p>
            {distanciaFinal != null && <p className="text-xs text-white/50">Você estava a {distanciaFinal}m da academia</p>}
          </>
        )}
      </div>
    </div>
  )
}
