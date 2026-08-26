# GB · Sistema — Gestão de Academia (MVP Fase 1)

Sistema de gestão para academia de jiu-jitsu: alunos, check-in de aula e financeiro (mensalidades).
Construído em React + TypeScript + Vite + Tailwind + Supabase (Postgres + Auth + RLS).

## ⚠️ Modo demonstração (ativo agora)

O sistema está rodando em **modo demo**: login fixo e dados fictícios em memória, sem precisar configurar Supabase. Ideal para mostrar pro cliente antes de existir um banco de dados real.

- **Login:** `admin@graciebarra.com.br`
- **Senha:** `graciebarra2026`
- Já vem preenchido na tela de login — é só clicar em Entrar.
- Esse login é o **administrador**: acessa tudo, inclusive a tela de **Administração**, onde dá pra criar novos usuários (professores, outros admins) e configurar exatamente o que cada papel pode fazer no sistema.
- Já existe um segundo usuário de exemplo com papel de professor: `rafael@graciebarra.com.br` / `professor2026` — bom para mostrar pro cliente como fica a visão de quem não é admin (sem acesso a Financeiro/Administração, por padrão).
- Os dados (alunos, mensalidades, check-ins, usuários, permissões) ficam **só na memória**: qualquer alteração feita na demo some ao fechar o app. Isso é esperado — é uma demonstração, não o banco real.

## Administração de usuários e permissões

Na tela **Administração** (menu lateral, visível só para quem tem a permissão `gerenciar_usuarios`):

- **Usuários**: lista todos os usuários, permite criar um novo (nome, e-mail, senha, papel) e ativar/desativar existentes
- **Permissões por papel**: uma matriz com checkboxes — cada linha é uma função do sistema (ver painel, gerenciar alunos, fazer check-in, ver financeiro, marcar mensalidade como paga, gerenciar usuários), cada coluna é um papel (Administrador / Professor / Aluno). Marcar ou desmarcar muda na hora o que aquele papel enxerga no menu lateral e pode fazer nas páginas — inclusive pra quem já está logado.

Isso já está pronto pra virar permissão real no Supabase mais adiante: a estrutura (`Usuario`, `PermissionKey`, `MatrizPermissoes` em `src/types/index.ts`) foi desenhada para virar tabelas (`usuarios`, `permissoes_por_papel`) sem precisar redesenhar a lógica das telas.

### Como desligar o modo demo (quando for usar de verdade)

Em `src/lib/auth.tsx`, troque:

```ts
export const DEMO_MODE = true
```

para

```ts
export const DEMO_MODE = false
```

A partir daí o login volta a validar contra o Supabase Auth de verdade, e as páginas (Alunos, Check-in, Financeiro) precisam ser reconectadas às consultas Supabase — hoje elas leem de `src/lib/demoStore.tsx`. Aviso pra não esquecer: aí é onde entra o trabalho de "ligar" o banco real.

## O que já está pronto (Fase 1)

- **Alunos**: cadastro, listagem, busca, faixa/grau atual
- **Check-in**: marcar presença do dia por aluno, com contador
- **Financeiro**: mensalidades por status (pendente/atrasado/pago), marcar como pago
- **Painel**: KPIs do dia (alunos ativos, check-ins hoje, atrasados, receita do mês)
- **Autenticação**: login demo fixo agora; Supabase Auth já implementado e pronto pra ligar (basta `DEMO_MODE = false`)
- **Permissões (RLS)**: admin e professor têm acesso operacional; aluno (fases seguintes) só vê os próprios dados

## O que vem depois (conforme roadmap combinado)

- Fase 2: App do aluno (login próprio, progresso de faixa, check-in, financeiro pessoal)
- Fase 3: App do professor (chamada por turma, avaliação técnica, aprovação de graduação)
- Fase 4: Notificações, relatórios, branding customizável por unidade

## Como rodar

### 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (gratuito para começar)
2. No **SQL Editor**, cole e rode o conteúdo de `supabase/schema.sql` — isso cria todas as tabelas, políticas de segurança (RLS) e o currículo padrão de faixas
3. Em **Project Settings → API**, copie a `Project URL` e a chave `anon public`

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha `.env` com a URL e a chave anon copiadas no passo anterior.

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

### 4. Criar o primeiro usuário (admin)

O cadastro de usuário ainda não tem tela própria nesta fase (é feito 1x manualmente). No Supabase:

1. Vá em **Authentication → Users → Add user** e crie com e-mail/senha
2. Copie o `UUID` do usuário criado
3. No **SQL Editor**, rode:

```sql
insert into perfis (id, nome, role)
values ('COLE_O_UUID_AQUI', 'Seu Nome', 'admin');
```

Pronto — esse e-mail/senha já loga no sistema como admin.

### 5. Cadastrar planos e gerar mensalidades

O MVP assume que mensalidades são geradas a partir de um plano. Cadastre ao menos um plano direto no SQL Editor por enquanto:

```sql
insert into planos (nome, valor, periodicidade) values ('Mensal ilimitado', 180.00, 'mensal');
```

A geração automática de mensalidade recorrente (ex: todo dia 5) fica para a Fase 1.5 — hoje é possível inserir mensalidades manualmente pela tabela no Supabase enquanto validamos o fluxo com a academia.

## Gerar o executável (.exe) para Windows

O sistema roda como app desktop via Electron, no mesmo modelo do JUCADIESEL.

1. Preencha o `.env` (passo 2 acima) — as credenciais do Supabase vão embutidas no build
2. Rode:

```bash
npm install
npm run dist
```

Isso gera `release/GB Sistema Setup X.X.X.exe` — um instalador NSIS completo (ícone, atalho na área de trabalho, desinstalador). Distribua esse `.exe` para os computadores da academia.

Para testar sem gerar o instalador (mais rápido, durante desenvolvimento):

```bash
npm run electron:dev
```

Isso abre o app numa janela Electron apontando pro servidor de desenvolvimento (`vite`).

**Observação importante:** o app continua dependendo de internet — ele conversa com o Supabase pela nuvem, então cada estação com o `.exe` instalado precisa estar online. Não há dados salvos localmente na máquina.

## Deploy na Vercel (acesso web + celular)

O app já está pronto pra isso: usa `HashRouter` (rotas tipo `#/financeiro`), então não precisa de nenhuma configuração especial de rewrite no servidor — qualquer hospedagem estática funciona, incluindo Vercel no plano gratuito.

**Passo a passo:**

1. Crie um repositório no GitHub e suba o código:
   ```bash
   git init
   git add .
   git commit -m "GB Sistema"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/gb-sistema.git
   git push -u origin main
   ```
2. Entre em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe esse repositório.
3. A Vercel detecta automaticamente que é um projeto Vite — não precisa mudar nada em "Build Command" nem "Output Directory" (`npm run build` e `dist`, respectivamente, já vêm certos).
4. Se for continuar em **modo demo** (login fixo, sem Supabase real), pode clicar direto em **Deploy** — funciona sem nenhuma variável de ambiente.
5. Se for ligar o Supabase de verdade (`DEMO_MODE = false` em `src/lib/auth.tsx`), adicione antes do deploy, em **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Pronto — a Vercel te dá uma URL tipo `gb-sistema.vercel.app`, acessível de qualquer navegador, inclusive do celular. Cada `git push` depois disso já republica automaticamente.

**Sobre o uso no celular:** a interface já foi ajustada pra isso — a barra lateral vira um menu retrátil (☰) em telas pequenas, e os cartões do painel se reorganizam em colunas menores. Algumas tabelas mais densas do módulo financeiro (com muitas colunas) podem exigir rolar horizontalmente num aparelho bem estreito — é esperado, não é bug.

## Estrutura

```
src/
  lib/          # supabase client, auth context
  types/        # tipos compartilhados
  components/   # Layout, Faixa (badge visual de faixa/grau)
  pages/        # Login, Dashboard, Alunos, CheckIn, Financeiro
supabase/
  schema.sql    # schema completo + RLS + seed do currículo de faixas
```
