-- ================================================================
-- MEMÓRIA COMERCIAL — schema SQL de referência (Postgres/Supabase)
-- ================================================================
-- Rascunho de projeto, NÃO é uma migração deste repositório.
-- Serve como especificação do modelo de dados dos docs 02–04.
-- ================================================================

-- ----------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------
CREATE TYPE automation_level AS ENUM (
  'observacao',   -- fase 0: IA só observa
  'copiloto',     -- nível 1: IA sugere, humano envia
  'supervisionado',-- nível 2: IA envia nos gatilhos, humano supervisiona
  'autonomo'      -- nível 3: IA conduz o ciclo de recompra
);

CREATE TYPE radar_state AS ENUM (
  'confirmado',     -- 🟢 pedido do ciclo registrado
  'contato_devido', -- 🟡 dia típico de contato, sem pedido
  'em_risco',       -- 🔴 passou do momento habitual de confirmação
  'fora_de_ciclo',  -- ⚪ próximo pedido ainda longe
  'esfriando',      -- ⚫ >2 ciclos sem comprar
  'sem_historico'   -- pedidos insuficientes para prever
);

CREATE TYPE wa_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE wa_author    AS ENUM ('cliente', 'humano', 'ia');
CREATE TYPE wa_msg_status AS ENUM ('enviada', 'entregue', 'lida', 'falhou');

CREATE TYPE reply_class AS ENUM (
  'confirmou', 'adiou', 'objecao', 'reclamacao',
  'pergunta', 'sem_intencao', 'nao_classificada'
);

CREATE TYPE suggestion_status AS ENUM (
  'pendente', 'aprovada', 'editada_e_enviada', 'enviada_auto',
  'descartada', 'expirada'
);

CREATE TYPE outcome AS ENUM ('pedido', 'sem_pedido', 'adiado', 'escalado');

CREATE TYPE fact_source AS ENUM ('extracao_ia', 'humano', 'importacao');

-- ----------------------------------------------------------------
-- CLIENTES E CONTATOS
-- ----------------------------------------------------------------
CREATE TABLE customers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,              -- "Padaria X"
  segment          TEXT,                       -- padaria, mercado, lanchonete…
  city             TEXT,
  region           TEXT,                       -- p/ rota de entrega
  automation_level automation_level NOT NULL DEFAULT 'observacao',
  never_automate   BOOLEAN NOT NULL DEFAULT false, -- cliente sensível: trava no copiloto
  do_not_contact   BOOLEAN NOT NULL DEFAULT false, -- opt-out: bloqueia TODO envio proativo
  account_owner    UUID,                       -- vendedor responsável
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customer_contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                 -- "João"
  wa_phone      TEXT NOT NULL UNIQUE,          -- E.164
  is_decision_maker BOOLEAN NOT NULL DEFAULT false,
  opt_in_at     TIMESTAMPTZ,                   -- consentimento p/ contato proativo
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- WHATSAPP: CONVERSAS E MENSAGENS (eventos imutáveis)
-- ----------------------------------------------------------------
CREATE TABLE wa_conversations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                UUID NOT NULL REFERENCES customer_contacts(id),
  -- reservado p/ migração futura à API oficial (janela de 24h);
  -- sem uso no gateway não oficial (doc 05)
  service_window_expires_at TIMESTAMPTZ,
  assigned_to_human         UUID,              -- null = IA/fila
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wa_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES wa_conversations(id),
  wa_message_id   TEXT UNIQUE,                 -- id do provedor (idempotência)
  direction       wa_direction NOT NULL,
  author          wa_author NOT NULL,
  body            TEXT,
  template_name   TEXT,                        -- preenchido se saiu por template
  status          wa_msg_status,
  reply_class     reply_class,                 -- classificação IA (inbound)
  suggestion_id   UUID,                        -- rastreio: qual sugestão originou (outbound IA)
  raw_payload     JSONB,                       -- webhook bruto, reprocessável
  sent_at         TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON wa_messages (conversation_id, sent_at);

-- ----------------------------------------------------------------
-- PEDIDOS (a verdade estruturada)
-- ----------------------------------------------------------------
CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id),
  total         NUMERIC(10,2) NOT NULL,
  confirmed_at  TIMESTAMPTZ NOT NULL,          -- quando o cliente confirmou
  delivery_date DATE,                          -- ex.: a sexta da rota
  channel       TEXT NOT NULL DEFAULT 'whatsapp',
  confirmed_via wa_author,                     -- humano ou ia fechou?
  conversation_id UUID REFERENCES wa_conversations(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON orders (customer_id, confirmed_at);

CREATE TABLE order_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product   TEXT NOT NULL,
  qty       NUMERIC(10,2) NOT NULL,
  unit      TEXT NOT NULL DEFAULT 'pacote',
  unit_price NUMERIC(10,2)
);

-- ----------------------------------------------------------------
-- FATOS COMPORTAMENTAIS (extraídos das conversas)
-- ----------------------------------------------------------------
CREATE TABLE customer_facts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  fact_type    TEXT NOT NULL,   -- estilo_comunicacao | decisor | gatilho_fechamento |
                                -- horario_resposta | precisa_lembrete | sinal_compra …
  value        TEXT NOT NULL,   -- "prefere conversa curta e informal"
  confidence   NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  source       fact_source NOT NULL DEFAULT 'extracao_ia',
  evidence_message_ids UUID[],  -- mensagens que evidenciam o fato
  confirmed_by UUID,            -- correção/confirmação humana vale mais
  last_reinforced_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- fatos envelhecem
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON customer_facts (customer_id, fact_type);

-- ----------------------------------------------------------------
-- ESTATÍSTICAS DERIVADAS (recalculadas a cada pedido — nunca digitadas)
-- ----------------------------------------------------------------
CREATE TABLE customer_purchase_stats (
  customer_id          UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  order_count          INT NOT NULL DEFAULT 0,
  cycle_days_median    NUMERIC(5,1),   -- ciclo mediano entre pedidos
  cycle_days_mad       NUMERIC(5,1),   -- desvio absoluto mediano
  typical_order_dow    INT,            -- 0-6, dia típico de entrega
  typical_confirm_dow  INT,            -- dia típico de CONFIRMAÇÃO
  typical_confirm_hour INT,            -- hora típica (ex.: 8h-10h → 9)
  confirm_lead_days    NUMERIC(4,1),   -- confirma N dias antes da entrega
  qty_median           NUMERIC(10,2),
  ticket_avg           NUMERIC(10,2),
  ticket_trend         TEXT,           -- crescendo | estavel | caindo
  weekly_buy_rate      NUMERIC(4,3),   -- fração de ciclos com compra (o "87%")
  last_order_at        TIMESTAMPTZ,
  next_expected_at     DATE,           -- last_order + ciclo mediano
  computed_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- RADAR DE PEDIDOS (snapshot diário imutável + estado corrente)
-- ----------------------------------------------------------------
CREATE TABLE radar_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_on DATE NOT NULL UNIQUE,
  customers_analyzed INT NOT NULL,
  revenue_at_risk    NUMERIC(12,2) NOT NULL,  -- "Potencial de pedidos faltantes"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE radar_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id  UUID NOT NULL REFERENCES radar_snapshots(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES customers(id),
  state        radar_state NOT NULL,
  expected_qty NUMERIC(10,2),
  expected_value NUMERIC(10,2),
  buy_probability NUMERIC(4,3),
  reason       TEXT,             -- explicável: "confirma qui 8h-10h; qui 14h sem pedido"
  -- preenchidos depois, p/ medir qualidade do radar:
  action_taken  BOOLEAN NOT NULL DEFAULT false,
  final_outcome outcome,
  UNIQUE (snapshot_id, customer_id)
);
CREATE INDEX ON radar_entries (snapshot_id, state);

-- ----------------------------------------------------------------
-- PLAYBOOK: DNA comercial da empresa (doc 04)
-- ----------------------------------------------------------------
CREATE TABLE playbook_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  situation     TEXT NOT NULL,   -- "cliente atrasado no ciclo, relação informal"
  approach      TEXT NOT NULL,   -- "lembrete curto citando a rota de entrega"
  example_message TEXT,
  learned_from  UUID,            -- vendedor de origem (Beid, André, Henriette…)
  times_used    INT NOT NULL DEFAULT 0,
  times_converted INT NOT NULL DEFAULT 0,   -- success_rate = converted/used
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- SUGESTÕES DE ABORDAGEM (nível 1+) — cada uma é dado de treino
-- ----------------------------------------------------------------
CREATE TABLE outreach_suggestions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID NOT NULL REFERENCES customers(id),
  radar_entry_id UUID REFERENCES radar_entries(id),
  playbook_id    UUID REFERENCES playbook_entries(id),
  draft_message  TEXT NOT NULL,   -- o que a IA sugeriu
  sent_message   TEXT,            -- o que foi de fato enviado (diff = treino)
  status         suggestion_status NOT NULL DEFAULT 'pendente',
  approved_by    UUID,            -- humano que aprovou/editou (null se auto)
  final_outcome  outcome,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- HANDOFF IA → HUMANO (doc 04, gatilhos de escalação)
-- ----------------------------------------------------------------
CREATE TABLE handoff_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES wa_conversations(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  reason          TEXT NOT NULL,  -- reclamacao | desconto | qtd_fora_padrao |
                                  -- sentimento_negativo | baixa_confianca | pediu_pessoa
  trigger_message_id UUID REFERENCES wa_messages(id),
  claimed_by      UUID,           -- humano que assumiu
  claimed_at      TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- BIBLIOTECA DE TEMPLATES — reservada p/ migração futura à API
-- oficial; sem uso no gateway não oficial (doc 05)
-- ----------------------------------------------------------------
CREATE TABLE wa_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,          -- nome registrado na Meta
  category      TEXT NOT NULL,                 -- utility | marketing
  body          TEXT NOT NULL,                 -- "Olá {{1}}! Vou fechar sua entrega…"
  meta_status   TEXT NOT NULL DEFAULT 'pendente', -- aprovado | rejeitado | pendente
  purpose       TEXT,                          -- lembrete_ciclo | reativacao | confirmacao
  times_sent    INT NOT NULL DEFAULT 0,
  times_replied INT NOT NULL DEFAULT 0,        -- taxa de resposta por template
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
