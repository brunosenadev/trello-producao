# Sisplan

Aplicação de gestão de projetos com tarefas diárias recorrentes e controle
financeiro entre contratante e funcionário. Construída para rodar 100% em
serverless na Vercel — sem servidor persistente, sem cron obrigatório, sem
filesystem local.

## Stack

- **Next.js 16** (App Router) + TypeScript, Server Actions para a maior
  parte das mutações
- **Tailwind CSS + shadcn/ui** (Base UI) para a interface
- **Neon Postgres** (serverless) como banco de dados
- **Drizzle ORM** — cliente via `@neondatabase/serverless` `Pool`
  (WebSocket), necessário para transações interativas reais (`SELECT ...
  FOR UPDATE`) que garantem que uma tarefa nunca gere pagamento duplicado
- **Auth.js (NextAuth) v5** com Google OAuth, sessão via JWT

## Conceitos principais

- **Template vs. ocorrência**: cada tarefa recorrente tem um **template**
  permanente (título, instruções, checklist, valor, frequência). Ao abrir
  uma data em um projeto, o sistema garante (via `INSERT ... ON CONFLICT DO
  NOTHING`, idempotente) que exista uma **ocorrência** daquele dia para cada
  template ativo elegível, com sua própria cópia do checklist e o valor
  congelado no momento da criação. Não há cron: a geração acontece sob
  demanda, na primeira vez que alguém acessa a data.
- **Financeiro em ledger**: não existe uma coluna "saldo". Toda movimentação
  (adiantamento, tarefa concluída) vira uma linha em
  `financial_transactions`, e o saldo é sempre a soma dessas linhas.
  Adiantamento soma ao saldo, tarefa concluída subtrai (o trabalho "consome"
  o adiantamento); se o saldo ficar negativo, significa que já foi gerado
  mais valor do que o adiantado — ou seja, há um valor a pagar ao
  funcionário.
- **Timezone**: toda regra de "qual é o dia de hoje" é calculada no servidor
  usando `America/Sao_Paulo` fixo (o Brasil não usa mais horário de verão
  desde 2019), nunca o relógio do navegador.

## Rodando localmente

### 1. Pré-requisitos

- Node.js 20+
- Uma conta no [Neon](https://console.neon.tech) (banco Postgres serverless
  gratuito)
- Um projeto no [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  com credenciais OAuth 2.0 (tipo "Web application")

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

- `DATABASE_URL`: connection string do Neon (use a versão "pooled")
- `AUTH_SECRET`: gere com `npx auth secret`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: do Google Cloud Console.
  Configure o redirect URI `http://localhost:3000/api/auth/callback/google`
- `CONTRATANTE_EMAIL` / `FUNCIONARIO_EMAIL`: os e-mails Gmail de cada
  pessoa — são a allowlist que define o papel de cada uma no primeiro login

### 3. Instalar dependências e criar o schema no banco

```bash
npm install
npm run db:push   # aplica o schema diretamente no Neon (bom para começar)
# ou, se preferir versionar migrations:
npm run db:generate && aplique o SQL gerado em drizzle/ manualmente
```

### 4. Rodar

```bash
npm run dev
```

Acesse `http://localhost:3000`, faça login com uma das contas configuradas
em `CONTRATANTE_EMAIL`/`FUNCIONARIO_EMAIL`.

## Deploy na Vercel

1. Suba o projeto para um repositório Git e importe-o na Vercel.
2. Configure as mesmas variáveis de ambiente do `.env.example` em
   **Project Settings → Environment Variables**.
3. Adicione também o redirect URI de produção no Google Cloud Console:
   `https://SEU-DOMINIO.vercel.app/api/auth/callback/google`.
4. Rode `npm run db:push` (localmente, apontando `DATABASE_URL` para o
   banco de produção) antes do primeiro deploy, para criar as tabelas.
5. Deploy. Não há configuração especial de build — é um app Next.js padrão.

## Scripts

- `npm run dev` — desenvolvimento local
- `npm run build` / `npm run start` — build e execução de produção
- `npm run lint` — ESLint
- `npm run db:generate` — gera um arquivo de migration SQL a partir do
  schema (`lib/db/schema.ts`)
- `npm run db:push` — aplica o schema atual diretamente no banco (sem
  gerar arquivo de migration; bom para desenvolvimento)
- `npm run db:studio` — abre o Drizzle Studio para inspecionar o banco

## Estrutura

```
app/(app)/...        páginas autenticadas (dashboard, projetos, calendário,
                      financeiro, histórico, configurações)
app/login             tela de login
app/api/video/...     API de thumbnail (YouTube) e proxy de download
lib/db/schema.ts      schema Drizzle (fonte da verdade do banco)
lib/occurrences.ts     geração idempotente de ocorrências por data
lib/finance.ts         conclusão de tarefa + ledger financeiro (transacional)
lib/auth.ts             config do Auth.js (Google, papéis)
lib/actions/            Server Actions (mutações)
lib/queries/             leituras usadas pelas páginas
proxy.ts                 protege as rotas autenticadas (antigo middleware.ts)
```

## Limitações conhecidas / próximos passos

A arquitetura foi pensada para não impedir, mas a implementação atual não
inclui ainda: múltiplos funcionários por projeto, notificações, anexos,
comentários, upload de arquivos, exportação para Excel/PDF, e uma tela
dedicada para registrar pagamentos avulsos (o tipo `PAYMENT` já existe no
schema para isso).
