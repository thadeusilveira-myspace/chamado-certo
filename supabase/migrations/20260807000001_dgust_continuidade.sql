-- ================================================================
-- D'GUST CONTINUIDADE COMERCIAL — schema inicial
-- Memória comercial + radar de pedidos + gateway WhatsApp
-- (blueprint em docs/continuidade-comercial/)
-- ================================================================

-- ----------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('operador', 'admin');

CREATE TYPE public.automation_level AS ENUM (
  'observacao', 'copiloto', 'supervisionado', 'autonomo'
);

CREATE TYPE public.radar_state AS ENUM (
  'confirmado', 'contato_devido', 'em_risco',
  'fora_de_ciclo', 'esfriando', 'sem_historico'
);

CREATE TYPE public.wa_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE public.wa_author    AS ENUM ('cliente', 'humano', 'ia');
CREATE TYPE public.fact_source  AS ENUM ('extracao_ia', 'humano', 'importacao');

-- ----------------------------------------------------------------
-- EQUIPE (perfis + papéis)
-- ----------------------------------------------------------------
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;

-- membro da equipe = tem qualquer papel
CREATE OR REPLACE FUNCTION public.is_team(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;
REVOKE EXECUTE ON FUNCTION public.is_team(UUID) FROM PUBLIC, anon, authenticated;

-- Primeiro usuário cadastrado vira admin; os demais aguardam aprovação
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------
-- CLIENTES E CONTATOS
-- ----------------------------------------------------------------
CREATE TABLE public.customers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  segment          TEXT,
  city             TEXT,
  region           TEXT,
  automation_level public.automation_level NOT NULL DEFAULT 'observacao',
  never_automate   BOOLEAN NOT NULL DEFAULT false,
  do_not_contact   BOOLEAN NOT NULL DEFAULT false,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.customer_contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  wa_phone          TEXT NOT NULL UNIQUE,   -- só dígitos, com DDI (ex.: 5527999998888)
  is_decision_maker BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_contacts TO authenticated;
GRANT ALL ON public.customer_contacts TO service_role;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.customer_contacts (customer_id);

-- ----------------------------------------------------------------
-- WHATSAPP: CONVERSAS E MENSAGENS
-- ----------------------------------------------------------------
CREATE TABLE public.wa_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL UNIQUE REFERENCES public.customer_contacts(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wa_conversations TO authenticated;
GRANT ALL ON public.wa_conversations TO service_role;
ALTER TABLE public.wa_conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wa_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.wa_conversations(id) ON DELETE CASCADE,
  wa_message_id   TEXT UNIQUE,
  direction       public.wa_direction NOT NULL,
  author          public.wa_author NOT NULL,
  body            TEXT,
  raw_payload     JSONB,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.wa_messages TO authenticated;
GRANT ALL ON public.wa_messages TO service_role;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.wa_messages (conversation_id, sent_at DESC);

-- ----------------------------------------------------------------
-- PEDIDOS
-- ----------------------------------------------------------------
CREATE TABLE public.orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  qty_total     NUMERIC(10,2),
  total         NUMERIC(10,2) NOT NULL,
  confirmed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_date DATE,
  channel       TEXT NOT NULL DEFAULT 'whatsapp',
  notes         TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.orders (customer_id, confirmed_at DESC);

-- ----------------------------------------------------------------
-- FATOS COMPORTAMENTAIS
-- ----------------------------------------------------------------
CREATE TABLE public.customer_facts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  fact_type    TEXT NOT NULL,
  value        TEXT NOT NULL,
  confidence   NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  source       public.fact_source NOT NULL DEFAULT 'humano',
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_facts TO authenticated;
GRANT ALL ON public.customer_facts TO service_role;
ALTER TABLE public.customer_facts ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.customer_facts (customer_id);

-- ----------------------------------------------------------------
-- ESTATÍSTICAS DERIVADAS (recalculadas por trigger — nunca editadas)
-- ----------------------------------------------------------------
CREATE TABLE public.customer_purchase_stats (
  customer_id          UUID PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  order_count          INT NOT NULL DEFAULT 0,
  cycle_days_median    NUMERIC(5,1),
  cycle_days_mad       NUMERIC(5,1),
  typical_confirm_dow  INT,
  typical_confirm_hour INT,
  confirm_lead_days    NUMERIC(4,1),
  qty_median           NUMERIC(10,2),
  ticket_avg           NUMERIC(10,2),
  buy_rate             NUMERIC(4,3),
  last_order_at        TIMESTAMPTZ,
  next_expected_on     DATE,
  computed_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.customer_purchase_stats TO authenticated;
GRANT ALL ON public.customer_purchase_stats TO service_role;
ALTER TABLE public.customer_purchase_stats ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.refresh_customer_stats(p_customer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count       INT;
  v_cycle       NUMERIC;
  v_mad         NUMERIC;
  v_last        TIMESTAMPTZ;
  v_qty         NUMERIC;
  v_ticket      NUMERIC;
  v_dow         INT;
  v_hour        INT;
  v_lead        NUMERIC;
  v_buy_rate    NUMERIC;
BEGIN
  SELECT COUNT(*), MAX(confirmed_at) INTO v_count, v_last
  FROM orders WHERE customer_id = p_customer_id;

  IF v_count = 0 THEN
    DELETE FROM customer_purchase_stats WHERE customer_id = p_customer_id;
    RETURN;
  END IF;

  -- ciclo: mediana dos intervalos (em dias) entre os últimos 12 pedidos
  WITH recent AS (
    SELECT confirmed_at FROM orders
    WHERE customer_id = p_customer_id
    ORDER BY confirmed_at DESC LIMIT 12
  ), gaps AS (
    SELECT EXTRACT(EPOCH FROM confirmed_at - LAG(confirmed_at) OVER (ORDER BY confirmed_at)) / 86400.0 AS gap_days
    FROM recent
  ), valid AS (
    SELECT gap_days FROM gaps WHERE gap_days IS NOT NULL AND gap_days >= 1
  )
  SELECT
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gap_days)::numeric, 1)
  INTO v_cycle FROM valid;

  IF v_cycle IS NOT NULL THEN
    WITH recent AS (
      SELECT confirmed_at FROM orders
      WHERE customer_id = p_customer_id
      ORDER BY confirmed_at DESC LIMIT 12
    ), gaps AS (
      SELECT EXTRACT(EPOCH FROM confirmed_at - LAG(confirmed_at) OVER (ORDER BY confirmed_at)) / 86400.0 AS gap_days
      FROM recent
    ), valid AS (
      SELECT gap_days FROM gaps WHERE gap_days IS NOT NULL AND gap_days >= 1
    )
    SELECT ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ABS(gap_days - v_cycle))::numeric, 1)
    INTO v_mad FROM valid;
  END IF;

  SELECT
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY qty_total)::numeric, 2),
    ROUND(AVG(total)::numeric, 2),
    MODE() WITHIN GROUP (ORDER BY EXTRACT(DOW FROM confirmed_at)::int),
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM confirmed_at)::int)
  INTO v_qty, v_ticket, v_dow, v_hour
  FROM orders WHERE customer_id = p_customer_id;

  SELECT ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (delivery_date - confirmed_at::date))::numeric, 1)
  INTO v_lead
  FROM orders
  WHERE customer_id = p_customer_id AND delivery_date IS NOT NULL
    AND delivery_date >= confirmed_at::date;

  -- taxa de compra: pedidos nos últimos 12 ciclos / 12 (aprox. do "87%")
  IF v_cycle IS NOT NULL AND v_cycle > 0 THEN
    SELECT LEAST(1.0, ROUND((COUNT(*) / 12.0)::numeric, 3))
    INTO v_buy_rate
    FROM orders
    WHERE customer_id = p_customer_id
      AND confirmed_at >= now() - (v_cycle * 12 || ' days')::interval;
  END IF;

  INSERT INTO customer_purchase_stats AS s (
    customer_id, order_count, cycle_days_median, cycle_days_mad,
    typical_confirm_dow, typical_confirm_hour, confirm_lead_days,
    qty_median, ticket_avg, buy_rate, last_order_at, next_expected_on, computed_at
  ) VALUES (
    p_customer_id, v_count, v_cycle, v_mad, v_dow, v_hour, v_lead,
    v_qty, v_ticket, v_buy_rate, v_last,
    CASE WHEN v_cycle IS NOT NULL THEN (v_last + (v_cycle || ' days')::interval)::date END,
    now()
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    order_count = EXCLUDED.order_count,
    cycle_days_median = EXCLUDED.cycle_days_median,
    cycle_days_mad = EXCLUDED.cycle_days_mad,
    typical_confirm_dow = EXCLUDED.typical_confirm_dow,
    typical_confirm_hour = EXCLUDED.typical_confirm_hour,
    confirm_lead_days = EXCLUDED.confirm_lead_days,
    qty_median = EXCLUDED.qty_median,
    ticket_avg = EXCLUDED.ticket_avg,
    buy_rate = EXCLUDED.buy_rate,
    last_order_at = EXCLUDED.last_order_at,
    next_expected_on = EXCLUDED.next_expected_on,
    computed_at = EXCLUDED.computed_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.orders_stats_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.refresh_customer_stats(COALESCE(NEW.customer_id, OLD.customer_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER orders_refresh_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_stats_trigger();

-- ----------------------------------------------------------------
-- RADAR DE PEDIDOS (view calculada — sempre atual)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW public.radar_current
WITH (security_invoker = true) AS
SELECT
  c.id AS customer_id,
  c.name,
  c.segment,
  c.automation_level,
  c.do_not_contact,
  s.order_count,
  s.cycle_days_median,
  s.qty_median,
  s.ticket_avg,
  s.buy_rate,
  s.last_order_at,
  s.next_expected_on,
  s.typical_confirm_dow,
  s.typical_confirm_hour,
  s.confirm_lead_days,
  CASE
    WHEN s.customer_id IS NULL OR s.order_count < 3 OR s.cycle_days_median IS NULL
      THEN 'sem_historico'::public.radar_state
    WHEN CURRENT_DATE - s.last_order_at::date >= 2 * s.cycle_days_median
      THEN 'esfriando'::public.radar_state
    WHEN EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.customer_id = c.id
        AND (o.delivery_date >= CURRENT_DATE OR o.confirmed_at >= now() - INTERVAL '2 days')
    ) THEN 'confirmado'::public.radar_state
    WHEN CURRENT_DATE > s.next_expected_on + COALESCE(s.cycle_days_mad, 1)::int
      THEN 'em_risco'::public.radar_state
    WHEN CURRENT_DATE >= s.next_expected_on - COALESCE(s.confirm_lead_days, 1)::int
      THEN 'contato_devido'::public.radar_state
    ELSE 'fora_de_ciclo'::public.radar_state
  END AS state
FROM public.customers c
LEFT JOIN public.customer_purchase_stats s ON s.customer_id = c.id;

GRANT SELECT ON public.radar_current TO authenticated;

-- ----------------------------------------------------------------
-- RLS: qualquer membro da equipe (operador/admin) acessa os dados
-- da carteira; quem se cadastrou mas não foi aprovado não vê nada.
-- ----------------------------------------------------------------
CREATE POLICY "profiles_team_read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_team(auth.uid()));
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "roles_read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_team(auth.uid()));
CREATE POLICY "roles_admin_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "customers_team" ON public.customers FOR ALL TO authenticated
  USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "contacts_team" ON public.customer_contacts FOR ALL TO authenticated
  USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "conversations_team" ON public.wa_conversations FOR ALL TO authenticated
  USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "messages_team" ON public.wa_messages FOR ALL TO authenticated
  USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "orders_team" ON public.orders FOR ALL TO authenticated
  USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "facts_team" ON public.customer_facts FOR ALL TO authenticated
  USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "stats_team" ON public.customer_purchase_stats FOR SELECT TO authenticated
  USING (public.is_team(auth.uid()));
