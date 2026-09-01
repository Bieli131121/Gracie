import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-mat-900 text-white hover:bg-mat-800 active:bg-black disabled:bg-mat-900/40',
  secondary:
    'bg-surface text-content-primary border border-border hover:border-border-strong hover:bg-bg-subtle disabled:opacity-40',
  ghost: 'bg-transparent text-content-secondary hover:bg-bg-subtle hover:text-content-primary disabled:opacity-40',
  danger: 'bg-danger text-white hover:brightness-110 disabled:opacity-40',
  success: 'bg-success text-white hover:brightness-110 disabled:opacity-40',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
}

/**
 * Botão padrão do sistema. Usar sempre em vez de <button> cru com classes
 * coladas — é o que garante que todo botão do app tenha a mesma altura,
 * peso de fonte, estado de foco e comportamento de loading/disabled.
 */
export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded transition-colors duration-150
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mat-900
        disabled:cursor-not-allowed
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
