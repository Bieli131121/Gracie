import { createContext, useContext, useState, ReactNode } from 'react'
import { normalizarCpf } from './cpf'
import {
  Aluno,
  Mensalidade,
  StatusMensalidade,
  FaixaCor,
  Usuario,
  UserRole,
  PermissionKey,
  MatrizPermissoes,
  Presenca,
  AulaExperimental,
  StatusAulaExperimental,
  Despesa,
  Fornecedor,
  Produto,
  ContaFinanceira,
  TipoContaFinanceira,
  CategoriaFinanceira,
  CentroCusto,
  LancamentoFinanceiro,
  TipoLancamento,
  StatusLancamento,
  Movimentacao,
  AjusteSaldoConta,
  RegraRecorrencia,
  FrequenciaRecorrencia,
  RegistroAuditoria,
  OperacaoAuditoria,
} from '../types'
import {
  CRITERIOS_POR_FAIXA,
  GRAU_MAXIMO_POR_FAIXA,
  ORDEM_FAIXAS,
  Elegibilidade,
  idadeAnos,
  mesesEntre,
  semanasEntre,
} from './criteriosGraduacao'
import { paraCentavos } from './money'

// ============================================================
// MODO DEMO — dados fictícios em memória, para demonstração
// sem depender de um projeto Supabase configurado.
// Quando a academia estiver pronta para usar de verdade, troque
// DEMO_MODE para false em src/lib/auth.tsx e ligue o Supabase.
// ============================================================

export const DEMO_ADMIN_EMAIL = 'admin@graciebarra.com.br'
export const DEMO_ADMIN_SENHA = 'graciebarra2026'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ---------- Usuários iniciais ----------
const USUARIOS_INICIAIS: Usuario[] = [
  { id: 'demo-admin', nome: 'Instrutor Demo', email: DEMO_ADMIN_EMAIL, senha: DEMO_ADMIN_SENHA, role: 'admin', ativo: true },
  { id: uid(), nome: 'Rafael Souza', email: 'rafael@graciebarra.com.br', senha: 'professor2026', role: 'professor', ativo: true },
  { id: uid(), nome: 'Patrícia Nogueira', email: 'financeiro@graciebarra.com.br', senha: 'financeiro2026', role: 'financeiro', ativo: true },
]

// ---------- Permissões padrão por papel ----------
const PERMISSOES_INICIAIS: MatrizPermissoes = {
  admin: [
    'ver_painel',
    'gerenciar_alunos',
    'fazer_checkin',
    'ver_financeiro',
    'gerenciar_financeiro',
    'gerenciar_usuarios',
    'gerenciar_produtos',
  ],
  professor: ['ver_painel', 'gerenciar_alunos', 'fazer_checkin'],
  financeiro: ['ver_painel', 'ver_financeiro', 'gerenciar_financeiro', 'gerenciar_produtos'],
  aluno: [],
}

// ---------- Alunos ----------
let contadorCpfDemo = 0
/** Gera um CPF fictício só para preencher os dados de demonstração (não é um CPF válido de verdade). */
function cpfDemo(): string {
  contadorCpfDemo += 1
  const n = String(100000000 + contadorCpfDemo).padStart(9, '0')
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-00`
}

function alunoDemo(
  nome: string,
  faixa: FaixaCor,
  grau: number,
  telefone: string,
  diasMatricula: number,
  senhaAcesso: string | null = null
): Aluno {
  const d = new Date()
  d.setDate(d.getDate() - diasMatricula)
  return {
    id: uid(),
    perfil_id: null,
    nome,
    cpf: cpfDemo(),
    senha_acesso: senhaAcesso,
    email: null,
    telefone,
    data_nascimento: null,
    data_matricula: d.toISOString().slice(0, 10),
    faixa_atual: faixa,
    grau_atual: grau,
    data_ultima_graduacao: null,
    ativo: true,
    observacoes: null,
  }
}

const ALUNOS_INICIAIS: Aluno[] = [
  // Este já tem senha cadastrada — serve pra testar o login direto no portal do aluno.
  alunoDemo('Rafael Souza', 'roxa', 2, '(48) 99911-2233', 900, 'rafael123'),
  alunoDemo('Camila Ferreira', 'azul', 3, '(48) 99822-4455', 620),
  alunoDemo('Bruno Alves', 'branca', 1, '(48) 99733-5566', 90),
  alunoDemo('Larissa Dias', 'marrom', 1, '(48) 99644-6677', 1500),
  alunoDemo('Diego Martins', 'azul', 0, '(48) 99555-7788', 400),
  alunoDemo('Fernanda Lopes', 'branca', 0, '(48) 99466-8899', 30),
  alunoDemo('Thiago Ramos', 'preta', 1, '(48) 99377-9900', 2600),
  alunoDemo('Juliana Castro', 'roxa', 0, '(48) 99288-0011', 800),
]

// ---------- Alunos de captação recente (últimos 6 meses) ----------
// Existem só para dar volume realista ao gráfico de captação/faturamento
// do painel gerencial. Nomes fictícios, matrícula distribuída mês a mês.
const NOMES_CAPTACAO = [
  'Eduardo Nunes', 'Beatriz Correia', 'Vinícius Prado', 'Ana Beatriz Melo',
  'Gustavo Lima', 'Marina Rocha', 'Felipe Barros', 'Sofia Andrade',
  'Lucas Tavares', 'Isabela Nogueira', 'Matheus Cardoso', 'Yasmin Duarte',
  'Pedro Henrique Vaz', 'Carolina Freitas', 'Renato Xavier', 'Bianca Moraes',
  'André Luiz Sales', 'Letícia Farias',
]

function telefoneAleatorio() {
  const parte = 90000 + Math.floor(Math.random() * 9999)
  return `(48) 9${parte}-${1000 + Math.floor(Math.random() * 8999)}`
}

function gerarAlunosCaptacao(): Aluno[] {
  const resultado: Aluno[] = []
  let cursor = 0
  for (let mesAtras = 5; mesAtras >= 0; mesAtras--) {
    const qtd = 2 + Math.floor(Math.random() * 3) // 2 a 4 novos alunos por mês
    for (let i = 0; i < qtd && cursor < NOMES_CAPTACAO.length; i++, cursor++) {
      const dias = mesAtras * 30 + Math.floor(Math.random() * 27)
      resultado.push(alunoDemo(NOMES_CAPTACAO[cursor], 'branca', 0, telefoneAleatorio(), dias))
    }
  }
  return resultado
}

ALUNOS_INICIAIS.push(...gerarAlunosCaptacao())

// Data de nascimento fictícia para permitir testar a regra de idade mínima
const NASCIMENTOS: Record<string, string> = {
  'Rafael Souza': '1994-03-12',
  'Camila Ferreira': '1998-07-22',
  'Bruno Alves': '2010-05-01', // menor de idade — não pode ir além de faixa branca ainda
  'Larissa Dias': '1990-11-08',
  'Diego Martins': '2001-02-17',
  'Fernanda Lopes': '2006-09-30',
  'Thiago Ramos': '1985-01-15',
  'Juliana Castro': '1996-06-04',
}

// Frequência semanal média simulada de cada aluno (para gerar histórico
// de presenças realista e testar alunos aptos e não aptos)
const FREQUENCIA_SIMULADA: Record<string, number> = {
  'Rafael Souza': 3,
  'Camila Ferreira': 2.5,
  'Bruno Alves': 2,
  'Larissa Dias': 1, // frequência baixa -> não apto mesmo com tempo suficiente
  'Diego Martins': 2.2,
  'Fernanda Lopes': 3,
  'Thiago Ramos': 2,
  'Juliana Castro': 1.5, // tempo suficiente mas frequência abaixo do mínimo
}

function uidPresenca() {
  return 'p_' + Math.random().toString(36).slice(2, 10)
}

// Gera um histórico de presenças plausível entre `dataInicio` e hoje,
// simulando `aulasPorSemana` aulas por semana (com pequena variação aleatória).
function gerarPresencasHistoricas(alunoId: string, dataInicio: string, aulasPorSemana: number): Presenca[] {
  const presencas: Presenca[] = []
  const inicio = new Date(dataInicio)
  const hoje = new Date()
  const cursor = new Date(inicio)

  while (cursor < hoje) {
    const fimSemana = new Date(cursor)
    fimSemana.setDate(fimSemana.getDate() + 7)

    const variacao = Math.random() < 0.5 ? -1 : 0
    const aulasNaSemana = Math.max(0, Math.round(aulasPorSemana) + variacao)

    const diasUsados = new Set<number>()
    for (let i = 0; i < aulasNaSemana; i++) {
      let diaOffset = Math.floor(Math.random() * 7)
      let tentativas = 0
      while (diasUsados.has(diaOffset) && tentativas < 7) {
        diaOffset = Math.floor(Math.random() * 7)
        tentativas++
      }
      diasUsados.add(diaOffset)

      const dataAula = new Date(cursor)
      dataAula.setDate(dataAula.getDate() + diaOffset)
      if (dataAula >= hoje || dataAula < inicio) continue

      presencas.push({
        id: uidPresenca(),
        aluno_id: alunoId,
        turma_id: null,
        data: dataAula.toISOString().slice(0, 10),
        hora: '19:00',
      })
    }

    cursor.setTime(fimSemana.getTime())
  }

  return presencas
}

function gerarPresencasIniciais(alunos: Aluno[]): Presenca[] {
  return alunos.flatMap((a) => {
    const dataBase = a.data_ultima_graduacao ?? a.data_matricula
    const freq = FREQUENCIA_SIMULADA[a.nome] ?? 2
    return gerarPresencasHistoricas(a.id, dataBase, freq)
  })
}

// Aplica as datas de nascimento fictícias aos alunos iniciais
ALUNOS_INICIAIS.forEach((a) => {
  a.data_nascimento = NASCIMENTOS[a.nome] ?? null
})

function mensalidadeDemo(alunoId: string, valor: number, diasVencimento: number, status: StatusMensalidade): Mensalidade {
  const d = new Date()
  d.setDate(d.getDate() + diasVencimento)
  return {
    id: uid(),
    aluno_id: alunoId,
    plano_id: null,
    valor,
    vencimento: d.toISOString().slice(0, 10),
    pago_em: status === 'pago' ? new Date().toISOString().slice(0, 10) : null,
    status,
    forma_pagamento: status === 'pago' ? 'pix' : null,
  }
}

function gerarMensalidadesIniciais(alunos: Aluno[]): Mensalidade[] {
  const status: StatusMensalidade[] = ['pago', 'pago', 'pendente', 'atrasado', 'pago', 'pendente', 'pago', 'atrasado']
  const dias = [-20, -15, 5, -3, -10, 10, -18, -7]
  return alunos.map((a, i) => mensalidadeDemo(a.id, 180, dias[i % dias.length], status[i % status.length]))
}

// ---------- Aulas experimentais (funil de captação) ----------
const ORIGENS = ['Instagram', 'Indicação', 'Google', 'Passou na frente', 'Facebook']
const NOMES_LEADS = [
  'Otávio Ramalho', 'Débora Sanches', 'Caio Bezerra', 'Priscila Amaral', 'Rodrigo Peixoto',
  'Natália Borges', 'Henrique Godoy', 'Vanessa Teles', 'Marcelo Aguiar', 'Talita Siqueira',
  'Bruno Cavalcante', 'Amanda Reis', 'Gabriel Monteiro', 'Larissa Brandão', 'Diego Farias',
  'Patrícia Guedes', 'Leonardo Assis', 'Camila Prado', 'Fábio Nascimento', 'Renata Cunha',
  'Igor Salles', 'Michele Torres', 'Vitor Hugo Lacerda', 'Sabrina Coelho',
]

function uidLead() {
  return 'lead_' + Math.random().toString(36).slice(2, 10)
}

function gerarAulasExperimentais(): AulaExperimental[] {
  return NOMES_LEADS.map((nome, i) => {
    const diasAtras = Math.floor(Math.random() * 60)
    const d = new Date()
    d.setDate(d.getDate() - diasAtras)

    let status: StatusAulaExperimental
    if (diasAtras < 3) {
      status = 'agendada'
    } else {
      const roll = Math.random()
      if (roll < 0.15) status = 'nao_compareceu'
      else if (roll < 0.55) status = 'convertido'
      else if (roll < 0.8) status = 'compareceu'
      else status = 'perdido'
    }

    return {
      id: uidLead(),
      nome,
      telefone: telefoneAleatorio(),
      origem: ORIGENS[i % ORIGENS.length],
      data: d.toISOString().slice(0, 10),
      status,
    }
  })
}

// ---------- Despesas fixas mensais (para cálculo de lucro) ----------
const CATEGORIAS_DESPESA: { categoria: string; descricao: string; valor: number }[] = [
  { categoria: 'Aluguel', descricao: 'Aluguel do espaço', valor: 3800 },
  { categoria: 'Professores', descricao: 'Pró-labore de instrutores', valor: 4200 },
  { categoria: 'Marketing', descricao: 'Anúncios e redes sociais', valor: 450 },
  { categoria: 'Outros', descricao: 'Água, luz, limpeza, manutenção', valor: 780 },
]

function ultimosMeses(qtd: number): string[] {
  const meses: string[] = []
  const cursor = new Date()
  cursor.setDate(1)
  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() - i)
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return meses
}

function fimDoMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  const ultimoDia = new Date(ano, m, 0).getDate()
  return `${mes}-${String(ultimoDia).padStart(2, '0')}`
}

function labelMesCurto(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${nomes[m - 1]}/${String(ano).slice(2)}`
}

function gerarDespesasIniciais(): Despesa[] {
  const meses = ultimosMeses(6)
  const despesas: Despesa[] = []
  meses.forEach((mes) => {
    CATEGORIAS_DESPESA.forEach((c) => {
      const variacao = 1 + (Math.random() * 0.1 - 0.05)
      despesas.push({
        id: uid(),
        categoria: c.categoria,
        descricao: c.descricao,
        valor: Math.round(c.valor * variacao),
        competencia: mes,
      })
    })
  })
  return despesas
}

interface PontoFinanceiroMensal {
  mes: string
  mesLabel: string
  faturamento: number
  despesas: number
  lucro: number
  novosAlunos: number
}

function gerarHistoricoFinanceiro(alunos: Aluno[], despesas: Despesa[]): PontoFinanceiroMensal[] {
  const meses = ultimosMeses(6)
  const ticketMedio = 180
  const taxaInadimplenciaBase = 0.1

  return meses.map((mes) => {
    const fimMes = fimDoMes(mes)
    const inicioMes = `${mes}-01`
    const ativosAteFim = alunos.filter((a) => a.data_matricula <= fimMes).length
    const novosAlunos = alunos.filter((a) => a.data_matricula >= inicioMes && a.data_matricula <= fimMes).length

    const ruido = 0.92 + Math.random() * 0.16
    const faturamento = Math.round(ativosAteFim * ticketMedio * (1 - taxaInadimplenciaBase) * ruido)
    const despesasDoMes = despesas.filter((d) => d.competencia === mes).reduce((acc, d) => acc + d.valor, 0)

    return {
      mes,
      mesLabel: labelMesCurto(mes),
      faturamento,
      despesas: despesasDoMes,
      lucro: faturamento - despesasDoMes,
      novosAlunos,
    }
  })
}

// ---------- Fornecedores e produtos (loja da academia) ----------
const FORNECEDORES_INICIAIS: Fornecedor[] = [
  {
    id: uid(),
    nome: 'Gracie Barra Store',
    categoria: 'Kimonos e faixas',
    contato: 'Central de vendas',
    telefone: '(11) 4000-1200',
    email: 'atacado@graciebarrastore.com.br',
    ativo: true,
  },
  {
    id: uid(),
    nome: 'Nutrahigh Suplementos',
    categoria: 'Suplementos',
    contato: 'Marcelo Tanaka',
    telefone: '(48) 3222-4455',
    email: 'vendas@nutrahigh.com.br',
    ativo: true,
  },
  {
    id: uid(),
    nome: 'Fight Gear Equipamentos',
    categoria: 'Equipamentos e proteção',
    contato: 'Cláudia Menezes',
    telefone: '(47) 3311-9090',
    email: 'comercial@fightgear.com.br',
    ativo: true,
  },
  {
    id: uid(),
    nome: 'Faixa Preta Distribuidora',
    categoria: 'Acessórios',
    contato: 'João Pedro Lins',
    telefone: '(48) 99988-7766',
    email: 'joao@faixapretadist.com.br',
    ativo: true,
  },
]

function produtoDemo(
  nome: string,
  categoria: string,
  fornecedorNome: string,
  precoCusto: number,
  precoVenda: number,
  estoqueAtual: number,
  estoqueMinimo: number
): Produto {
  const fornecedor = FORNECEDORES_INICIAIS.find((f) => f.nome === fornecedorNome)
  return {
    id: uid(),
    nome,
    categoria,
    fornecedorId: fornecedor?.id ?? null,
    precoCusto,
    precoVenda,
    estoqueAtual,
    estoqueMinimo,
    ativo: true,
  }
}

const PRODUTOS_INICIAIS: Produto[] = [
  produtoDemo('Kimono Gracie Barra Adulto A2', 'Kimonos', 'Gracie Barra Store', 280, 480, 6, 3),
  produtoDemo('Kimono Gracie Barra Infantil M2', 'Kimonos', 'Gracie Barra Store', 190, 340, 2, 3),
  produtoDemo('Faixa Branca', 'Faixas', 'Gracie Barra Store', 25, 60, 14, 5),
  produtoDemo('Faixa Azul', 'Faixas', 'Gracie Barra Store', 30, 70, 5, 4),
  produtoDemo('Faixa Roxa', 'Faixas', 'Gracie Barra Store', 30, 70, 3, 3),
  produtoDemo('Rash Guard Manga Longa', 'Vestuário', 'Fight Gear Equipamentos', 65, 130, 8, 4),
  produtoDemo('Protetor Bucal Moldável', 'Proteção', 'Fight Gear Equipamentos', 15, 45, 12, 6),
  produtoDemo('Luva de MMA', 'Proteção', 'Fight Gear Equipamentos', 45, 95, 1, 3),
  produtoDemo('Whey Protein 900g', 'Suplementos', 'Nutrahigh Suplementos', 70, 140, 9, 5),
  produtoDemo('Creatina 300g', 'Suplementos', 'Nutrahigh Suplementos', 45, 90, 7, 5),
  produtoDemo('Garrafa Térmica Gracie Barra', 'Acessórios', 'Faixa Preta Distribuidora', 20, 50, 4, 5),
  produtoDemo('Mochila Gracie Barra', 'Acessórios', 'Faixa Preta Distribuidora', 90, 180, 2, 3),
]

// ============================================================
// MÓDULO FINANCEIRO — dados iniciais e regras de negócio
// ============================================================

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function agoraISO(): string {
  return new Date().toISOString()
}

function uidFin(prefixo: string) {
  return `${prefixo}_${Math.random().toString(36).slice(2, 10)}`
}

function somarDiasISO(dataISO: string, dias: number): string {
  const d = new Date(dataISO + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

function somarMesesISO(dataISO: string, meses: number): string {
  const d = new Date(dataISO + 'T00:00:00')
  d.setMonth(d.getMonth() + meses)
  return d.toISOString().slice(0, 10)
}

// ---------- Conta financeira padrão ----------
const CONTA_PRINCIPAL_ID = uidFin('conta')

const CONTAS_FINANCEIRAS_INICIAIS: ContaFinanceira[] = [
  {
    id: CONTA_PRINCIPAL_ID,
    nome: 'Caixa Principal',
    tipo: 'conta_corrente',
    saldo_inicial_centavos: paraCentavos(5000),
    ativa: true,
    criado_em: agoraISO(),
  },
  {
    id: uidFin('conta'),
    nome: 'Dinheiro em espécie',
    tipo: 'caixa',
    saldo_inicial_centavos: paraCentavos(300),
    ativa: true,
    criado_em: agoraISO(),
  },
]

// ---------- Categorias financeiras ----------
function categoriaFin(nome: string, tipo: TipoLancamento): CategoriaFinanceira {
  return { id: uidFin('cat'), nome, tipo, categoria_pai_id: null, ativa: true }
}

const CATEGORIAS_DESPESA_NOMES = [
  'Aluguel',
  'Professores',
  'Marketing',
  'Funcionários',
  'Fornecedores',
  'Infraestrutura',
  'Impostos',
  'Veículos',
  'Tecnologia',
  'Administrativo',
  'Outros',
]
const CATEGORIAS_RECEITA_NOMES = ['Mensalidades', 'Produtos/Loja', 'Aulas experimentais', 'Contratos', 'Outros']

const CATEGORIAS_FINANCEIRAS_INICIAIS: CategoriaFinanceira[] = [
  ...CATEGORIAS_DESPESA_NOMES.map((n) => categoriaFin(n, 'despesa')),
  ...CATEGORIAS_RECEITA_NOMES.map((n) => categoriaFin(n, 'receita')),
]

function categoriaDespesaIdPorNome(nome: string): string | null {
  return CATEGORIAS_FINANCEIRAS_INICIAIS.find((c) => c.tipo === 'despesa' && c.nome === nome)?.id ?? null
}
const CATEGORIA_MENSALIDADE_ID = CATEGORIAS_FINANCEIRAS_INICIAIS.find(
  (c) => c.tipo === 'receita' && c.nome === 'Mensalidades'
)!.id

// ---------- Centros de custo ----------
const CENTROS_CUSTO_INICIAIS: CentroCusto[] = ['Administrativo', 'Comercial', 'Operacional', 'Marketing'].map((nome) => ({
  id: uidFin('cc'),
  nome,
  ativo: true,
}))
const CENTRO_CUSTO_OPERACIONAL_ID = CENTROS_CUSTO_INICIAIS.find((c) => c.nome === 'Operacional')!.id

// ---------- Migra as despesas fixas de demonstração (histórico já pago) para o novo modelo ----------
function gerarLancamentosDespesasIniciais(despesasDemo: Despesa[]): LancamentoFinanceiro[] {
  return despesasDemo.map((d) => {
    const dataFim = fimDoMes(d.competencia)
    return {
      id: uidFin('lanc'),
      tipo: 'despesa' as TipoLancamento,
      descricao: d.descricao,
      valor_centavos: paraCentavos(d.valor),
      valor_pago_centavos: paraCentavos(d.valor),
      data_competencia: `${d.competencia}-01`,
      data_vencimento: dataFim,
      data_pagamento: dataFim,
      categoria_id: categoriaDespesaIdPorNome(d.categoria),
      centro_custo_id: CENTRO_CUSTO_OPERACIONAL_ID,
      conta_financeira_id: CONTA_PRINCIPAL_ID,
      cliente_fornecedor: null,
      forma_pagamento: 'transferência',
      observacoes: null,
      numero_documento: null,
      status: 'pago' as StatusLancamento,
      recorrencia_id: null,
      cancelado_em: null,
      criado_em: agoraISO(),
    }
  })
}

// Gera as movimentações de caixa realizadas correspondentes aos lançamentos já pagos/recebidos na carga inicial
function gerarMovimentacoesDeLancamentos(lancs: LancamentoFinanceiro[]): Movimentacao[] {
  const movs: Movimentacao[] = []
  lancs.forEach((l) => {
    if (l.valor_pago_centavos > 0 && l.conta_financeira_id) {
      movs.push({
        id: uidFin('mov'),
        lancamento_id: l.id,
        conta_financeira_id: l.conta_financeira_id,
        tipo: l.tipo === 'despesa' ? 'saida' : 'entrada',
        valor_centavos: l.valor_pago_centavos,
        data: l.data_pagamento ?? l.data_vencimento,
        descricao: l.descricao,
        estornada: false,
        estornada_em: null,
        criado_em: l.criado_em,
      })
    }
  })
  return movs
}

// ---------- Exemplos de lançamentos recorrentes (aluguel, internet) ----------
function gerarRecorrenciasIniciais(): RegraRecorrencia[] {
  const mesAtual = hojeISO().slice(0, 7) + '-01'
  return [
    {
      id: uidFin('rec'),
      tipo: 'despesa',
      descricao: 'Aluguel do espaço',
      valor_centavos: paraCentavos(3800),
      categoria_id: categoriaDespesaIdPorNome('Aluguel'),
      centro_custo_id: CENTRO_CUSTO_OPERACIONAL_ID,
      conta_financeira_id: CONTA_PRINCIPAL_ID,
      cliente_fornecedor: null,
      frequencia: 'mensal',
      data_inicio: somarMesesISO(mesAtual, -6),
      data_fim: null,
      quantidade_ocorrencias: null,
      ativa: true,
      ultima_geracao: mesAtual, // já coberto pelo histórico migrado acima
    },
    {
      id: uidFin('rec'),
      tipo: 'despesa',
      descricao: 'Internet do espaço',
      valor_centavos: paraCentavos(180),
      categoria_id: categoriaDespesaIdPorNome('Infraestrutura'),
      centro_custo_id: CENTRO_CUSTO_OPERACIONAL_ID,
      conta_financeira_id: CONTA_PRINCIPAL_ID,
      cliente_fornecedor: null,
      frequencia: 'mensal',
      data_inicio: somarMesesISO(mesAtual, -6),
      data_fim: null,
      quantidade_ocorrencias: null,
      ativa: true,
      ultima_geracao: mesAtual,
    },
  ]
}

/** Calcula o status "efetivo" de um lançamento para exibição, sem alterar o status persistido.
 *  Um lançamento pendente/parcial cujo vencimento já passou aparece como "vencido". */
function statusEfetivoLancamento(l: LancamentoFinanceiro): StatusLancamento {
  if (l.status === 'cancelado' || l.status === 'pago' || l.status === 'recebido') return l.status
  if (l.data_vencimento < hojeISO() && l.valor_pago_centavos < l.valor_centavos) return 'vencido'
  return l.status
}

interface DemoStoreValue {
  alunos: Aluno[]
  mensalidades: (Mensalidade & { alunoNome: string })[]
  presentesHoje: Set<string>
  usuarios: Usuario[]
  permissoes: MatrizPermissoes
  adicionarAluno: (dados: { nome: string; telefone: string; email: string; faixa: FaixaCor; cpf: string }) => void
  // ---------- Portal do aluno ----------
  buscarAlunoPorCpf: (cpf: string) => Aluno | undefined
  cadastrarSenhaAluno: (cpf: string, senha: string) => { ok: boolean; erro?: string }
  resetarSenhaAluno: (alunoId: string) => void
  autenticarAluno: (cpf: string, senha: string) => Aluno | null
  atualizarAluno: (
    alunoId: string,
    dados: {
      nome: string
      telefone: string
      email: string
      data_nascimento: string
      faixa_atual: FaixaCor
      grau_atual: number
      observacoes: string
    }
  ) => void
  marcarPresenca: (alunoId: string) => void
  marcarPago: (mensalidadeId: string) => void
  autenticar: (email: string, senha: string) => Usuario | null
  adicionarUsuario: (dados: { nome: string; email: string; senha: string; role: UserRole }) => { ok: boolean; erro?: string }
  alternarUsuarioAtivo: (usuarioId: string) => void
  alternarPermissao: (role: UserRole, chave: PermissionKey) => void
  // ---------- Presença / graduação ----------
  presencasDoAluno: (alunoId: string) => Presenca[]
  registrarPresenca: (alunoId: string, data?: string) => { ok: boolean; erro?: string }
  calcularElegibilidade: (alunoId: string) => Elegibilidade | null
  concederGrau: (alunoId: string) => void
  promoverFaixa: (alunoId: string) => void
  // ---------- Painel gerencial: captação, conversão, financeiro ----------
  aulasExperimentais: AulaExperimental[]
  historicoFinanceiro: PontoFinanceiroMensal[]
  frequenciaMediaSemanal: number
  indicadoresCaptacao: {
    totalMes: number
    convertidosMes: number
    taxaConversao: number
    agendadasProximas: number
  }
  agendarAulaExperimental: (dados: { nome: string; telefone: string; origem: string }) => void
  atualizarStatusLead: (leadId: string, status: StatusAulaExperimental) => void
  // ---------- Produtos e fornecedores ----------
  fornecedores: Fornecedor[]
  produtos: (Produto & { fornecedorNome: string })[]
  adicionarFornecedor: (dados: {
    nome: string
    categoria: string
    contato: string
    telefone: string
    email: string
  }) => void
  alternarFornecedorAtivo: (fornecedorId: string) => void
  adicionarProduto: (dados: {
    nome: string
    categoria: string
    fornecedorId: string | null
    precoCusto: number
    precoVenda: number
    estoqueAtual: number
    estoqueMinimo: number
  }) => void
  atualizarProduto: (
    produtoId: string,
    dados: {
      nome: string
      categoria: string
      fornecedorId: string | null
      precoCusto: number
      precoVenda: number
      estoqueAtual: number
      estoqueMinimo: number
    }
  ) => void
  alternarProdutoAtivo: (produtoId: string) => void

  // ---------- Módulo financeiro ----------
  contasFinanceiras: (ContaFinanceira & { saldoAtualCentavos: number })[]
  categoriasFinanceiras: CategoriaFinanceira[]
  centrosCusto: CentroCusto[]
  lancamentos: (LancamentoFinanceiro & {
    statusEfetivo: StatusLancamento
    restanteCentavos: number
    categoriaNome: string
    centroCustoNome: string
    contaNome: string
  })[]
  movimentacoes: Movimentacao[]
  ajustesSaldo: AjusteSaldoConta[]
  recorrencias: RegraRecorrencia[]
  auditoria: RegistroAuditoria[]

  criarContaFinanceira: (dados: { nome: string; tipo: TipoContaFinanceira; saldoInicial: number }) => { ok: boolean; erro?: string }
  atualizarContaFinanceira: (id: string, dados: { nome: string; tipo: TipoContaFinanceira }) => void
  alternarContaFinanceiraAtiva: (id: string) => void
  ajustarSaldoConta: (id: string, valorReais: number, motivo: string, usuarioNome?: string) => { ok: boolean; erro?: string }

  criarCategoriaFinanceira: (dados: { nome: string; tipo: TipoLancamento; categoriaPaiId: string | null }) => { ok: boolean; erro?: string }
  alternarCategoriaFinanceiraAtiva: (id: string) => void

  criarCentroCusto: (dados: { nome: string }) => { ok: boolean; erro?: string }
  alternarCentroCustoAtivo: (id: string) => void

  criarLancamento: (dados: {
    tipo: TipoLancamento
    descricao: string
    valor: number
    data_competencia: string
    data_vencimento: string
    categoria_id: string | null
    centro_custo_id: string | null
    conta_financeira_id: string | null
    cliente_fornecedor: string
    forma_pagamento: string
    observacoes: string
    numero_documento: string
  }) => { ok: boolean; erro?: string; id?: string }
  atualizarLancamento: (
    id: string,
    dados: {
      descricao: string
      valor: number
      data_competencia: string
      data_vencimento: string
      categoria_id: string | null
      centro_custo_id: string | null
      conta_financeira_id: string | null
      cliente_fornecedor: string
      observacoes: string
      numero_documento: string
    }
  ) => { ok: boolean; erro?: string }
  cancelarLancamento: (id: string, usuarioNome?: string) => { ok: boolean; erro?: string }
  registrarPagamentoRecebimento: (
    lancamentoId: string,
    dados: { valor: number; data: string; contaFinanceiraId: string; formaPagamento: string },
    usuarioNome?: string
  ) => { ok: boolean; erro?: string }
  estornarMovimentacao: (movimentacaoId: string, usuarioNome?: string) => { ok: boolean; erro?: string }

  criarRecorrencia: (dados: {
    tipo: TipoLancamento
    descricao: string
    valor: number
    categoria_id: string | null
    centro_custo_id: string | null
    conta_financeira_id: string | null
    cliente_fornecedor: string
    frequencia: FrequenciaRecorrencia
    data_inicio: string
    data_fim: string
    quantidade_ocorrencias: number | null
  }) => { ok: boolean; erro?: string }
  alternarRecorrenciaAtiva: (id: string) => void
  gerarLancamentosRecorrencia: (recorrenciaId: string, usuarioNome?: string) => { ok: boolean; gerados: number }

  desfazerPagamentoMensalidade: (mensalidadeId: string, usuarioNome?: string) => { ok: boolean; erro?: string }

  saudeFinanceira: () => {
    semConta: number
    semCategoria: number
    possiveisDuplicados: { descricao: string; valor_centavos: number; ids: string[] }[]
    contasComSaldoNegativo: string[]
  }
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null)

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [alunos, setAlunos] = useState<Aluno[]>(ALUNOS_INICIAIS)
  const [mensalidadesBase, setMensalidadesBase] = useState<Mensalidade[]>(() => gerarMensalidadesIniciais(ALUNOS_INICIAIS))
  const [presentesHoje, setPresentesHoje] = useState<Set<string>>(new Set())
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_INICIAIS)
  const [permissoes, setPermissoes] = useState<MatrizPermissoes>(PERMISSOES_INICIAIS)
  const [presencas, setPresencas] = useState<Presenca[]>(() => gerarPresencasIniciais(ALUNOS_INICIAIS))
  const [aulasExperimentais, setAulasExperimentais] = useState<AulaExperimental[]>(() => gerarAulasExperimentais())
  const [despesas] = useState<Despesa[]>(() => gerarDespesasIniciais())
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(FORNECEDORES_INICIAIS)
  const [produtosBase, setProdutosBase] = useState<Produto[]>(PRODUTOS_INICIAIS)

  // ---------- Módulo financeiro ----------
  const [contasFinanceirasBase, setContasFinanceirasBase] = useState<ContaFinanceira[]>(CONTAS_FINANCEIRAS_INICIAIS)
  const [categoriasFinanceiras, setCategoriasFinanceiras] = useState<CategoriaFinanceira[]>(CATEGORIAS_FINANCEIRAS_INICIAIS)
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>(CENTROS_CUSTO_INICIAIS)
  const [lancamentosBase, setLancamentosBase] = useState<LancamentoFinanceiro[]>(() =>
    gerarLancamentosDespesasIniciais(despesas)
  )
  // Importante: reaproveita o MESMO array de lançamentos gerado acima (mesmos ids),
  // em vez de gerar uma segunda vez — senão os ids não bateriam entre lançamento e movimentação.
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(() => gerarMovimentacoesDeLancamentos(lancamentosBase))
  const [ajustesSaldo, setAjustesSaldo] = useState<AjusteSaldoConta[]>([])
  const [recorrencias, setRecorrencias] = useState<RegraRecorrencia[]>(() => gerarRecorrenciasIniciais())
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([])

  const historicoFinanceiro = gerarHistoricoFinanceiro(alunos, despesas)

  const frequenciaMediaSemanal = (() => {
    const alunosAtivos = alunos.filter((a) => a.ativo).length || 1
    const quatroSemanasAtras = new Date()
    quatroSemanasAtras.setDate(quatroSemanasAtras.getDate() - 28)
    const dataCorte = quatroSemanasAtras.toISOString().slice(0, 10)
    const presencasRecentes = presencas.filter((p) => p.data >= dataCorte).length
    return Math.round((presencasRecentes / alunosAtivos / 4) * 10) / 10
  })()

  const indicadoresCaptacao = (() => {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    const inicioMesStr = inicioMes.toISOString().slice(0, 10)
    const doMes = aulasExperimentais.filter((l) => l.data >= inicioMesStr)
    const finalizadas = aulasExperimentais.filter((l) => l.status !== 'agendada')
    const convertidas = aulasExperimentais.filter((l) => l.status === 'convertido')
    return {
      totalMes: doMes.length,
      convertidosMes: doMes.filter((l) => l.status === 'convertido').length,
      taxaConversao: finalizadas.length > 0 ? Math.round((convertidas.length / finalizadas.length) * 100) : 0,
      agendadasProximas: aulasExperimentais.filter((l) => l.status === 'agendada').length,
    }
  })()

  function agendarAulaExperimental(dados: { nome: string; telefone: string; origem: string }) {
    setAulasExperimentais((prev) => [
      { id: uidLead(), ...dados, data: new Date().toISOString().slice(0, 10), status: 'agendada' },
      ...prev,
    ])
  }

  function atualizarStatusLead(leadId: string, status: StatusAulaExperimental) {
    setAulasExperimentais((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)))
  }

  const produtos = produtosBase.map((p) => ({
    ...p,
    fornecedorNome: fornecedores.find((f) => f.id === p.fornecedorId)?.nome ?? '—',
  }))

  function adicionarFornecedor(dados: {
    nome: string
    categoria: string
    contato: string
    telefone: string
    email: string
  }) {
    setFornecedores((prev) => [...prev, { id: uid(), ativo: true, ...dados }])
  }

  function alternarFornecedorAtivo(fornecedorId: string) {
    setFornecedores((prev) => prev.map((f) => (f.id === fornecedorId ? { ...f, ativo: !f.ativo } : f)))
  }

  function adicionarProduto(dados: {
    nome: string
    categoria: string
    fornecedorId: string | null
    precoCusto: number
    precoVenda: number
    estoqueAtual: number
    estoqueMinimo: number
  }) {
    setProdutosBase((prev) => [...prev, { id: uid(), ativo: true, ...dados }])
  }

  function atualizarProduto(
    produtoId: string,
    dados: {
      nome: string
      categoria: string
      fornecedorId: string | null
      precoCusto: number
      precoVenda: number
      estoqueAtual: number
      estoqueMinimo: number
    }
  ) {
    setProdutosBase((prev) => prev.map((p) => (p.id === produtoId ? { ...p, ...dados } : p)))
  }

  function alternarProdutoAtivo(produtoId: string) {
    setProdutosBase((prev) => prev.map((p) => (p.id === produtoId ? { ...p, ativo: !p.ativo } : p)))
  }

  const mensalidades = mensalidadesBase.map((m) => ({
    ...m,
    alunoNome: alunos.find((a) => a.id === m.aluno_id)?.nome ?? '—',
  }))

  function adicionarAluno(dados: { nome: string; telefone: string; email: string; faixa: FaixaCor; cpf: string }) {
    const novo = alunoDemo(dados.nome, dados.faixa, 0, dados.telefone, 0)
    novo.email = dados.email || null
    novo.cpf = dados.cpf.trim()
    setAlunos((prev) => [...prev, novo])
  }

  // ---------- Portal do aluno (login por CPF) ----------
  function buscarAlunoPorCpf(cpf: string): Aluno | undefined {
    const alvo = normalizarCpf(cpf)
    return alunos.find((a) => normalizarCpf(a.cpf) === alvo)
  }

  function cadastrarSenhaAluno(cpf: string, senha: string): { ok: boolean; erro?: string } {
    const aluno = buscarAlunoPorCpf(cpf)
    if (!aluno) return { ok: false, erro: 'CPF não encontrado. Procure a recepção da academia.' }
    if (aluno.senha_acesso) return { ok: false, erro: 'Este CPF já tem uma senha cadastrada. Faça login normalmente.' }
    if (senha.length < 6) return { ok: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' }
    setAlunos((prev) => prev.map((a) => (a.id === aluno.id ? { ...a, senha_acesso: senha } : a)))
    return { ok: true }
  }

  function resetarSenhaAluno(alunoId: string) {
    setAlunos((prev) => prev.map((a) => (a.id === alunoId ? { ...a, senha_acesso: null } : a)))
  }

  function autenticarAluno(cpf: string, senha: string): Aluno | null {
    const aluno = buscarAlunoPorCpf(cpf)
    if (!aluno || !aluno.senha_acesso) return null
    if (aluno.senha_acesso !== senha) return null
    return aluno
  }

  function atualizarAluno(
    alunoId: string,
    dados: {
      nome: string
      telefone: string
      email: string
      data_nascimento: string
      faixa_atual: FaixaCor
      grau_atual: number
      observacoes: string
    }
  ) {
    setAlunos((prev) =>
      prev.map((a) =>
        a.id === alunoId
          ? {
              ...a,
              nome: dados.nome,
              telefone: dados.telefone || null,
              email: dados.email || null,
              data_nascimento: dados.data_nascimento || null,
              faixa_atual: dados.faixa_atual,
              grau_atual: Math.min(Math.max(dados.grau_atual, 0), GRAU_MAXIMO_POR_FAIXA[dados.faixa_atual]),
              observacoes: dados.observacoes || null,
            }
          : a
      )
    )
  }

  function marcarPresenca(alunoId: string) {
    setPresentesHoje((prev) => new Set(prev).add(alunoId))
    registrarPresenca(alunoId)
  }

  function presencasDoAluno(alunoId: string): Presenca[] {
    return presencas
      .filter((p) => p.aluno_id === alunoId)
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }

  function registrarPresenca(alunoId: string, data?: string): { ok: boolean; erro?: string } {
    const dataPresenca = data ?? new Date().toISOString().slice(0, 10)
    const jaTemNoDia = presencas.some((p) => p.aluno_id === alunoId && p.data === dataPresenca)
    if (jaTemNoDia) {
      return { ok: false, erro: 'Já existe presença registrada para este aluno nesta data.' }
    }
    setPresencas((prev) => [
      ...prev,
      { id: uidPresenca(), aluno_id: alunoId, turma_id: null, data: dataPresenca, hora: '19:00' },
    ])
    return { ok: true }
  }

  function calcularElegibilidade(alunoId: string): Elegibilidade | null {
    const aluno = alunos.find((a) => a.id === alunoId)
    if (!aluno) return null

    const criterio = CRITERIOS_POR_FAIXA[aluno.faixa_atual]
    const dataBase = aluno.data_ultima_graduacao ?? aluno.data_matricula
    const mesesNaFaixa = mesesEntre(dataBase)
    const semanas = semanasEntre(dataBase)
    const totalPresencas = presencas.filter((p) => p.aluno_id === alunoId && p.data >= dataBase).length
    const frequenciaMedia = totalPresencas / semanas
    const idadeAtual = idadeAnos(aluno.data_nascimento)

    const tempoOk = !!criterio.proximaFaixa && mesesNaFaixa >= criterio.mesesMinimos
    const idadeOk =
      criterio.idadeMinima == null || idadeAtual == null ? true : idadeAtual >= criterio.idadeMinima
    const frequenciaOk = !!criterio.proximaFaixa && frequenciaMedia >= criterio.frequenciaMinimaSemanal

    return {
      proximaFaixa: criterio.proximaFaixa,
      apto: !!criterio.proximaFaixa && tempoOk && idadeOk && frequenciaOk,
      tempoOk,
      mesesNaFaixa,
      mesesMinimos: criterio.mesesMinimos,
      idadeOk,
      idadeAtual,
      idadeMinima: criterio.idadeMinima,
      frequenciaOk,
      frequenciaMedia: Math.round(frequenciaMedia * 10) / 10,
      frequenciaMinima: criterio.frequenciaMinimaSemanal,
      totalPresencas,
      dataBase,
    }
  }

  function concederGrau(alunoId: string) {
    setAlunos((prev) =>
      prev.map((a) => {
        if (a.id !== alunoId) return a
        const grauMax = GRAU_MAXIMO_POR_FAIXA[a.faixa_atual]
        return { ...a, grau_atual: Math.min(a.grau_atual + 1, grauMax) }
      })
    )
  }

  function promoverFaixa(alunoId: string) {
    setAlunos((prev) =>
      prev.map((a) => {
        if (a.id !== alunoId) return a
        const indiceAtual = ORDEM_FAIXAS.indexOf(a.faixa_atual)
        const proxima = ORDEM_FAIXAS[indiceAtual + 1]
        if (!proxima) return a
        return {
          ...a,
          faixa_atual: proxima,
          grau_atual: 0,
          data_ultima_graduacao: new Date().toISOString().slice(0, 10),
        }
      })
    )
  }

  // ============================================================
  // MÓDULO FINANCEIRO — helpers e regras de negócio
  // ============================================================

  function registrarAuditoria(
    operacao: OperacaoAuditoria,
    entidade: string,
    entidadeId: string,
    descricao: string,
    usuarioNome = 'Usuário'
  ) {
    setAuditoria((prev) => [
      { id: uidFin('aud'), data_hora: agoraISO(), operacao, entidade, entidade_id: entidadeId, descricao, usuario_nome: usuarioNome },
      ...prev,
    ])
  }

  function saldoContaCentavos(contaId: string): number {
    const conta = contasFinanceirasBase.find((c) => c.id === contaId)
    if (!conta) return 0
    const entradas = movimentacoes
      .filter((m) => m.conta_financeira_id === contaId && m.tipo === 'entrada' && !m.estornada)
      .reduce((acc, m) => acc + m.valor_centavos, 0)
    const saidas = movimentacoes
      .filter((m) => m.conta_financeira_id === contaId && m.tipo === 'saida' && !m.estornada)
      .reduce((acc, m) => acc + m.valor_centavos, 0)
    const ajustes = ajustesSaldo
      .filter((a) => a.conta_financeira_id === contaId)
      .reduce((acc, a) => acc + a.valor_centavos, 0)
    return conta.saldo_inicial_centavos + entradas - saidas + ajustes
  }

  const contasFinanceiras = contasFinanceirasBase.map((c) => ({ ...c, saldoAtualCentavos: saldoContaCentavos(c.id) }))

  const lancamentos = lancamentosBase.map((l) => ({
    ...l,
    statusEfetivo: statusEfetivoLancamento(l),
    restanteCentavos: l.valor_centavos - l.valor_pago_centavos,
    categoriaNome: categoriasFinanceiras.find((c) => c.id === l.categoria_id)?.nome ?? '—',
    centroCustoNome: centrosCusto.find((c) => c.id === l.centro_custo_id)?.nome ?? '—',
    contaNome: contasFinanceirasBase.find((c) => c.id === l.conta_financeira_id)?.nome ?? '—',
  }))

  function criarContaFinanceira(dados: { nome: string; tipo: TipoContaFinanceira; saldoInicial: number }) {
    if (!dados.nome.trim()) return { ok: false, erro: 'Informe o nome da conta.' }
    const duplicada = contasFinanceirasBase.some((c) => c.nome.trim().toLowerCase() === dados.nome.trim().toLowerCase())
    if (duplicada) return { ok: false, erro: 'Já existe uma conta financeira com esse nome.' }
    const nova: ContaFinanceira = {
      id: uidFin('conta'),
      nome: dados.nome.trim(),
      tipo: dados.tipo,
      saldo_inicial_centavos: paraCentavos(dados.saldoInicial),
      ativa: true,
      criado_em: agoraISO(),
    }
    setContasFinanceirasBase((prev) => [...prev, nova])
    registrarAuditoria('criacao', 'conta_financeira', nova.id, `Conta financeira criada: ${nova.nome}`)
    return { ok: true }
  }

  function atualizarContaFinanceira(id: string, dados: { nome: string; tipo: TipoContaFinanceira }) {
    setContasFinanceirasBase((prev) => prev.map((c) => (c.id === id ? { ...c, nome: dados.nome, tipo: dados.tipo } : c)))
    registrarAuditoria('alteracao', 'conta_financeira', id, `Conta financeira editada`)
  }

  function alternarContaFinanceiraAtiva(id: string) {
    setContasFinanceirasBase((prev) => prev.map((c) => (c.id === id ? { ...c, ativa: !c.ativa } : c)))
  }

  function ajustarSaldoConta(id: string, valorReais: number, motivo: string, usuarioNome = 'Usuário') {
    if (!motivo.trim()) return { ok: false, erro: 'Informe o motivo do ajuste (obrigatório para auditoria).' }
    const valorCentavos = paraCentavos(valorReais)
    if (valorCentavos === 0) return { ok: false, erro: 'Informe um valor de ajuste diferente de zero.' }
    const ajuste: AjusteSaldoConta = {
      id: uidFin('ajuste'),
      conta_financeira_id: id,
      valor_centavos: valorCentavos,
      motivo: motivo.trim(),
      data: hojeISO(),
      criado_em: agoraISO(),
    }
    setAjustesSaldo((prev) => [...prev, ajuste])
    registrarAuditoria('ajuste_saldo', 'conta_financeira', id, `Ajuste de saldo (${motivo.trim()})`, usuarioNome)
    return { ok: true }
  }

  function criarCategoriaFinanceira(dados: { nome: string; tipo: TipoLancamento; categoriaPaiId: string | null }) {
    if (!dados.nome.trim()) return { ok: false, erro: 'Informe o nome da categoria.' }
    const duplicada = categoriasFinanceiras.some(
      (c) => c.tipo === dados.tipo && c.nome.trim().toLowerCase() === dados.nome.trim().toLowerCase()
    )
    if (duplicada) return { ok: false, erro: 'Já existe uma categoria com esse nome para este tipo.' }
    setCategoriasFinanceiras((prev) => [
      ...prev,
      { id: uidFin('cat'), nome: dados.nome.trim(), tipo: dados.tipo, categoria_pai_id: dados.categoriaPaiId, ativa: true },
    ])
    return { ok: true }
  }

  function alternarCategoriaFinanceiraAtiva(id: string) {
    setCategoriasFinanceiras((prev) => prev.map((c) => (c.id === id ? { ...c, ativa: !c.ativa } : c)))
  }

  function criarCentroCusto(dados: { nome: string }) {
    if (!dados.nome.trim()) return { ok: false, erro: 'Informe o nome do centro de custo.' }
    const duplicado = centrosCusto.some((c) => c.nome.trim().toLowerCase() === dados.nome.trim().toLowerCase())
    if (duplicado) return { ok: false, erro: 'Já existe um centro de custo com esse nome.' }
    setCentrosCusto((prev) => [...prev, { id: uidFin('cc'), nome: dados.nome.trim(), ativo: true }])
    return { ok: true }
  }

  function alternarCentroCustoAtivo(id: string) {
    setCentrosCusto((prev) => prev.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c)))
  }

  // Verifica se já existe um lançamento muito parecido (mesma descrição, valor, vencimento e tipo),
  // ainda não cancelado — usado para prevenir duplicidade acidental de lançamentos.
  function existeLancamentoParecido(
    tipo: TipoLancamento,
    descricao: string,
    valorCentavos: number,
    dataVencimento: string,
    ignorarId?: string
  ): boolean {
    return lancamentosBase.some(
      (l) =>
        l.id !== ignorarId &&
        l.tipo === tipo &&
        l.status !== 'cancelado' &&
        l.descricao.trim().toLowerCase() === descricao.trim().toLowerCase() &&
        l.valor_centavos === valorCentavos &&
        l.data_vencimento === dataVencimento
    )
  }

  function criarLancamento(dados: {
    tipo: TipoLancamento
    descricao: string
    valor: number
    data_competencia: string
    data_vencimento: string
    categoria_id: string | null
    centro_custo_id: string | null
    conta_financeira_id: string | null
    cliente_fornecedor: string
    forma_pagamento: string
    observacoes: string
    numero_documento: string
  }) {
    if (!dados.descricao.trim()) return { ok: false, erro: 'Informe a descrição.' }
    if (!(dados.valor > 0)) return { ok: false, erro: 'O valor deve ser maior que zero.' }
    if (!dados.data_vencimento) return { ok: false, erro: 'Informe a data de vencimento.' }
    if (!dados.categoria_id) return { ok: false, erro: 'Selecione uma categoria.' }
    const valorCentavos = paraCentavos(dados.valor)
    if (existeLancamentoParecido(dados.tipo, dados.descricao, valorCentavos, dados.data_vencimento)) {
      return {
        ok: false,
        erro: 'Já existe um lançamento com a mesma descrição, valor e vencimento. Verifique se não é duplicado.',
      }
    }
    const novo: LancamentoFinanceiro = {
      id: uidFin('lanc'),
      tipo: dados.tipo,
      descricao: dados.descricao.trim(),
      valor_centavos: valorCentavos,
      valor_pago_centavos: 0,
      data_competencia: dados.data_competencia || dados.data_vencimento,
      data_vencimento: dados.data_vencimento,
      data_pagamento: null,
      categoria_id: dados.categoria_id,
      centro_custo_id: dados.centro_custo_id,
      conta_financeira_id: dados.conta_financeira_id,
      cliente_fornecedor: dados.cliente_fornecedor.trim() || null,
      forma_pagamento: dados.forma_pagamento.trim() || null,
      observacoes: dados.observacoes.trim() || null,
      numero_documento: dados.numero_documento.trim() || null,
      status: 'pendente',
      recorrencia_id: null,
      cancelado_em: null,
      criado_em: agoraISO(),
    }
    setLancamentosBase((prev) => [novo, ...prev])
    registrarAuditoria(
      'criacao',
      'lancamento',
      novo.id,
      `${dados.tipo === 'receita' ? 'Receita' : 'Despesa'} criada: ${novo.descricao}`
    )
    return { ok: true, id: novo.id }
  }

  function atualizarLancamento(
    id: string,
    dados: {
      descricao: string
      valor: number
      data_competencia: string
      data_vencimento: string
      categoria_id: string | null
      centro_custo_id: string | null
      conta_financeira_id: string | null
      cliente_fornecedor: string
      observacoes: string
      numero_documento: string
    }
  ) {
    const atual = lancamentosBase.find((l) => l.id === id)
    if (!atual) return { ok: false, erro: 'Lançamento não encontrado.' }
    if (!dados.descricao.trim()) return { ok: false, erro: 'Informe a descrição.' }
    if (!(dados.valor > 0)) return { ok: false, erro: 'O valor deve ser maior que zero.' }
    const valorCentavos = paraCentavos(dados.valor)
    if (atual.valor_pago_centavos > 0 && valorCentavos !== atual.valor_centavos) {
      return {
        ok: false,
        erro: 'Este lançamento já possui pagamento/recebimento registrado — não é possível alterar o valor original. Estorne o pagamento primeiro.',
      }
    }
    setLancamentosBase((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              descricao: dados.descricao.trim(),
              valor_centavos: valorCentavos,
              data_competencia: dados.data_competencia || l.data_competencia,
              data_vencimento: dados.data_vencimento || l.data_vencimento,
              categoria_id: dados.categoria_id,
              centro_custo_id: dados.centro_custo_id,
              conta_financeira_id: dados.conta_financeira_id,
              cliente_fornecedor: dados.cliente_fornecedor.trim() || null,
              observacoes: dados.observacoes.trim() || null,
              numero_documento: dados.numero_documento.trim() || null,
            }
          : l
      )
    )
    registrarAuditoria('alteracao', 'lancamento', id, `Lançamento editado: ${dados.descricao.trim()}`)
    return { ok: true }
  }

  function cancelarLancamento(id: string, usuarioNome = 'Usuário') {
    const atual = lancamentosBase.find((l) => l.id === id)
    if (!atual) return { ok: false, erro: 'Lançamento não encontrado.' }
    if (atual.status === 'cancelado') return { ok: false, erro: 'Este lançamento já está cancelado.' }
    if (atual.valor_pago_centavos > 0) {
      return {
        ok: false,
        erro: 'Este lançamento já possui pagamento/recebimento registrado. Estorne o(s) pagamento(s) antes de cancelar.',
      }
    }
    setLancamentosBase((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'cancelado' as StatusLancamento, cancelado_em: agoraISO() } : l))
    )
    registrarAuditoria('cancelamento', 'lancamento', id, `Lançamento cancelado: ${atual.descricao}`, usuarioNome)
    return { ok: true }
  }

  function registrarPagamentoRecebimento(
    lancamentoId: string,
    dados: { valor: number; data: string; contaFinanceiraId: string; formaPagamento: string },
    usuarioNome = 'Usuário'
  ) {
    const lanc = lancamentosBase.find((l) => l.id === lancamentoId)
    if (!lanc) return { ok: false, erro: 'Lançamento não encontrado.' }
    if (lanc.status === 'cancelado') {
      return { ok: false, erro: `Não é possível ${lanc.tipo === 'despesa' ? 'pagar' : 'receber'} um lançamento cancelado.` }
    }
    if (lanc.status === 'pago' || lanc.status === 'recebido') {
      return { ok: false, erro: 'Este lançamento já está totalmente quitado.' }
    }
    const conta = contasFinanceirasBase.find((c) => c.id === dados.contaFinanceiraId)
    if (!conta || !conta.ativa) return { ok: false, erro: 'Selecione uma conta financeira ativa válida.' }
    const valorCentavos = paraCentavos(dados.valor)
    if (!(valorCentavos > 0)) return { ok: false, erro: 'O valor deve ser maior que zero.' }
    const restante = lanc.valor_centavos - lanc.valor_pago_centavos
    if (valorCentavos > restante) {
      return {
        ok: false,
        erro: `O valor informado é maior que o restante devido (R$ ${(restante / 100).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })}).`,
      }
    }
    if (!dados.data) return { ok: false, erro: 'Informe a data.' }

    const movimentacao: Movimentacao = {
      id: uidFin('mov'),
      lancamento_id: lanc.id,
      conta_financeira_id: dados.contaFinanceiraId,
      tipo: lanc.tipo === 'despesa' ? 'saida' : 'entrada',
      valor_centavos: valorCentavos,
      data: dados.data,
      descricao: lanc.descricao,
      estornada: false,
      estornada_em: null,
      criado_em: agoraISO(),
    }
    setMovimentacoes((prev) => [movimentacao, ...prev])

    const novoValorPago = lanc.valor_pago_centavos + valorCentavos
    const quitado = novoValorPago >= lanc.valor_centavos
    const novoStatus: StatusLancamento = quitado
      ? lanc.tipo === 'despesa'
        ? 'pago'
        : 'recebido'
      : lanc.tipo === 'despesa'
      ? 'parcialmente_pago'
      : 'parcialmente_recebido'

    setLancamentosBase((prev) =>
      prev.map((l) =>
        l.id === lancamentoId
          ? {
              ...l,
              valor_pago_centavos: novoValorPago,
              data_pagamento: dados.data,
              forma_pagamento: dados.formaPagamento.trim() || l.forma_pagamento,
              conta_financeira_id: dados.contaFinanceiraId,
              status: novoStatus,
            }
          : l
      )
    )

    registrarAuditoria(
      lanc.tipo === 'despesa' ? 'pagamento' : 'recebimento',
      'lancamento',
      lanc.id,
      `${lanc.tipo === 'despesa' ? 'Pagamento' : 'Recebimento'} de R$ ${dados.valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })} — ${lanc.descricao}`,
      usuarioNome
    )
    return { ok: true }
  }

  function estornarMovimentacao(movimentacaoId: string, usuarioNome = 'Usuário') {
    const mov = movimentacoes.find((m) => m.id === movimentacaoId)
    if (!mov) return { ok: false, erro: 'Movimentação não encontrada.' }
    if (mov.estornada) return { ok: false, erro: 'Esta movimentação já foi estornada.' }

    setMovimentacoes((prev) =>
      prev.map((m) => (m.id === movimentacaoId ? { ...m, estornada: true, estornada_em: agoraISO() } : m))
    )

    if (mov.lancamento_id) {
      const lanc = lancamentosBase.find((l) => l.id === mov.lancamento_id)
      if (lanc) {
        const novoValorPago = Math.max(0, lanc.valor_pago_centavos - mov.valor_centavos)
        const novoStatus: StatusLancamento =
          novoValorPago === 0
            ? 'pendente'
            : lanc.tipo === 'despesa'
            ? 'parcialmente_pago'
            : 'parcialmente_recebido'
        setLancamentosBase((prev) =>
          prev.map((l) =>
            l.id === lanc.id
              ? {
                  ...l,
                  valor_pago_centavos: novoValorPago,
                  status: novoStatus,
                  data_pagamento: novoValorPago === 0 ? null : l.data_pagamento,
                }
              : l
          )
        )
      }
    }

    registrarAuditoria('estorno', 'movimentacao', mov.id, `Estorno de ${mov.tipo} — ${mov.descricao}`, usuarioNome)
    return { ok: true }
  }

  function criarRecorrencia(dados: {
    tipo: TipoLancamento
    descricao: string
    valor: number
    categoria_id: string | null
    centro_custo_id: string | null
    conta_financeira_id: string | null
    cliente_fornecedor: string
    frequencia: FrequenciaRecorrencia
    data_inicio: string
    data_fim: string
    quantidade_ocorrencias: number | null
  }) {
    if (!dados.descricao.trim()) return { ok: false, erro: 'Informe a descrição.' }
    if (!(dados.valor > 0)) return { ok: false, erro: 'O valor deve ser maior que zero.' }
    if (!dados.data_inicio) return { ok: false, erro: 'Informe a data de início.' }
    const nova: RegraRecorrencia = {
      id: uidFin('rec'),
      tipo: dados.tipo,
      descricao: dados.descricao.trim(),
      valor_centavos: paraCentavos(dados.valor),
      categoria_id: dados.categoria_id,
      centro_custo_id: dados.centro_custo_id,
      conta_financeira_id: dados.conta_financeira_id,
      cliente_fornecedor: dados.cliente_fornecedor.trim() || null,
      frequencia: dados.frequencia,
      data_inicio: dados.data_inicio,
      data_fim: dados.data_fim || null,
      quantidade_ocorrencias: dados.quantidade_ocorrencias,
      ativa: true,
      ultima_geracao: null,
    }
    setRecorrencias((prev) => [...prev, nova])
    return { ok: true }
  }

  function alternarRecorrenciaAtiva(id: string) {
    setRecorrencias((prev) => prev.map((r) => (r.id === id ? { ...r, ativa: !r.ativa } : r)))
  }

  function proximaDataPorFrequencia(dataISO: string, frequencia: FrequenciaRecorrencia): string {
    switch (frequencia) {
      case 'semanal':
        return somarDiasISO(dataISO, 7)
      case 'mensal':
        return somarMesesISO(dataISO, 1)
      case 'trimestral':
        return somarMesesISO(dataISO, 3)
      case 'anual':
        return somarMesesISO(dataISO, 12)
    }
  }

  // Gera os lançamentos pendentes de uma recorrência até a data de hoje, sem duplicar
  // (cada ocorrência é identificada pela combinação recorrencia_id + data_competencia).
  function gerarLancamentosRecorrencia(recorrenciaId: string, usuarioNome = 'Usuário') {
    const regra = recorrencias.find((r) => r.id === recorrenciaId)
    if (!regra || !regra.ativa) return { ok: false, gerados: 0 }

    const hoje = hojeISO()
    let cursor = regra.ultima_geracao ? proximaDataPorFrequencia(regra.ultima_geracao, regra.frequencia) : regra.data_inicio
    const novosLancamentos: LancamentoFinanceiro[] = []
    let ocorrenciasGeradas = 0
    let guarda = 0 // proteção contra loop infinito
    let ultimaOcorrenciaProcessada = regra.ultima_geracao

    while (cursor <= hoje && guarda < 500) {
      guarda++
      if (regra.data_fim && cursor > regra.data_fim) break
      if (regra.quantidade_ocorrencias != null && ocorrenciasGeradas >= regra.quantidade_ocorrencias) break

      const jaExiste = lancamentosBase.some((l) => l.recorrencia_id === regra.id && l.data_competencia === cursor)
      if (!jaExiste) {
        novosLancamentos.push({
          id: uidFin('lanc'),
          tipo: regra.tipo,
          descricao: regra.descricao,
          valor_centavos: regra.valor_centavos,
          valor_pago_centavos: 0,
          data_competencia: cursor,
          data_vencimento: cursor,
          data_pagamento: null,
          categoria_id: regra.categoria_id,
          centro_custo_id: regra.centro_custo_id,
          conta_financeira_id: regra.conta_financeira_id,
          cliente_fornecedor: regra.cliente_fornecedor,
          forma_pagamento: null,
          observacoes: `Gerado automaticamente pela recorrência "${regra.descricao}"`,
          numero_documento: null,
          status: 'pendente',
          recorrencia_id: regra.id,
          cancelado_em: null,
          criado_em: agoraISO(),
        })
        ocorrenciasGeradas++
      }
      ultimaOcorrenciaProcessada = cursor
      cursor = proximaDataPorFrequencia(cursor, regra.frequencia)
    }

    if (novosLancamentos.length > 0) {
      setLancamentosBase((prev) => [...novosLancamentos, ...prev])
    }
    if (ultimaOcorrenciaProcessada !== regra.ultima_geracao) {
      setRecorrencias((prev) => prev.map((r) => (r.id === regra.id ? { ...r, ultima_geracao: ultimaOcorrenciaProcessada } : r)))
    }
    if (novosLancamentos.length > 0) {
      registrarAuditoria(
        'geracao_recorrencia',
        'recorrencia',
        regra.id,
        `${novosLancamentos.length} lançamento(s) gerado(s) para "${regra.descricao}"`,
        usuarioNome
      )
    }
    return { ok: true, gerados: novosLancamentos.length }
  }

  function desfazerPagamentoMensalidade(mensalidadeId: string, usuarioNome = 'Usuário') {
    const mensalidade = mensalidadesBase.find((m) => m.id === mensalidadeId)
    if (!mensalidade) return { ok: false, erro: 'Mensalidade não encontrada.' }
    const movimentacao = movimentacoes.find(
      (m) => m.lancamento_id === `mensalidade:${mensalidadeId}` && !m.estornada
    )
    if (movimentacao) {
      estornarMovimentacao(movimentacao.id, usuarioNome)
    }
    const hoje = hojeISO()
    setMensalidadesBase((prev) =>
      prev.map((m) =>
        m.id === mensalidadeId
          ? { ...m, status: (m.vencimento < hoje ? 'atrasado' : 'pendente') as StatusMensalidade, pago_em: null }
          : m
      )
    )
    registrarAuditoria('estorno', 'mensalidade', mensalidadeId, `Pagamento de mensalidade desfeito`, usuarioNome)
    return { ok: true }
  }

  function saudeFinanceira() {
    const ativos = lancamentosBase.filter((l) => l.status !== 'cancelado')
    const semConta = ativos.filter((l) => !l.conta_financeira_id).length
    const semCategoria = ativos.filter((l) => !l.categoria_id).length

    const grupos = new Map<string, string[]>()
    ativos.forEach((l) => {
      const chave = `${l.tipo}|${l.descricao.trim().toLowerCase()}|${l.valor_centavos}|${l.data_vencimento}`
      grupos.set(chave, [...(grupos.get(chave) ?? []), l.id])
    })
    const possiveisDuplicados = Array.from(grupos.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([chave, ids]) => {
        const [, descricao, valorStr] = chave.split('|')
        return { descricao, valor_centavos: Number(valorStr), ids }
      })

    const contasComSaldoNegativo = contasFinanceirasBase
      .filter((c) => c.ativa && saldoContaCentavos(c.id) < 0)
      .map((c) => c.nome)

    return { semConta, semCategoria, possiveisDuplicados, contasComSaldoNegativo }
  }

  function marcarPago(mensalidadeId: string) {
    const mensalidade = mensalidadesBase.find((m) => m.id === mensalidadeId)
    setMensalidadesBase((prev) =>
      prev.map((m) =>
        m.id === mensalidadeId
          ? { ...m, status: 'pago' as StatusMensalidade, pago_em: new Date().toISOString().slice(0, 10) }
          : m
      )
    )
    if (mensalidade && mensalidade.status !== 'pago') {
      const alunoNome = alunos.find((a) => a.id === mensalidade.aluno_id)?.nome ?? '—'
      const contaPadrao = contasFinanceirasBase[0]
      if (contaPadrao) {
        setMovimentacoes((prev) => [
          {
            id: uidFin('mov'),
            lancamento_id: `mensalidade:${mensalidadeId}`,
            conta_financeira_id: contaPadrao.id,
            tipo: 'entrada',
            valor_centavos: paraCentavos(Number(mensalidade.valor)),
            data: hojeISO(),
            descricao: `Mensalidade — ${alunoNome}`,
            estornada: false,
            estornada_em: null,
            criado_em: agoraISO(),
          },
          ...prev,
        ])
      }
      registrarAuditoria('recebimento', 'mensalidade', mensalidadeId, `Mensalidade recebida — ${alunoNome}`)
    }
  }

  function autenticar(email: string, senha: string): Usuario | null {
    const usuario = usuarios.find(
      (u) => u.ativo && u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.senha === senha
    )
    return usuario ?? null
  }

  function adicionarUsuario(dados: { nome: string; email: string; senha: string; role: UserRole }) {
    const emailExiste = usuarios.some((u) => u.email.trim().toLowerCase() === dados.email.trim().toLowerCase())
    if (emailExiste) return { ok: false, erro: 'Já existe um usuário com esse e-mail.' }
    if (!dados.nome.trim() || !dados.email.trim() || dados.senha.length < 6) {
      return { ok: false, erro: 'Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.' }
    }
    setUsuarios((prev) => [...prev, { id: uid(), ativo: true, ...dados }])
    return { ok: true }
  }

  function alternarUsuarioAtivo(usuarioId: string) {
    setUsuarios((prev) => prev.map((u) => (u.id === usuarioId ? { ...u, ativo: !u.ativo } : u)))
  }

  function alternarPermissao(role: UserRole, chave: PermissionKey) {
    setPermissoes((prev) => {
      const atual = prev[role]
      const tem = atual.includes(chave)
      return {
        ...prev,
        [role]: tem ? atual.filter((c) => c !== chave) : [...atual, chave],
      }
    })
  }

  return (
    <DemoStoreContext.Provider
      value={{
        alunos,
        mensalidades,
        presentesHoje,
        usuarios,
        permissoes,
        adicionarAluno,
        atualizarAluno,
        buscarAlunoPorCpf,
        cadastrarSenhaAluno,
        resetarSenhaAluno,
        autenticarAluno,
        marcarPresenca,
        marcarPago,
        autenticar,
        adicionarUsuario,
        alternarUsuarioAtivo,
        alternarPermissao,
        presencasDoAluno,
        registrarPresenca,
        calcularElegibilidade,
        concederGrau,
        promoverFaixa,
        aulasExperimentais,
        historicoFinanceiro,
        frequenciaMediaSemanal,
        indicadoresCaptacao,
        agendarAulaExperimental,
        atualizarStatusLead,
        fornecedores,
        produtos,
        adicionarFornecedor,
        alternarFornecedorAtivo,
        adicionarProduto,
        atualizarProduto,
        alternarProdutoAtivo,
        contasFinanceiras,
        categoriasFinanceiras,
        centrosCusto,
        lancamentos,
        movimentacoes,
        ajustesSaldo,
        recorrencias,
        auditoria,
        criarContaFinanceira,
        atualizarContaFinanceira,
        alternarContaFinanceiraAtiva,
        ajustarSaldoConta,
        criarCategoriaFinanceira,
        alternarCategoriaFinanceiraAtiva,
        criarCentroCusto,
        alternarCentroCustoAtivo,
        criarLancamento,
        atualizarLancamento,
        cancelarLancamento,
        registrarPagamentoRecebimento,
        estornarMovimentacao,
        criarRecorrencia,
        alternarRecorrenciaAtiva,
        gerarLancamentosRecorrencia,
        desfazerPagamentoMensalidade,
        saudeFinanceira,
      }}
    >
      {children}
    </DemoStoreContext.Provider>
  )
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext)
  if (!ctx) throw new Error('useDemoStore precisa estar dentro de DemoStoreProvider')
  return ctx
}
