import { useEffect, useState } from 'react'

/**
 * Detecta se o app está sendo acessado numa viewport mobile (< breakpoint).
 * Usa matchMedia (não navigator.userAgent) para reagir em tempo real a
 * redimensionamento de janela, rotação de tela e modo split-screen —
 * o mesmo breakpoint `md` (768px) já usado no Tailwind/Layout.tsx.
 */
export function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(`(max-width: ${breakpointPx - 1}px)`).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpointPx])

  return isMobile
}
