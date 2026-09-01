import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type Tom = 'success' | 'danger' | 'info'
interface ToastItem {
  id: number
  tom: Tom
  mensagem: string
}

const ICONS: Record<Tom, typeof CheckCircle2> = { success: CheckCircle2, danger: XCircle, info: Info }
const CORES: Record<Tom, string> = {
  success: 'text-success',
  danger: 'text-danger',
  info: 'text-info',
}

const ToastContext = createContext<{ show: (tom: Tom, mensagem: string) => void }>({ show: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ToastItem[]>([])

  const show = useCallback((tom: Tom, mensagem: string) => {
    const id = Date.now() + Math.random()
    setItens((prev) => [...prev, { id, tom, mensagem }])
    setTimeout(() => setItens((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const remover = (id: number) => setItens((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none">
        {itens.map((t) => {
          const Icon = ICONS[t.tom]
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-2.5 bg-surface border border-border shadow-modal rounded-md px-4 py-3 max-w-sm animate-slide-up"
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${CORES[t.tom]}`} />
              <p className="text-sm text-content-primary flex-1">{t.mensagem}</p>
              <button onClick={() => remover(t.id)} className="text-content-muted hover:text-content-primary shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

/** Notificação temporária no canto da tela. Usar para confirmar ações (salvo, erro, etc). */
export const useToast = () => useContext(ToastContext)
