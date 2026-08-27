/** Remove tudo que não for dígito. */
export function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/** Formata progressivamente enquanto o usuário digita: 000.000.000-00 */
export function formatarCpf(valor: string): string {
  const d = normalizarCpf(valor).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function cpfValido(cpf: string): boolean {
  return normalizarCpf(cpf).length === 11
}

/**
 * O Supabase Auth exige um e-mail para login com senha; o aluno só digita CPF.
 * Convertemos o CPF num e-mail sintético só para uso interno do Auth — nunca
 * exibido ao aluno e num domínio que não existe de verdade, então nunca
 * recebe e-mails reais.
 */
export function cpfParaEmailAuth(cpf: string): string {
  return `aluno-${normalizarCpf(cpf)}@portal.gbsistema.internal`
}
