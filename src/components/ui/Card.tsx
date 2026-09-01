import { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md'
}

/** Superfície padrão para agrupar conteúdo. Elevação vem de sombra sutil + borda fina, não de peso visual. */
export function Card({ padding = 'md', className = '', children, ...rest }: Props) {
  const paddingClass = padding === 'none' ? '' : padding === 'sm' ? 'p-4' : 'p-5'
  return (
    <div
      className={`bg-surface rounded-md border border-border shadow-xs ${paddingClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
