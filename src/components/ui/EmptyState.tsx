import { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-11 h-11 rounded-full bg-bg-subtle flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-content-muted" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-content-primary mb-1">{title}</p>
      {description && <p className="text-sm text-content-muted max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  )
}
