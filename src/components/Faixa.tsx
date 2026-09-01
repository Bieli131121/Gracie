import { FaixaCor } from '../types'

const CORES: Record<FaixaCor, { bg: string; ponteira: string; label: string }> = {
  branca: { bg: '#F5F3EE', ponteira: '#17171A', label: 'Branca' },
  azul: { bg: '#1E5FA8', ponteira: '#17171A', label: 'Azul' },
  roxa: { bg: '#6B3FA0', ponteira: '#17171A', label: 'Roxa' },
  marrom: { bg: '#6B4423', ponteira: '#17171A', label: 'Marrom' },
  preta: { bg: '#17171A', ponteira: '#A32020', label: 'Preta' },
}

interface FaixaProps {
  cor: FaixaCor
  grau?: number
  tamanho?: 'sm' | 'md' | 'lg'
  mostrarLabel?: boolean
}

/**
 * Renderiza uma faixa de jiu-jitsu em miniatura: barra colorida + ponteira
 * (preta, ou vermelha para faixa preta) + graus marcados como listras brancas.
 * É o elemento visual usado em toda a interface para status do aluno.
 */
export function Faixa({ cor, grau = 0, tamanho = 'md', mostrarLabel = false }: FaixaProps) {
  const c = CORES[cor]
  const dims = {
    sm: { w: 64, h: 12, ponteira: 16 },
    md: { w: 96, h: 16, ponteira: 22 },
    lg: { w: 140, h: 22, ponteira: 30 },
  }[tamanho]

  const bordaClara = cor === 'branca'

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="relative flex items-center rounded overflow-hidden"
        style={{
          width: dims.w,
          height: dims.h,
          background: c.bg,
          border: bordaClara ? '1px solid #D8D4C8' : 'none',
        }}
      >
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center gap-[2px]"
          style={{ width: dims.ponteira, background: c.ponteira }}
        >
          {Array.from({ length: Math.min(grau, 4) }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 1.5,
                height: dims.h * 0.55,
                background: '#F5F3EE',
              }}
            />
          ))}
        </div>
      </div>
      {mostrarLabel && (
        <span className="font-mono text-xs text-mat-800">
          {c.label}
          {grau > 0 ? ` · ${grau}º grau` : ''}
        </span>
      )}
    </div>
  )
}
