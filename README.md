# D'GUST — Continuidade Comercial

Sistema de continuidade comercial via WhatsApp: **memória comercial por
cliente + Radar de Pedidos**. Transforma o conhecimento tácito do pós-venda
("quem compra, quando, quanto, como abordar") em um ativo de dados da empresa.

> Blueprint completo em [`docs/continuidade-comercial/`](docs/continuidade-comercial/00-visao-geral.md).

## O que já está funcionando (MVP — Fases 1–3 do roadmap)

- **Radar de Pedidos**: painel diário 🔴🟡🟢⚪ calculado a partir dos pedidos
  registrados (ciclo mediano, dia típico de confirmação, ticket médio),
  com potencial de receita faltante e sugestão de abordagem pronta por cliente.
- **Carteira de clientes**: cadastro, contatos de WhatsApp, fatos
  comportamentais (a "entrevista com a vendedora" vira dado), nível de
  automação e opt-out por cliente.
- **Registro de pedidos**: 10 segundos por pedido; as estatísticas e o radar
  recalculam automaticamente (trigger no Postgres).
- **Conversas**: inbox alimentado pelo webhook da Evolution API (gateway
  não oficial — decisão registrada no doc 05), com envio pelo sistema.
- **Equipe**: primeiro usuário cadastrado vira admin; os demais aguardam
  aprovação (protege a URL pública).

## Stack

- **Frontend**: Vite + React + TanStack Router/Query + Tailwind (SPA)
- **Banco/Auth**: Supabase (Postgres com RLS; radar calculado em SQL)
- **Serverless**: funções Vercel em `/api` (webhook + envio via gateway)
- **WhatsApp**: Evolution API self-hosted (ver riscos e mitigação no doc 05)

## Deploy (≈ 10 minutos)

### 1. Supabase (banco + auth)

1. Crie um projeto em [supabase.com](https://supabase.com) (plano gratuito serve).
2. No **SQL Editor**, cole e execute o conteúdo de
   [`supabase/migrations/20260807000001_dgust_continuidade.sql`](supabase/migrations/20260807000001_dgust_continuidade.sql).
3. (Opcional, para demonstração) execute também [`supabase/seed.sql`](supabase/seed.sql)
   — cria clientes fictícios para o radar exibir todos os estados.
4. Em **Settings → API**, copie: `Project URL`, `anon public key` e
   `service_role key`.
5. Em **Authentication → Providers → Email**: para uso interno, você pode
   desativar "Confirm email" e facilitar o primeiro acesso.

### 2. Vercel (app + funções)

1. Importe este repositório no [vercel.com](https://vercel.com/new)
   (branch `claude/whatsapp-business-continuity-nvrxos`, framework: **Vite** — detectado automaticamente).
2. Em **Environment Variables**, configure (ver `.env.example`):
   - `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
   - `EVOLUTION_WEBHOOK_TOKEN` (invente um token longo)
   - `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`
     (opcionais — sem eles o envio direto fica desativado; copiar mensagem e
     abrir no WhatsApp continuam funcionando)
3. Deploy. Acesse a URL, **crie sua conta — o primeiro usuário vira admin**.

### 3. Evolution API (gateway WhatsApp — quando for conectar o número)

1. Suba uma instância da [Evolution API](https://doc.evolution-api.com/) em uma
   VPS própria e conecte o número via QR code.
2. Configure o webhook da instância para:
   `https://SEU-APP.vercel.app/api/evolution-webhook?token=SEU_EVOLUTION_WEBHOOK_TOKEN`
   com o evento `MESSAGES_UPSERT` habilitado.
3. Pronto: toda mensagem (dos dois lados, inclusive as enviadas pelo celular)
   passa a alimentar o inbox e a memória comercial.

> ⚠️ Gateway não oficial viola os termos do WhatsApp; o risco de banimento do
> número foi assumido como decisão de negócio. Antes de ativar envios pelo
> sistema, leia as mitigações do
> [doc 05](docs/continuidade-comercial/05-whatsapp-plataforma.md) —
> em especial: só contatar clientes existentes, limites de insistência e
> opt-out absoluto.

## Desenvolvimento local

```bash
npm install
cp .env.example .env   # preencha com as chaves do Supabase
npm run dev            # http://localhost:5173
npm run typecheck
npm run build
```

As funções `/api` rodam apenas no Vercel (ou via `vercel dev`).

## Estrutura

```
api/                       funções serverless (webhook Evolution, envio)
docs/continuidade-comercial/  blueprint completo do sistema (docs 00–06 + SQL)
src/routes/                telas: radar, clientes, pedidos, conversas, equipe
src/lib/radar.ts           domínio do radar (estados, sugestão de abordagem)
supabase/migrations/       schema: memória comercial + radar em SQL
supabase/seed.sql          dados de demonstração (opcional)
```

## Roadmap

Este MVP cobre as Fases 1–3 do [roadmap](docs/continuidade-comercial/06-roadmap.md).
Próximas fases: extração de fatos por IA a partir das conversas, playbook
comercial (DNA D'GUST) e níveis de automação 2–3.
