-- ============================================================
-- SISTEMA DE GESTÃO — ACADEMIA GRACIE BARRA
-- Schema inicial (Fase 1 — MVP): alunos, financeiro, check-in
-- ============================================================

-- Extensão para UUID
create extension if not exists "pgcrypto";

-- ---------- PERFIS (liga usuários do Supabase Auth aos papéis) ----------
create type user_role as enum ('admin', 'professor', 'aluno');

create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  role user_role not null default 'aluno',
  telefone text,
  criado_em timestamptz not null default now()
);

-- ---------- FAIXAS / CURRÍCULO ----------
create type faixa_cor as enum ('branca', 'azul', 'roxa', 'marrom', 'preta');

create table faixas_curriculo (
  id uuid primary key default gen_random_uuid(),
  cor faixa_cor not null,
  grau_min int not null default 0,
  grau_max int not null default 4,
  tempo_minimo_meses int not null, -- tempo mínimo NA FAIXA ANTERIOR para poder graduar para esta
  idade_minima_anos int, -- idade mínima (IBJJF) para receber esta faixa
  frequencia_minima_semanal numeric(3,1) not null default 2, -- aulas/semana esperadas (heurística de assiduidade)
  ordem int not null unique
);

-- ---------- ALUNOS ----------
create table alunos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid references perfis(id) on delete set null,
  nome text not null,
  email text,
  telefone text,
  data_nascimento date,
  data_matricula date not null default current_date,
  faixa_atual faixa_cor not null default 'branca',
  grau_atual int not null default 0,
  data_ultima_graduacao date,
  ativo boolean not null default true,
  observacoes text,
  criado_em timestamptz not null default now()
);

create index idx_alunos_ativo on alunos(ativo);

-- ---------- HISTÓRICO DE GRADUAÇÃO ----------
create table graduacoes (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  faixa faixa_cor not null,
  grau int not null,
  data date not null default current_date,
  professor_id uuid references perfis(id),
  observacao text
);

-- ---------- TURMAS ----------
create table turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,          -- ex: "Fundamentos - Seg/Qua 19h"
  professor_id uuid references perfis(id),
  dia_semana int[] not null,   -- 0=domingo .. 6=sábado
  horario_inicio time not null,
  horario_fim time not null,
  capacidade int,
  ativa boolean not null default true
);

-- ---------- MATRÍCULAS EM TURMA ----------
create table matriculas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete cascade,
  data_inicio date not null default current_date,
  ativa boolean not null default true,
  unique (aluno_id, turma_id)
);

-- ---------- CHECK-IN / PRESENÇA ----------
create table presencas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  turma_id uuid references turmas(id),
  data date not null default current_date,
  hora time not null default current_time,
  registrado_por uuid references perfis(id)
);

create index idx_presencas_aluno_data on presencas(aluno_id, data);

-- ---------- FINANCEIRO: PLANOS ----------
create table planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,          -- ex: "Mensal ilimitado"
  valor numeric(10,2) not null,
  periodicidade text not null default 'mensal', -- mensal, trimestral, anual
  ativo boolean not null default true
);

-- ---------- FINANCEIRO: MENSALIDADES ----------
create type status_mensalidade as enum ('pendente', 'pago', 'atrasado', 'cancelado');

create table mensalidades (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  plano_id uuid references planos(id),
  valor numeric(10,2) not null,
  vencimento date not null,
  pago_em date,
  status status_mensalidade not null default 'pendente',
  forma_pagamento text,
  criado_em timestamptz not null default now()
);

create index idx_mensalidades_status on mensalidades(status);
create index idx_mensalidades_vencimento on mensalidades(vencimento);

-- ============================================================
-- MÓDULO FINANCEIRO EMPRESARIAL (Fase 2)
-- Não altera nem remove nenhuma tabela/coluna da Fase 1 acima.
-- Todos os valores monetários usam numeric(12,2) — nunca float —
-- para evitar erro de centavos em somas.
-- ============================================================

create type tipo_conta_financeira as enum ('caixa', 'banco', 'conta_corrente', 'conta_digital', 'cartao', 'outra');

create table contas_financeiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo tipo_conta_financeira not null default 'conta_corrente',
  saldo_inicial numeric(12,2) not null default 0,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (nome)
);

create type tipo_lancamento as enum ('receita', 'despesa');

create table categorias_financeiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo tipo_lancamento not null,
  categoria_pai_id uuid references categorias_financeiras(id) on delete set null,
  ativa boolean not null default true,
  unique (nome, tipo)
);

create table centros_custo (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true
);

create type frequencia_recorrencia as enum ('semanal', 'mensal', 'trimestral', 'anual');

create table recorrencias_financeiras (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_lancamento not null,
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),
  categoria_id uuid references categorias_financeiras(id),
  centro_custo_id uuid references centros_custo(id),
  conta_financeira_id uuid references contas_financeiras(id),
  cliente_fornecedor text,
  frequencia frequencia_recorrencia not null,
  data_inicio date not null,
  data_fim date,
  quantidade_ocorrencias int,
  ativa boolean not null default true,
  ultima_geracao date
);

create type status_lancamento as enum (
  'pendente', 'pago', 'recebido', 'parcialmente_pago', 'parcialmente_recebido', 'cancelado'
);
-- "vencido" é calculado em tempo de leitura (vencimento < hoje e não quitado), nunca persistido,
-- para não precisar de um job para manter o status em dia.

create table lancamentos_financeiros (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_lancamento not null,
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),          -- valor original — nunca sobrescrito
  valor_pago numeric(12,2) not null default 0 check (valor_pago >= 0),
  data_competencia date not null,
  data_vencimento date not null,
  data_pagamento date,
  categoria_id uuid references categorias_financeiras(id),
  centro_custo_id uuid references centros_custo(id),
  conta_financeira_id uuid references contas_financeiras(id),
  cliente_fornecedor text,
  forma_pagamento text,
  observacoes text,
  numero_documento text,
  status status_lancamento not null default 'pendente',
  recorrencia_id uuid references recorrencias_financeiras(id),
  cancelado_em timestamptz,
  criado_em timestamptz not null default now(),
  check (valor_pago <= valor)
);

create index idx_lancamentos_tipo_status on lancamentos_financeiros(tipo, status);
create index idx_lancamentos_vencimento on lancamentos_financeiros(data_vencimento);
create index idx_lancamentos_competencia on lancamentos_financeiros(data_competencia);
create index idx_lancamentos_recorrencia on lancamentos_financeiros(recorrencia_id, data_competencia);
-- Previne duplicidade exata de um mesmo lançamento (mesma descrição+valor+vencimento+tipo, não cancelado).
create unique index idx_lancamentos_sem_duplicidade
  on lancamentos_financeiros (tipo, lower(descricao), valor, data_vencimento)
  where (status <> 'cancelado');

create type tipo_movimentacao as enum ('entrada', 'saida');

-- Movimentação = dinheiro que REALMENTE entrou/saiu de uma conta (fluxo de caixa realizado).
-- Um lançamento nunca altera saldo por si só — só a movimentação gerada ao pagar/receber.
create table movimentacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  lancamento_id uuid references lancamentos_financeiros(id),
  conta_financeira_id uuid not null references contas_financeiras(id),
  tipo tipo_movimentacao not null,
  valor numeric(12,2) not null check (valor > 0),
  data date not null,
  descricao text not null,
  estornada boolean not null default false,
  estornada_em timestamptz,
  criado_em timestamptz not null default now()
);

create index idx_movimentacoes_conta_data on movimentacoes_financeiras(conta_financeira_id, data);
create index idx_movimentacoes_lancamento on movimentacoes_financeiras(lancamento_id);

create table ajustes_saldo_conta (
  id uuid primary key default gen_random_uuid(),
  conta_financeira_id uuid not null references contas_financeiras(id),
  valor numeric(12,2) not null check (valor <> 0),
  motivo text not null,
  data date not null default current_date,
  criado_em timestamptz not null default now()
);

create type operacao_auditoria as enum (
  'criacao', 'alteracao', 'pagamento', 'recebimento', 'cancelamento', 'estorno', 'ajuste_saldo', 'geracao_recorrencia'
);

create table auditoria_financeira (
  id uuid primary key default gen_random_uuid(),
  data_hora timestamptz not null default now(),
  operacao operacao_auditoria not null,
  entidade text not null,
  entidade_id uuid,
  descricao text not null,
  usuario_id uuid references perfis(id)
);

create index idx_auditoria_entidade on auditoria_financeira(entidade, entidade_id);

-- ============================================================
-- ROW LEVEL SECURITY — módulo financeiro (somente admin gerencia;
-- leitura de apoio como categorias/centros de custo liberada a todos os logados)
-- ============================================================
alter table contas_financeiras enable row level security;
alter table categorias_financeiras enable row level security;
alter table centros_custo enable row level security;
alter table recorrencias_financeiras enable row level security;
alter table lancamentos_financeiros enable row level security;
alter table movimentacoes_financeiras enable row level security;
alter table ajustes_saldo_conta enable row level security;
alter table auditoria_financeira enable row level security;

create policy "admin_ve_contas_financeiras" on contas_financeiras for select using (auth_role() = 'admin');
create policy "admin_gerencia_contas_financeiras" on contas_financeiras for all using (auth_role() = 'admin');

create policy "logados_veem_categorias" on categorias_financeiras for select using (auth.uid() is not null);
create policy "admin_gerencia_categorias" on categorias_financeiras for all using (auth_role() = 'admin');

create policy "logados_veem_centros_custo" on centros_custo for select using (auth.uid() is not null);
create policy "admin_gerencia_centros_custo" on centros_custo for all using (auth_role() = 'admin');

create policy "admin_ve_recorrencias" on recorrencias_financeiras for select using (auth_role() = 'admin');
create policy "admin_gerencia_recorrencias" on recorrencias_financeiras for all using (auth_role() = 'admin');

create policy "admin_ve_lancamentos" on lancamentos_financeiros for select using (auth_role() = 'admin');
create policy "admin_gerencia_lancamentos" on lancamentos_financeiros for all using (auth_role() = 'admin');

create policy "admin_ve_movimentacoes" on movimentacoes_financeiras for select using (auth_role() = 'admin');
create policy "admin_gerencia_movimentacoes" on movimentacoes_financeiras for all using (auth_role() = 'admin');

create policy "admin_ve_ajustes_saldo" on ajustes_saldo_conta for select using (auth_role() = 'admin');
create policy "admin_gerencia_ajustes_saldo" on ajustes_saldo_conta for all using (auth_role() = 'admin');

create policy "admin_ve_auditoria_financeira" on auditoria_financeira for select using (auth_role() = 'admin');
create policy "sistema_grava_auditoria_financeira" on auditoria_financeira for insert with check (auth_role() = 'admin');

-- ============================================================
-- ROW LEVEL SECURITY (Fase 1)
-- ============================================================
alter table perfis enable row level security;
alter table alunos enable row level security;
alter table graduacoes enable row level security;
alter table turmas enable row level security;
alter table matriculas enable row level security;
alter table presencas enable row level security;
alter table planos enable row level security;
alter table mensalidades enable row level security;
alter table faixas_curriculo enable row level security;

-- Helper: verifica o papel do usuário logado
create or replace function auth_role() returns user_role as $$
  select role from perfis where id = auth.uid();
$$ language sql stable security definer;

-- Admin e professor podem ver/gerenciar tudo relacionado à operação da academia.
-- Aluno só vê os próprios dados.

-- PERFIS
create policy "admin_ve_todos_perfis" on perfis for select using (auth_role() in ('admin','professor') or id = auth.uid());
create policy "admin_gerencia_perfis" on perfis for all using (auth_role() = 'admin');

-- ALUNOS
create policy "staff_ve_alunos" on alunos for select using (auth_role() in ('admin','professor'));
create policy "aluno_ve_proprio_registro" on alunos for select using (perfil_id = auth.uid());
create policy "staff_gerencia_alunos" on alunos for all using (auth_role() in ('admin','professor'));

-- GRADUAÇÕES
create policy "staff_ve_graduacoes" on graduacoes for select using (auth_role() in ('admin','professor'));
create policy "aluno_ve_proprias_graduacoes" on graduacoes for select using (
  aluno_id in (select id from alunos where perfil_id = auth.uid())
);
create policy "staff_gerencia_graduacoes" on graduacoes for all using (auth_role() in ('admin','professor'));

-- TURMAS (visível a todos os logados)
create policy "todos_veem_turmas" on turmas for select using (auth.uid() is not null);
create policy "staff_gerencia_turmas" on turmas for all using (auth_role() in ('admin','professor'));

-- MATRÍCULAS
create policy "staff_ve_matriculas" on matriculas for select using (auth_role() in ('admin','professor'));
create policy "aluno_ve_propria_matricula" on matriculas for select using (
  aluno_id in (select id from alunos where perfil_id = auth.uid())
);
create policy "staff_gerencia_matriculas" on matriculas for all using (auth_role() in ('admin','professor'));

-- PRESENÇAS
create policy "staff_ve_presencas" on presencas for select using (auth_role() in ('admin','professor'));
create policy "aluno_ve_propria_presenca" on presencas for select using (
  aluno_id in (select id from alunos where perfil_id = auth.uid())
);
create policy "staff_gerencia_presencas" on presencas for all using (auth_role() in ('admin','professor'));

-- FINANCEIRO — só admin (professor não vê dinheiro de aluno por padrão)
create policy "admin_ve_planos" on planos for select using (auth.uid() is not null);
create policy "admin_gerencia_planos" on planos for all using (auth_role() = 'admin');

create policy "admin_ve_mensalidades" on mensalidades for select using (auth_role() = 'admin');
create policy "aluno_ve_propria_mensalidade" on mensalidades for select using (
  aluno_id in (select id from alunos where perfil_id = auth.uid())
);
create policy "admin_gerencia_mensalidades" on mensalidades for all using (auth_role() = 'admin');

-- CURRÍCULO
create policy "todos_veem_curriculo" on faixas_curriculo for select using (auth.uid() is not null);
create policy "admin_gerencia_curriculo" on faixas_curriculo for all using (auth_role() = 'admin');

-- ============================================================
-- SEED — currículo padrão de faixas adultas (Gracie Barra / IBJJF)
--
-- tempo_minimo_meses: tempo mínimo NA FAIXA ANTERIOR antes de
-- poder ser promovido para esta faixa.
--   branca -> azul: 1 ano (12 meses)
--   azul   -> roxa: 2 anos (24 meses)
--   roxa   -> marrom: 1 ano e meio (18 meses)
--   marrom -> preta: 1 ano (12 meses)
--
-- idade_minima_anos: idade mínima exigida pela IBJJF para receber
-- a faixa (azul e roxa: 16 anos · marrom: 18 anos · preta: 19 anos).
--
-- Esses tempos são mínimos: cumpri-los não garante a graduação —
-- a decisão final é sempre do professor. Atletas campeões mundiais
-- na faixa atual podem ser dispensados do tempo mínimo pelas regras
-- da IBJJF; esse caso não é automatizado aqui e deve ser tratado
-- manualmente pelo professor.
-- ============================================================
insert into faixas_curriculo (cor, grau_min, grau_max, tempo_minimo_meses, idade_minima_anos, frequencia_minima_semanal, ordem) values
  ('branca', 0, 4, 0, null, 2, 1),
  ('azul', 0, 4, 12, 16, 2, 2),
  ('roxa', 0, 4, 24, 16, 2, 3),
  ('marrom', 0, 4, 18, 18, 2, 4),
  ('preta', 0, 6, 12, 19, 2, 5);
