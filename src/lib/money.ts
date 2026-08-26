// ============================================================
// UTILITÁRIOS DE DINHEIRO
// Todo valor financeiro é armazenado e somado em CENTAVOS
// (inteiros), nunca em ponto flutuante, para evitar erros de
// arredondamento (ex: 0.1 + 0.2 !== 0.3 em JS).
// Conversão para reais só acontece na hora de exibir.
// ============================================================

/** Converte um valor em reais (ex: 10.1) para centavos inteiros (1010). */
export function paraCentavos(reais: number): number {
  if (!Number.isFinite(reais)) return 0
  return Math.round(reais * 100)
}

/** Converte centavos inteiros para reais (número), pronto para exibir/somar com outros reais. */
export function paraReais(centavos: number): number {
  return centavos / 100
}

/** Formata centavos como string BRL: "R$ 1.234,56". */
export function formatarCentavos(centavos: number): string {
  return paraReais(centavos).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Formata centavos sem o prefixo "R$", só o número: "1.234,56". */
export function formatarCentavosSemPrefixo(centavos: number): string {
  return paraReais(centavos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

/** Soma segura de uma lista de valores em centavos (inteiros). */
export function somarCentavos(valores: number[]): number {
  return valores.reduce((acc, v) => acc + Math.round(v), 0)
}
