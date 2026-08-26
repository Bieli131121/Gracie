import { FaixaCor } from '../types'

// ============================================================
// REGRAS DE GRADUAÇÃO — baseadas nos critérios adotados pela
// Gracie Barra / IBJJF para faixas adultas.
//
// - mesesMinimos: tempo mínimo que o aluno precisa ter NA FAIXA
//   ATUAL antes de poder ser promovido para a próxima.
// - idadeMinima: idade mínima exigida (IBJJF) para RECEBER a
//   próxima faixa.
// - frequenciaMinimaSemanal: heurística de assiduidade (aulas por
//   semana, em média, desde a última graduação). Não é uma regra
//   oficial da IBJJF — é um parâmetro ajustável aqui para o
//   sistema conseguir usar "quantidade de presença" no cálculo.
//   Ajuste esse número livremente para refletir o que a academia
//   realmente exige.
//
// Importante: cumprir os critérios só indica ELEGIBILIDADE.
// A decisão final da graduação é sempre do professor.
// ============================================================

export const ORDEM_FAIXAS: FaixaCor[] = ['branca', 'azul', 'roxa', 'marrom', 'preta']

export interface CriterioFaixa {
  proximaFaixa: FaixaCor | null
  mesesMinimos: number
  idadeMinima: number | null
  frequenciaMinimaSemanal: number
}

export const CRITERIOS_POR_FAIXA: Record<FaixaCor, CriterioFaixa> = {
  branca: { proximaFaixa: 'azul', mesesMinimos: 12, idadeMinima: 16, frequenciaMinimaSemanal: 2 },
  azul: { proximaFaixa: 'roxa', mesesMinimos: 24, idadeMinima: 16, frequenciaMinimaSemanal: 2 },
  roxa: { proximaFaixa: 'marrom', mesesMinimos: 18, idadeMinima: 18, frequenciaMinimaSemanal: 2 },
  marrom: { proximaFaixa: 'preta', mesesMinimos: 12, idadeMinima: 19, frequenciaMinimaSemanal: 2 },
  preta: { proximaFaixa: null, mesesMinimos: 0, idadeMinima: null, frequenciaMinimaSemanal: 0 },
}

export const GRAU_MAXIMO_POR_FAIXA: Record<FaixaCor, number> = {
  branca: 4,
  azul: 4,
  roxa: 4,
  marrom: 4,
  preta: 6,
}

export function idadeAnos(dataNascimento: string | null, hoje = new Date()): number | null {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const aindaNaoFezAniversario =
    hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())
  if (aindaNaoFezAniversario) idade--
  return idade
}

export function mesesEntre(dataInicio: string, hoje = new Date()): number {
  const inicio = new Date(dataInicio)
  const diffMs = hoje.getTime() - inicio.getTime()
  return diffMs / (1000 * 60 * 60 * 24 * 30.44)
}

export function semanasEntre(dataInicio: string, hoje = new Date()): number {
  const inicio = new Date(dataInicio)
  const diffMs = hoje.getTime() - inicio.getTime()
  return Math.max(1, diffMs / (1000 * 60 * 60 * 24 * 7))
}

export interface Elegibilidade {
  proximaFaixa: FaixaCor | null
  apto: boolean
  tempoOk: boolean
  mesesNaFaixa: number
  mesesMinimos: number
  idadeOk: boolean
  idadeAtual: number | null
  idadeMinima: number | null
  frequenciaOk: boolean
  frequenciaMedia: number
  frequenciaMinima: number
  totalPresencas: number
  dataBase: string
}
