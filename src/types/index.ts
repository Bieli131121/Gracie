export type FaixaCor = 'branca' | 'azul' | 'roxa' | 'marrom' | 'preta'
export type UserRole = 'admin' | 'professor' | 'financeiro' | 'aluno'
export type StatusMensalidade = 'pendente' | 'pago' | 'atrasado' | 'cancelado'

export interface Aluno {
  id: string
  perfil_id: string | null
  nome: string
  cpf: string
  /** null = aluno ainda não fez o primeiro acesso ao portal (não cadastrou senha) */
  senha_acesso: string | null
  email: string | null
  telefone: string | null
  data_nascimento: string | null
  data_matricula: string
  faixa_atual: FaixaCor
  grau_atual: number
  data_ultima_graduacao: string | null
  ativo: boolean
  observacoes: string | null
}

export interface Mensalidade {
  id: string
  aluno_id: string
  plano_id: string | null
  valor: number
  vencimento: string
  pago_em: string | null
  status: StatusMensalidade
  forma_pagamento: string | null
}

export interface Turma {
  id: string
  nome: string
  professor_id: string | null
  dia_semana: number[]
  horario_inicio: string
  horario_fim: string
  capacidade: number | null
  ativa: boolean
}

export interface Presenca {
  id: string
  aluno_id: string
  turma_id: string | null
  data: string
  hora: string
}

export interface Perfil {
  id: string
  nome: string
  role: UserRole
  telefone: string | null
}

// ---------- Usuários e permissões ----------
export type PermissionKey =
  | 'ver_painel'
  | 'gerenciar_alunos'
  | 'fazer_checkin'
  | 'ver_financeiro'
  | 'gerenciar_financeiro'
  | 'gerenciar_usuarios'
  | 'gerenciar_produtos'

export interface Usuario {
  id: string
  nome: string
  email: string
  senha: string
  role: UserRole
  ativo: boolean
}

export type MatrizPermissoes = Record<UserRole, PermissionKey[]>

export const PERMISSOES_LABEL: Record<PermissionKey, string> = {
  ver_painel: 'Ver painel geral',
  gerenciar_alunos: 'Cadastrar e editar alunos',
  fazer_checkin: 'Registrar check-in de aula',
  ver_financeiro: 'Ver mensalidades',
  gerenciar_financeiro: 'Marcar mensalidades como pagas',
  gerenciar_usuarios: 'Gerenciar usuários e permissões',
  gerenciar_produtos: 'Gerenciar produtos e fornecedores',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  financeiro: 'Financeiro',
  aluno: 'Aluno',
}

// ---------- Captação e financeiro gerencial ----------
export type StatusAulaExperimental = 'agendada' | 'compareceu' | 'nao_compareceu' | 'convertido' | 'perdido'

export interface AulaExperimental {
  id: string
  nome: string
  telefone: string
  origem: string // ex: "Instagram", "Indicação", "Google", "Passou na frente"
  data: string
  status: StatusAulaExperimental
}

export interface Despesa {
  id: string
  categoria: string // ex: "Aluguel", "Professores", "Marketing", "Outros"
  descricao: string
  valor: number
  competencia: string // "AAAA-MM" — mês de referência da despesa
}

// ============================================================
// MÓDULO FINANCEIRO EMPRESARIAL
// ============================================================

export type TipoContaFinanceira = 'caixa' | 'banco' | 'conta_corrente' | 'conta_digital' | 'cartao' | 'outra'

export interface ContaFinanceira {
  id: string
  nome: string
  tipo: TipoContaFinanceira
  saldo_inicial_centavos: number
  ativa: boolean
  criado_em: string
}

export type TipoLancamento = 'receita' | 'despesa'

export interface CategoriaFinanceira {
  id: string
  nome: string
  tipo: TipoLancamento
  categoria_pai_id: string | null
  ativa: boolean
}

export interface CentroCusto {
  id: string
  nome: string
  ativo: boolean
}

export type StatusLancamento =
  | 'pendente'
  | 'pago' // usado para despesas
  | 'recebido' // usado para receitas
  | 'parcialmente_pago'
  | 'parcialmente_recebido'
  | 'cancelado'
  | 'vencido' // calculado, não persistido diretamente

export type FrequenciaRecorrencia = 'semanal' | 'mensal' | 'trimestral' | 'anual'

export interface RegraRecorrencia {
  id: string
  tipo: TipoLancamento
  descricao: string
  valor_centavos: number
  categoria_id: string | null
  centro_custo_id: string | null
  conta_financeira_id: string | null
  cliente_fornecedor: string | null
  frequencia: FrequenciaRecorrencia
  data_inicio: string
  data_fim: string | null
  quantidade_ocorrencias: number | null
  ativa: boolean
  ultima_geracao: string | null // AAAA-MM-DD da última competência gerada
}

/** Um lançamento representa uma RECEITA ou DESPESA prevista/lançada.
 *  Importante: lançamento != movimentação realizada (ver Movimentacao).
 *  Registrar um lançamento não move dinheiro em caixa — só o pagamento/
 *  recebimento (via `registrarPagamentoRecebimento`) gera Movimentacao. */
export interface LancamentoFinanceiro {
  id: string
  tipo: TipoLancamento
  descricao: string
  valor_centavos: number // valor original — nunca sobrescrito
  valor_pago_centavos: number // soma do que já foi efetivamente pago/recebido
  data_competencia: string
  data_vencimento: string
  data_pagamento: string | null // data do ÚLTIMO pagamento/recebimento (histórico completo fica em Movimentacao)
  categoria_id: string | null
  centro_custo_id: string | null
  conta_financeira_id: string | null // conta prevista/padrão para o lançamento
  cliente_fornecedor: string | null
  forma_pagamento: string | null
  observacoes: string | null
  numero_documento: string | null
  status: StatusLancamento
  recorrencia_id: string | null
  cancelado_em: string | null
  criado_em: string
}

export type TipoMovimentacao = 'entrada' | 'saida'

/** Movimentação = dinheiro que REALMENTE entrou ou saiu de uma conta financeira.
 *  É o único tipo de registro que altera o saldo calculado de uma conta. */
export interface Movimentacao {
  id: string
  lancamento_id: string | null // null para movimentações avulsas (ex: mensalidade paga direto)
  conta_financeira_id: string
  tipo: TipoMovimentacao
  valor_centavos: number
  data: string
  descricao: string
  estornada: boolean
  estornada_em: string | null
  criado_em: string
}

export interface AjusteSaldoConta {
  id: string
  conta_financeira_id: string
  valor_centavos: number // pode ser positivo ou negativo
  motivo: string
  data: string
  criado_em: string
}

export type OperacaoAuditoria =
  | 'criacao'
  | 'alteracao'
  | 'pagamento'
  | 'recebimento'
  | 'cancelamento'
  | 'estorno'
  | 'ajuste_saldo'
  | 'geracao_recorrencia'

export interface RegistroAuditoria {
  id: string
  data_hora: string
  operacao: OperacaoAuditoria
  entidade: string // ex: "lancamento", "conta_financeira", "movimentacao"
  entidade_id: string
  descricao: string
  usuario_nome: string
}

// ---------- Produtos e fornecedores (loja da academia) ----------
export interface Fornecedor {
  id: string
  nome: string
  categoria: string // ex: "Kimonos", "Suplementos", "Equipamentos"
  contato: string // nome da pessoa de contato
  telefone: string
  email: string
  ativo: boolean
}

export interface Produto {
  id: string
  nome: string
  categoria: string
  fornecedorId: string | null
  precoCusto: number
  precoVenda: number
  estoqueAtual: number
  estoqueMinimo: number
  ativo: boolean
}
