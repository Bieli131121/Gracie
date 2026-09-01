type Tom = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TOM_CLASSES: Record<Tom, string> = {
  neutral: 'bg-bg-subtle text-content-secondary',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
}

/** Selo de status curto — usar para status de pagamento, ativo/inativo, etc. Nunca para texto longo. */
export function Badge({ tom = 'neutral', children }: { tom?: Tom; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${TOM_CLASSES[tom]}`}>
      {children}
    </span>
  )
}
