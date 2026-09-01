import { InputHTMLAttributes, forwardRef, SelectHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  erro?: string
  hint?: string
}

const CAMPO_BASE =
  'w-full bg-surface border rounded px-3 py-2 text-sm text-content-primary placeholder:text-content-muted/70 transition-colors outline-none disabled:bg-bg-subtle disabled:text-content-muted disabled:cursor-not-allowed'

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, erro, hint, className = '', id, ...rest }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-content-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`${CAMPO_BASE} ${erro ? 'border-danger focus:border-danger' : 'border-border focus:border-mat-900'} ${className}`}
        {...rest}
      />
      {erro && <p className="text-xs text-danger mt-1">{erro}</p>}
      {!erro && hint && <p className="text-xs text-content-muted mt-1">{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  erro?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, erro, className = '', id, children, ...rest }, ref) => {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-content-secondary mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`${CAMPO_BASE} cursor-pointer ${erro ? 'border-danger' : 'border-border focus:border-mat-900'} ${className}`}
        {...rest}
      >
        {children}
      </select>
      {erro && <p className="text-xs text-danger mt-1">{erro}</p>}
    </div>
  )
})
Select.displayName = 'Select'
