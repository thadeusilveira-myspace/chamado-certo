-- ================================================================
-- FASE 4 — Camada de IA: playbook comercial, sugestões de abordagem
-- e extração de fatos com evidência (docs 04 do blueprint)
-- ================================================================

CREATE TYPE public.suggestion_status AS ENUM (
  'pendente', 'aprovada', 'editada_e_enviada', 'enviada_auto', 'descartada'
);

-- Evidência dos fatos extraídos por IA: quais mensagens sustentam o fato
ALTER TABLE public.customer_facts
  ADD COLUMN IF NOT EXISTS evidence_message_ids UUID[] DEFAULT NULL;

-- ----------------------------------------------------------------
-- PLAYBOOK: DNA comercial da empresa (abordagens que funcionam)
-- ----------------------------------------------------------------
CREATE TABLE public.playbook_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  situation       TEXT NOT NULL,   -- "cliente atrasado no ciclo, relação informal"
  approach        TEXT NOT NULL,   -- "lembrete curto citando a rota de entrega"
  example_message TEXT,
  learned_from    TEXT,            -- de quem veio (Beid, André, Henriette…)
  times_used      INT NOT NULL DEFAULT 0,
  times_converted INT NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playbook_entries TO authenticated;
GRANT ALL ON public.playbook_entries TO service_role;
ALTER TABLE public.playbook_entries ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- SUGESTÕES DE ABORDAGEM GERADAS POR IA
-- draft vs. enviado = dado de treino (diferença alimenta o playbook)
-- ----------------------------------------------------------------
CREATE TABLE public.outreach_suggestions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  radar_state   public.radar_state,
  draft_message TEXT NOT NULL,
  rationale     TEXT,
  sent_message  TEXT,
  status        public.suggestion_status NOT NULL DEFAULT 'pendente',
  approved_by   UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.outreach_suggestions TO authenticated;
GRANT ALL ON public.outreach_suggestions TO service_role;
ALTER TABLE public.outreach_suggestions ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.outreach_suggestions (customer_id, created_at DESC);

-- RLS: mesmo padrão da equipe
CREATE POLICY "playbook_team" ON public.playbook_entries FOR ALL TO authenticated
  USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "suggestions_team" ON public.outreach_suggestions FOR ALL TO authenticated
  USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
