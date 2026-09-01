import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card } from './Card'

interface Props {
  label: string
  valor: string
  icon?: LucideIcon
  /** Variação percentual frente ao período anterior. Positivo/negativo definem seta e cor. */
  variacao?: number
  /** Quando a queda é o resultado bom (ex: despesas, inadimplência), inverte as cores da variação. */
  invertido?: boolean
  tom?: 'neutral' | 'success' | 'danger'
  destaque?: boolean
}

const TOM_TEXTO: Record<NonNullable<Props['tom']>, string> = {
  neutral: 'text-content-primary',
  success: 'text-success',
  danger: 'text-danger',
}

/** Indicador principal de dashboard: número grande, label clara, ícone com propósito e comparação de período. */
export function StatCard({ label, valor, icon: Icon, variacao, invertido, tom = 'neutral', destaque }: Props) {
  const subiu = variacao != null && variacao > 0
  const caiu = variacao != null && variacao < 0
  const positivoVisual = invertido ? caiu : subiu

  return (
    <Card className={destaque ? 'bg-mat-900 border-mat-900' : ''}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-caption uppercase font-medium tracking-wide ${destaque ? 'text-white/50' : 'text-content-muted'}`}>
          {label}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded ${destaque ? 'bg-white/10 text-white' : 'bg-bg-subtle text-content-secondary'}`}>
            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
        )}
      </div>
      <div className={`font-mono text-2xl font-medium tracking-tight ${destaque ? 'text-white' : TOM_TEXTO[tom]}`}>
        {valor}
      </div>
      {variacao != null && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positivoVisual ? 'text-success' : 'text-danger'}`}>
          {subiu ? <ArrowUpRight className="w-3.5 h-3.5" /> : caiu ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
          <span>{Math.abs(variacao).toFixed(1)}%</span>
          <span className={destaque ? 'text-white/40' : 'text-content-muted'}>vs. período anterior</span>
        </div>
      )}
    </Card>
  )
}
