-- ============================================================
-- SISTEMA DE GESTÃO — ACADEMIA GRACIE BARRA
-- Schema completo: alunos, check-in, financeiro, produtos/vendas
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- PAPÉIS E PERMISSÕES
-- ------------------------------------------------------------
-- user_role é o papel fixo do usuário (guarda quem ele é).
-- permissoes_papel é a matriz configurável de "o que cada papel
-- pode fazer" — a mesma coisa que a tela Administração > Permissões
-- edita no app. Ela precisa existir como tabela (e não só no
-- código do front-end) para que o RLS consiga checar permissões
-- dinamicamente em vez de ter cada regra hardcoded no SQL.
-- ============================================================
create type user_role as enum ('admin', 'professor', 'financeiro', 'aluno');

create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  role user_role not null default 'aluno',
  telefone text,
  criado_em timestamptz not null default now()
);

alter table perfis enable row level security;

-- Helper: papel do usuário logado. Definida cedo de propósito — é usada
-- por praticamente toda política de RLS do restante do arquivo, então
-- precisa existir antes de qualquer "create policy" que a referencie.
create or replace function auth_role() returns user_role as $$
  select role from perfis where id = auth.uid();
$$ language sql stable security definer;

create table permissoes_papel (
  role user_role not null,
  permissao text not null,
  primary key (role, permissao)
);

alter table permissoes_papel enable row level security;

-- Todo usuário logado pode ler a matriz (o app usa isso para decidir o que
-- mostrar na interface); só admin pode alterá-la.
create policy "logados_veem_permissoes" on permissoes_papel for select using (auth.uid() is not null);
create policy "admin_gerencia_permissoes" on permissoes_papel for all using (auth_role() = 'admin');

-- Helper: a checagem de permissão em si — usada no lugar de checar o papel
-- direto em cada política, para que mudar a matriz na tela Administração
-- mude o comportamento do banco também, sem precisar editar RLS.
create or replace function tem_permissao(p_permissao text) returns boolean as $$
  select exists (
    select 1 from permissoes_papel where role = auth_role() and permissao = p_permissao
  );
$$ language sql stable security definer;

-- Seed — mesmos padrões definidos em PERMISSOES_INICIAIS (src/lib/demoStore.tsx).
-- Mantenha os dois em sincronia se a matriz padrão mudar.
insert into permissoes_papel (role, permissao) values
  ('admin', 'ver_painel'), ('admin', 'gerenciar_alunos'), ('admin', 'fazer_checkin'),
  ('admin', 'registrar_venda'), ('admin', 'ver_financeiro'), ('admin', 'gerenciar_financeiro'),
  ('admin', 'gerenciar_usuarios'), ('admin', 'gerenciar_produtos'),
  ('professor', 'ver_painel'), ('professor', 'gerenciar_alunos'), ('professor', 'fazer_checkin'),
  ('professor', 'registrar_venda'),
  ('financeiro', 'ver_painel'), ('financeiro', 'ver_financeiro'), ('financeiro', 'gerenciar_financeiro'),
  ('financeiro', 'gerenciar_produtos'), ('financeiro', 'registrar_venda');
  -- 'aluno' não recebe nenhuma permissão de equipe — usa o portal do aluno, não este login.

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
  cpf text not null unique,
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
create index idx_alunos_cpf on alunos(cpf);

-- ============================================================
-- PORTAL DO ALUNO (login por CPF + senha própria)
-- ------------------------------------------------------------
-- O aluno se autentica no Supabase Auth com um e-mail sintético
-- gerado a partir do CPF (ver cpfParaEmailAuth no front-end) —
-- ele nunca vê nem digita esse e-mail, só o CPF.
-- Antes de logar, o app precisa saber se aquele CPF existe e se
-- já tem acesso configurado (perfil_id preenchido); como o
-- visitante ainda está anônimo nesse momento, isso não pode
-- passar pelas policies normais de "alunos" — por isso a função
-- abaixo roda com SECURITY DEFINER e só devolve o mínimo
-- necessário (nunca a linha inteira do aluno).
-- ============================================================

create or replace function cpf_normalizado(valor text)
returns text as $$
  select regexp_replace(valor, '\D', '', 'g')
$$ language sql immutable;

create or replace function aluno_status_cpf(p_cpf text)
returns table(ja_tem_acesso boolean, nome text)
language sql
security definer
set search_path = public
stable
as $$
  select
    (a.perfil_id is not null) as ja_tem_acesso,
    a.nome
  from alunos a
  where cpf_normalizado(a.cpf) = cpf_normalizado(p_cpf)
  limit 1
$$;

grant execute on function aluno_status_cpf(text) to anon, authenticated;

-- Chamada logo após o aluno criar a conta no Supabase Auth (primeiro
-- acesso): já está autenticado (auth.uid() existe), então vincula o
-- registro de aluno correspondente ao CPF a essa conta.
create or replace function vincular_aluno_por_cpf(p_cpf text, p_nome text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_aluno_id uuid;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar autenticado para vincular o acesso.';
  end if;

  select id into v_aluno_id
  from alunos
  where cpf_normalizado(cpf) = cpf_normalizado(p_cpf) and perfil_id is null
  limit 1;

  if v_aluno_id is null then
    raise exception 'CPF não encontrado ou já vinculado a outro acesso.';
  end if;

  insert into perfis (id, nome, role) values (auth.uid(), p_nome, 'aluno')
  on conflict (id) do nothing;

  update alunos set perfil_id = auth.uid() where id = v_aluno_id;
end;
$$;

grant execute on function vincular_aluno_por_cpf(text, text) to authenticated;

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
  registrado_por uuid references perfis(id),
  -- Check-in feito pelo próprio aluno no portal (selfie + geolocalização) —
  -- ver função registrar_checkin_aluno mais abaixo.
  origem text not null default 'staff' check (origem in ('staff', 'auto')),
  foto_url text,
  distancia_metros numeric
);

create unique index idx_presencas_uma_por_dia on presencas(aluno_id, data);
create index idx_presencas_aluno_data on presencas(aluno_id, data);

-- ============================================================
-- Todos os valores monetários do banco usam bigint de CENTAVOS
-- (nunca numeric nem float) — mesma unidade e mesmo nome de coluna
-- que o front-end já usa (valor_centavos), evitando uma camada de
-- conversão/tradução entre banco e app que seria uma fonte fácil
-- de bug de arredondamento.
-- ============================================================

-- ---------- FINANCEIRO: PLANOS ----------
create table planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,          -- ex: "Mensal ilimitado"
  valor_centavos bigint not null check (valor_centavos > 0),
  periodicidade text not null default 'mensal', -- mensal, trimestral, anual
  ativo boolean not null default true
);

-- ---------- FINANCEIRO: MENSALIDADES ----------
create type status_mensalidade as enum ('pendente', 'pago', 'atrasado', 'cancelado');

create table mensalidades (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id) on delete cascade,
  plano_id uuid references planos(id),
  valor_centavos bigint not null check (valor_centavos > 0),
  vencimento date not null,
  pago_em date,
  status status_mensalidade not null default 'pendente',
  forma_pagamento text,
  criado_em timestamptz not null default now()
);

create index idx_mensalidades_status on mensalidades(status);
create index idx_mensalidades_vencimento on mensalidades(vencimento);

-- ---------- PRODUTOS / FORNECEDORES (loja da academia) ----------
create table fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  contato text,
  telefone text,
  email text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null,
  fornecedor_id uuid references fornecedores(id) on delete set null,
  preco_custo_centavos bigint not null default 0 check (preco_custo_centavos >= 0),
  preco_venda_centavos bigint not null check (preco_venda_centavos >= 0),
  estoque_atual int not null default 0 check (estoque_atual >= 0),
  estoque_minimo int not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index idx_produtos_ativo on produtos(ativo);

-- ============================================================
-- MÓDULO FINANCEIRO EMPRESARIAL
-- ============================================================

create type tipo_conta_financeira as enum ('caixa', 'banco', 'conta_corrente', 'conta_digital', 'cartao', 'outra');

create table contas_financeiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo tipo_conta_financeira not null default 'conta_corrente',
  saldo_inicial_centavos bigint not null default 0,
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
  valor_centavos bigint not null check (valor_centavos > 0),
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
  valor_centavos bigint not null check (valor_centavos > 0),          -- valor original — nunca sobrescrito
  valor_pago_centavos bigint not null default 0 check (valor_pago_centavos >= 0),
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
  check (valor_pago_centavos <= valor_centavos)
);

create index idx_lancamentos_tipo_status on lancamentos_financeiros(tipo, status);
create index idx_lancamentos_vencimento on lancamentos_financeiros(data_vencimento);
create index idx_lancamentos_competencia on lancamentos_financeiros(data_competencia);
create index idx_lancamentos_recorrencia on lancamentos_financeiros(recorrencia_id, data_competencia);
-- Previne duplicidade exata de um mesmo lançamento (mesma descrição+valor+vencimento+tipo, não cancelado).
create unique index idx_lancamentos_sem_duplicidade
  on lancamentos_financeiros (tipo, lower(descricao), valor_centavos, data_vencimento)
  where (status <> 'cancelado');

create type tipo_movimentacao as enum ('entrada', 'saida');

-- Movimentação = dinheiro que REALMENTE entrou/saiu de uma conta (fluxo de caixa realizado).
-- Um lançamento nunca altera saldo por si só — só a movimentação gerada ao pagar/receber.
create table movimentacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  lancamento_id uuid references lancamentos_financeiros(id),
  conta_financeira_id uuid not null references contas_financeiras(id),
  tipo tipo_movimentacao not null,
  valor_centavos bigint not null check (valor_centavos > 0),
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
  valor_centavos bigint not null check (valor_centavos <> 0),
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
-- VENDA DE PRODUTOS (PDV)
-- ------------------------------------------------------------
-- Uma venda não é uma tabela própria — ela decrementa o estoque
-- e cria um lançamento de receita + movimentação já quitados,
-- exatamente como o modo demo faz (o texto do lançamento registra
-- os itens vendidos, ex: "Venda: 2x Kimono, 1x Faixa").
-- Isso roda como uma função SECURITY DEFINER para: (1) garantir
-- atomicidade (baixa de estoque + lançamento não podem ficar
-- pela metade), e (2) permitir que um papel com "registrar_venda"
-- mas sem "gerenciar_financeiro" ainda assim consiga vender, sem
-- precisar de uma policy de insert genérica e mais permissiva em
-- lancamentos_financeiros.
-- ============================================================
create or replace function registrar_venda_produtos(
  p_itens jsonb, -- [{ "produto_id": "uuid", "quantidade": 2 }, ...]
  p_cliente_nome text,
  p_forma_pagamento text,
  p_conta_financeira_id uuid,
  p_data date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_produto produtos%rowtype;
  v_total_centavos bigint := 0;
  v_descricao text := '';
  v_lancamento_id uuid;
  v_categoria_id uuid;
begin
  if not tem_permissao('registrar_venda') then
    raise exception 'Sem permissão para registrar vendas.';
  end if;

  if jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione ao menos um produto à venda.';
  end if;

  -- Trava as linhas de produto envolvidas para evitar corrida entre duas vendas simultâneas do mesmo item.
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    select * into v_produto from produtos where id = (v_item->>'produto_id')::uuid for update;
    if not found or not v_produto.ativo then
      raise exception 'Um dos produtos selecionados não está mais disponível.';
    end if;
    if (v_item->>'quantidade')::int > v_produto.estoque_atual then
      raise exception 'Estoque insuficiente de "%": disponível %', v_produto.nome, v_produto.estoque_atual;
    end if;
    v_total_centavos := v_total_centavos + v_produto.preco_venda_centavos * (v_item->>'quantidade')::int;
    v_descricao := v_descricao || (v_item->>'quantidade') || 'x ' || v_produto.nome || ', ';
  end loop;
  v_descricao := 'Venda: ' || left(v_descricao, length(v_descricao) - 2);

  -- Baixa o estoque de cada item
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    update produtos set estoque_atual = estoque_atual - (v_item->>'quantidade')::int
    where id = (v_item->>'produto_id')::uuid;
  end loop;

  select id into v_categoria_id from categorias_financeiras where tipo = 'receita' and nome = 'Produtos/Loja' limit 1;

  insert into lancamentos_financeiros (
    tipo, descricao, valor_centavos, valor_pago_centavos, data_competencia, data_vencimento,
    data_pagamento, categoria_id, conta_financeira_id, cliente_fornecedor, forma_pagamento, status
  ) values (
    'receita', v_descricao, v_total_centavos, v_total_centavos, p_data, p_data,
    p_data, v_categoria_id, p_conta_financeira_id, nullif(trim(p_cliente_nome), ''), p_forma_pagamento, 'recebido'
  ) returning id into v_lancamento_id;

  insert into movimentacoes_financeiras (lancamento_id, conta_financeira_id, tipo, valor_centavos, data, descricao)
  values (v_lancamento_id, p_conta_financeira_id, 'entrada', v_total_centavos, p_data, v_descricao);

  insert into auditoria_financeira (operacao, entidade, entidade_id, descricao, usuario_id)
  values ('criacao', 'lancamento', v_lancamento_id, v_descricao, auth.uid());

  return v_lancamento_id;
end;
$$;

grant execute on function registrar_venda_produtos(jsonb, text, text, uuid, date) to authenticated;

-- ============================================================
-- Ajustes de estrutura pendentes (adicionados depois das tabelas originais)
-- ============================================================

-- Permite desativar um usuário da equipe sem apagar o histórico dele.
alter table perfis add column if not exists ativo boolean not null default true;

-- Liga uma movimentação de caixa à mensalidade que a originou (quando for o
-- caso), pra dar pra desfazer o pagamento de uma mensalidade especificamente.
alter table movimentacoes_financeiras add column if not exists mensalidade_id uuid references mensalidades(id);

-- ============================================================
-- Mensalidades: marcar como paga / desfazer pagamento
-- ------------------------------------------------------------
-- Espelham exatamente marcarPago / desfazerPagamentoMensalidade do
-- demoStore.tsx: dão baixa na mensalidade E registram/estornam a
-- movimentação de caixa correspondente, atomicamente.
-- ============================================================

create or replace function marcar_mensalidade_paga(p_mensalidade_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mensalidade mensalidades%rowtype;
  v_aluno_nome text;
  v_conta_id uuid;
begin
  if not tem_permissao('gerenciar_financeiro') then
    raise exception 'Sem permissão para gerenciar o financeiro.';
  end if;

  select * into v_mensalidade from mensalidades where id = p_mensalidade_id;
  if not found then raise exception 'Mensalidade não encontrada.'; end if;
  if v_mensalidade.status = 'pago' then return; end if; -- idempotente, igual ao demo

  select nome into v_aluno_nome from alunos where id = v_mensalidade.aluno_id;
  select id into v_conta_id from contas_financeiras where ativa order by criado_em limit 1;

  update mensalidades set status = 'pago', pago_em = current_date where id = p_mensalidade_id;

  if v_conta_id is not null then
    insert into movimentacoes_financeiras
      (mensalidade_id, conta_financeira_id, tipo, valor_centavos, data, descricao)
    values
      (p_mensalidade_id, v_conta_id, 'entrada', v_mensalidade.valor_centavos, current_date, 'Mensalidade — ' || coalesce(v_aluno_nome, '—'));
  end if;

  insert into auditoria_financeira (operacao, entidade, entidade_id, descricao, usuario_id)
  values ('recebimento', 'mensalidade', p_mensalidade_id, 'Mensalidade recebida — ' || coalesce(v_aluno_nome, '—'), auth.uid());
end;
$$;

grant execute on function marcar_mensalidade_paga(uuid) to authenticated;

create or replace function desfazer_pagamento_mensalidade(p_mensalidade_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mensalidade mensalidades%rowtype;
  v_novo_status status_mensalidade;
begin
  if not tem_permissao('gerenciar_financeiro') then
    raise exception 'Sem permissão para gerenciar o financeiro.';
  end if;

  select * into v_mensalidade from mensalidades where id = p_mensalidade_id;
  if not found then raise exception 'Mensalidade não encontrada.'; end if;

  update movimentacoes_financeiras
  set estornada = true, estornada_em = now()
  where mensalidade_id = p_mensalidade_id and not estornada;

  v_novo_status := case when v_mensalidade.vencimento < current_date then 'atrasado' else 'pendente' end;
  update mensalidades set status = v_novo_status, pago_em = null where id = p_mensalidade_id;

  insert into auditoria_financeira (operacao, entidade, entidade_id, descricao, usuario_id)
  values ('estorno', 'mensalidade', p_mensalidade_id, 'Pagamento de mensalidade desfeito', auth.uid());
end;
$$;

grant execute on function desfazer_pagamento_mensalidade(uuid) to authenticated;

-- ============================================================
-- Lançamentos: pagar/receber e estornar
-- ------------------------------------------------------------
-- Espelham registrarPagamentoRecebimento / estornarMovimentacao do
-- demoStore.tsx — a transição de status (parcial/quitado/pendente)
-- é calculada aqui, no mesmo lugar que grava a movimentação, pra
-- nunca ficar dessincronizado.
-- ============================================================

create or replace function registrar_pagamento_lancamento(
  p_lancamento_id uuid,
  p_valor_centavos bigint,
  p_data date,
  p_conta_financeira_id uuid,
  p_forma_pagamento text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lanc lancamentos_financeiros%rowtype;
  v_conta contas_financeiras%rowtype;
  v_novo_valor_pago bigint;
  v_quitado boolean;
  v_novo_status status_lancamento;
begin
  if not tem_permissao('gerenciar_financeiro') then
    raise exception 'Sem permissão para gerenciar o financeiro.';
  end if;

  select * into v_lanc from lancamentos_financeiros where id = p_lancamento_id;
  if not found then raise exception 'Lançamento não encontrado.'; end if;
  if v_lanc.status = 'cancelado' then
    raise exception 'Não é possível % um lançamento cancelado.', (case when v_lanc.tipo = 'despesa' then 'pagar' else 'receber' end);
  end if;
  if v_lanc.status in ('pago', 'recebido') then
    raise exception 'Este lançamento já está totalmente quitado.';
  end if;

  select * into v_conta from contas_financeiras where id = p_conta_financeira_id;
  if not found or not v_conta.ativa then raise exception 'Selecione uma conta financeira ativa válida.'; end if;
  if p_valor_centavos <= 0 then raise exception 'O valor deve ser maior que zero.'; end if;
  if p_valor_centavos > (v_lanc.valor_centavos - v_lanc.valor_pago_centavos) then
    raise exception 'O valor informado é maior que o restante devido.';
  end if;

  insert into movimentacoes_financeiras (lancamento_id, conta_financeira_id, tipo, valor_centavos, data, descricao)
  values (p_lancamento_id, p_conta_financeira_id, case when v_lanc.tipo = 'despesa' then 'saida' else 'entrada' end, p_valor_centavos, p_data, v_lanc.descricao);

  v_novo_valor_pago := v_lanc.valor_pago_centavos + p_valor_centavos;
  v_quitado := v_novo_valor_pago >= v_lanc.valor_centavos;
  v_novo_status := case
    when v_quitado and v_lanc.tipo = 'despesa' then 'pago'
    when v_quitado then 'recebido'
    when v_lanc.tipo = 'despesa' then 'parcialmente_pago'
    else 'parcialmente_recebido'
  end;

  update lancamentos_financeiros
  set valor_pago_centavos = v_novo_valor_pago,
      data_pagamento = p_data,
      forma_pagamento = coalesce(nullif(trim(p_forma_pagamento), ''), forma_pagamento),
      conta_financeira_id = p_conta_financeira_id,
      status = v_novo_status
  where id = p_lancamento_id;

  insert into auditoria_financeira (operacao, entidade, entidade_id, descricao, usuario_id)
  values (
    case when v_lanc.tipo = 'despesa' then 'pagamento' else 'recebimento' end,
    'lancamento', p_lancamento_id,
    (case when v_lanc.tipo = 'despesa' then 'Pagamento' else 'Recebimento' end) || ' — ' || v_lanc.descricao,
    auth.uid()
  );
end;
$$;

grant execute on function registrar_pagamento_lancamento(uuid, bigint, date, uuid, text) to authenticated;

create or replace function estornar_movimentacao(p_movimentacao_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mov movimentacoes_financeiras%rowtype;
  v_lanc lancamentos_financeiros%rowtype;
  v_novo_valor_pago bigint;
  v_novo_status status_lancamento;
begin
  if not tem_permissao('gerenciar_financeiro') then
    raise exception 'Sem permissão para gerenciar o financeiro.';
  end if;

  select * into v_mov from movimentacoes_financeiras where id = p_movimentacao_id;
  if not found then raise exception 'Movimentação não encontrada.'; end if;
  if v_mov.estornada then raise exception 'Esta movimentação já foi estornada.'; end if;

  update movimentacoes_financeiras set estornada = true, estornada_em = now() where id = p_movimentacao_id;

  if v_mov.lancamento_id is not null then
    select * into v_lanc from lancamentos_financeiros where id = v_mov.lancamento_id;
    if found then
      v_novo_valor_pago := greatest(0, v_lanc.valor_pago_centavos - v_mov.valor_centavos);
      v_novo_status := case
        when v_novo_valor_pago = 0 then 'pendente'
        when v_lanc.tipo = 'despesa' then 'parcialmente_pago'
        else 'parcialmente_recebido'
      end;
      update lancamentos_financeiros
      set valor_pago_centavos = v_novo_valor_pago,
          status = v_novo_status,
          data_pagamento = case when v_novo_valor_pago = 0 then null else data_pagamento end
      where id = v_lanc.id;
    end if;
  end if;

  insert into auditoria_financeira (operacao, entidade, entidade_id, descricao, usuario_id)
  values ('estorno', 'movimentacao', p_movimentacao_id, 'Estorno de ' || v_mov.tipo || ' — ' || v_mov.descricao, auth.uid());
end;
$$;

grant execute on function estornar_movimentacao(uuid) to authenticated;

-- Cancelar só é permitido enquanto nada foi pago/recebido ainda (mesma regra do demo).
create or replace function cancelar_lancamento(p_lancamento_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lanc lancamentos_financeiros%rowtype;
begin
  if not tem_permissao('gerenciar_financeiro') then
    raise exception 'Sem permissão para gerenciar o financeiro.';
  end if;

  select * into v_lanc from lancamentos_financeiros where id = p_lancamento_id;
  if not found then raise exception 'Lançamento não encontrado.'; end if;
  if v_lanc.status = 'cancelado' then raise exception 'Este lançamento já está cancelado.'; end if;
  if v_lanc.valor_pago_centavos > 0 then
    raise exception 'Este lançamento já possui pagamento/recebimento registrado. Estorne o(s) pagamento(s) antes de cancelar.';
  end if;

  update lancamentos_financeiros set status = 'cancelado', cancelado_em = now() where id = p_lancamento_id;

  insert into auditoria_financeira (operacao, entidade, entidade_id, descricao, usuario_id)
  values ('cancelamento', 'lancamento', p_lancamento_id, 'Lançamento cancelado: ' || v_lanc.descricao, auth.uid());
end;
$$;

grant execute on function cancelar_lancamento(uuid) to authenticated;

-- ============================================================
-- Check-in do aluno pelo portal (selfie + geolocalização)
-- ------------------------------------------------------------
-- A distância é validada AQUI, no servidor — nunca confiando no valor
-- que o navegador do aluno calcula, porque esse valor pode ser
-- manipulado (devtools, app modificado, GPS falso). O app já mostra
-- uma mensagem imediata no celular usando o mesmo cálculo, só pra dar
-- feedback rápido; quem decide de verdade é esta função.
--
-- IMPORTANTE: as constantes abaixo (latitude/longitude da academia e
-- raio permitido) precisam ser as MESMAS de src/lib/localizacaoAcademia.ts.
-- Se mudar lá, mude aqui também.
-- ============================================================

create or replace function registrar_checkin_aluno(p_foto_url text, p_latitude double precision, p_longitude double precision)
returns table(distancia_metros numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_academia_lat double precision := -28.0273;
  v_academia_lng double precision := -48.6172;
  v_raio_permitido_metros numeric := 150;
  v_aluno_id uuid;
  v_distancia numeric;
begin
  select id into v_aluno_id from alunos where perfil_id = auth.uid();
  if v_aluno_id is null then
    raise exception 'Aluno não encontrado para este acesso.';
  end if;

  if exists (select 1 from presencas where aluno_id = v_aluno_id and data = current_date) then
    raise exception 'Você já registrou presença hoje.';
  end if;

  -- Haversine, em metros.
  v_distancia := 6371000 * 2 * asin(sqrt(
    sin(radians(p_latitude - v_academia_lat) / 2) ^ 2 +
    cos(radians(v_academia_lat)) * cos(radians(p_latitude)) *
    sin(radians(p_longitude - v_academia_lng) / 2) ^ 2
  ));

  if v_distancia > v_raio_permitido_metros then
    raise exception 'Você está a %m da academia — muito longe pra confirmar presença.', round(v_distancia);
  end if;

  insert into presencas (aluno_id, data, hora, origem, foto_url, distancia_metros)
  values (v_aluno_id, current_date, current_time, 'auto', p_foto_url, round(v_distancia));

  return query select round(v_distancia);
end;
$$;

grant execute on function registrar_checkin_aluno(text, double precision, double precision) to authenticated;

-- Bucket privado pras selfies de check-in — nunca público.
insert into storage.buckets (id, name, public)
values ('checkin-selfies', 'checkin-selfies', false)
on conflict (id) do nothing;

-- O aluno só pode enviar/ver arquivos dentro da própria pasta (nome da pasta = aluno_id).
create policy "aluno_envia_propria_selfie" on storage.objects for insert
  with check (bucket_id = 'checkin-selfies' and (storage.foldername(name))[1] = (select id::text from alunos where perfil_id = auth.uid()));

create policy "aluno_ve_propria_selfie" on storage.objects for select
  using (bucket_id = 'checkin-selfies' and (storage.foldername(name))[1] = (select id::text from alunos where perfil_id = auth.uid()));

-- Staff com acesso a alunos pode ver as selfies pra auditar presenças, se precisar.
create policy "staff_ve_selfies_checkin" on storage.objects for select
  using (bucket_id = 'checkin-selfies' and tem_permissao('gerenciar_alunos'));

-- ============================================================
-- ROW LEVEL SECURITY — todas as tabelas, usando tem_permissao()
-- em vez de checar o papel direto, para que a matriz configurável
-- na tela Administração reflita de verdade no banco.
-- ============================================================
alter table alunos enable row level security;
alter table graduacoes enable row level security;
alter table turmas enable row level security;
alter table matriculas enable row level security;
alter table presencas enable row level security;
alter table planos enable row level security;
alter table mensalidades enable row level security;
alter table faixas_curriculo enable row level security;
alter table fornecedores enable row level security;
alter table produtos enable row level security;
alter table contas_financeiras enable row level security;
alter table categorias_financeiras enable row level security;
alter table centros_custo enable row level security;
alter table recorrencias_financeiras enable row level security;
alter table lancamentos_financeiros enable row level security;
alter table movimentacoes_financeiras enable row level security;
alter table ajustes_saldo_conta enable row level security;
alter table auditoria_financeira enable row level security;

-- PERFIS
create policy "admin_ve_todos_perfis" on perfis for select using (auth_role() in ('admin','professor','financeiro') or id = auth.uid());
create policy "admin_gerencia_perfis" on perfis for all using (tem_permissao('gerenciar_usuarios'));

-- ALUNOS
create policy "staff_ve_alunos" on alunos for select using (tem_permissao('gerenciar_alunos'));
create policy "aluno_ve_proprio_registro" on alunos for select using (perfil_id = auth.uid());
create policy "staff_gerencia_alunos" on alunos for all using (tem_permissao('gerenciar_alunos'));
-- Quem só vende (ex: professor) precisa listar alunos pra vincular o nome do cliente na venda — leitura básica.
create policy "vendedor_ve_nomes_alunos" on alunos for select using (tem_permissao('registrar_venda'));

-- GRADUAÇÕES
create policy "staff_ve_graduacoes" on graduacoes for select using (tem_permissao('gerenciar_alunos'));
create policy "aluno_ve_proprias_graduacoes" on graduacoes for select using (
  aluno_id in (select id from alunos where perfil_id = auth.uid())
);
create policy "staff_gerencia_graduacoes" on graduacoes for all using (tem_permissao('gerenciar_alunos'));

-- TURMAS (visível a todos os logados)
create policy "todos_veem_turmas" on turmas for select using (auth.uid() is not null);
create policy "staff_gerencia_turmas" on turmas for all using (tem_permissao('gerenciar_alunos'));

-- MATRÍCULAS
create policy "staff_ve_matriculas" on matriculas for select using (tem_permissao('gerenciar_alunos'));
create policy "aluno_ve_propria_matricula" on matriculas for select using (
  aluno_id in (select id from alunos where perfil_id = auth.uid())
);
create policy "staff_gerencia_matriculas" on matriculas for all using (tem_permissao('gerenciar_alunos'));

-- PRESENÇAS
create policy "staff_ve_presencas" on presencas for select using (tem_permissao('gerenciar_alunos'));
create policy "aluno_ve_propria_presenca" on presencas for select using (
  aluno_id in (select id from alunos where perfil_id = auth.uid())
);
create policy "staff_gerencia_presencas" on presencas for all using (tem_permissao('fazer_checkin'));

-- FINANCEIRO
create policy "quem_ve_financeiro_ve_planos" on planos for select using (auth.uid() is not null);
create policy "financeiro_gerencia_planos" on planos for all using (tem_permissao('gerenciar_financeiro'));

create policy "financeiro_ve_mensalidades" on mensalidades for select using (tem_permissao('ver_financeiro'));
create policy "aluno_ve_propria_mensalidade" on mensalidades for select using (
  aluno_id in (select id from alunos where perfil_id = auth.uid())
);
create policy "financeiro_gerencia_mensalidades" on mensalidades for all using (tem_permissao('gerenciar_financeiro'));

create policy "financeiro_ve_contas" on contas_financeiras for select using (tem_permissao('ver_financeiro'));
create policy "financeiro_gerencia_contas" on contas_financeiras for all using (tem_permissao('gerenciar_financeiro'));
-- Quem vende precisa ver as contas ativas pra escolher onde o dinheiro da venda entra.
create policy "vendedor_ve_contas" on contas_financeiras for select using (tem_permissao('registrar_venda'));

create policy "logados_veem_categorias" on categorias_financeiras for select using (auth.uid() is not null);
create policy "financeiro_gerencia_categorias" on categorias_financeiras for all using (tem_permissao('gerenciar_financeiro'));

create policy "logados_veem_centros_custo" on centros_custo for select using (auth.uid() is not null);
create policy "financeiro_gerencia_centros_custo" on centros_custo for all using (tem_permissao('gerenciar_financeiro'));

create policy "financeiro_ve_recorrencias" on recorrencias_financeiras for select using (tem_permissao('ver_financeiro'));
create policy "financeiro_gerencia_recorrencias" on recorrencias_financeiras for all using (tem_permissao('gerenciar_financeiro'));

create policy "financeiro_ve_lancamentos" on lancamentos_financeiros for select using (tem_permissao('ver_financeiro'));
create policy "financeiro_gerencia_lancamentos" on lancamentos_financeiros for all using (tem_permissao('gerenciar_financeiro'));

create policy "financeiro_ve_movimentacoes" on movimentacoes_financeiras for select using (tem_permissao('ver_financeiro'));
create policy "financeiro_gerencia_movimentacoes" on movimentacoes_financeiras for all using (tem_permissao('gerenciar_financeiro'));

create policy "financeiro_ve_ajustes_saldo" on ajustes_saldo_conta for select using (tem_permissao('ver_financeiro'));
create policy "financeiro_gerencia_ajustes_saldo" on ajustes_saldo_conta for all using (tem_permissao('gerenciar_financeiro'));

create policy "financeiro_ve_auditoria" on auditoria_financeira for select using (tem_permissao('ver_financeiro'));
create policy "sistema_grava_auditoria" on auditoria_financeira for insert with check (auth.uid() is not null);

-- PRODUTOS / FORNECEDORES
create policy "logados_veem_produtos_ativos" on produtos for select using (auth.uid() is not null);
create policy "estoque_gerencia_produtos" on produtos for all using (tem_permissao('gerenciar_produtos'));
-- registrar_venda_produtos() já decrementa estoque via SECURITY DEFINER, então quem só vende
-- não precisa de permissão direta de update aqui — só a policy de select acima.

create policy "logados_veem_fornecedores" on fornecedores for select using (auth.uid() is not null);
create policy "estoque_gerencia_fornecedores" on fornecedores for all using (tem_permissao('gerenciar_produtos'));

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

-- Categoria usada pela venda de produtos (PDV) — precisa existir para o
-- lançamento de receita da venda ter uma categoria.
insert into categorias_financeiras (nome, tipo) values ('Produtos/Loja', 'receita');
