export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded bg-gradient-to-r from-bg-subtle via-border-subtle to-bg-subtle bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  )
}

/** Skeleton pronto para uma linha de tabela — usar enquanto os dados carregam. */
export function SkeletonRow({ colunas = 4 }: { colunas?: number }) {
  return (
    <tr className="border-b border-border-subtle last:border-0">
      {Array.from({ length: colunas }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <Skeleton className="h-4 w-full max-w-[140px]" />
        </td>
      ))}
    </tr>
  )
}
