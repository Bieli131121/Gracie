import { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
      <div>
        <h1 className="text-h1 font-display text-content-primary mb-1">{title}</h1>
        {description && <p className="text-sm text-content-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
