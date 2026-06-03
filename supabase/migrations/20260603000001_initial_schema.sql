-- CHAMADO CERTO — schema inicial
-- Marketplace de reparos residenciais com garantia de 90 dias

-- ================================================================
-- ENUMS
-- ================================================================
CREATE TYPE public.app_role AS ENUM ('contratante', 'profissional', 'admin');
CREATE TYPE public.professional_status AS ENUM ('pendente', 'aprovado', 'recusado', 'banido');
CREATE TYPE public.service_urgency AS ENUM ('normal', 'urgente');
CREATE TYPE public.service_status AS ENUM (
  'aberta',       -- pedido criado, aguardando orçamentos
  'orcando',      -- profissionais enviando propostas
  'agendada',     -- orçamento aceito, aguardando execução
  'em_andamento', -- profissional fez check-in
  'concluida',    -- profissional fez check-out
  'pago',         -- pagamento processado
  'garantia',     -- claim de garantia aberto
  'finalizada',   -- encerrado
  'cancelada'
);
CREATE TYPE public.quote_status AS ENUM ('pendente', 'aceito', 'recusado', 'expirado');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'processando', 'pago', 'estornado', 'falhou');
CREATE TYPE public.checkin_type AS ENUM ('chegada', 'saida');
CREATE TYPE public.photo_type AS ENUM ('antes', 'durante', 'depois');
CREATE TYPE public.claim_status AS ENUM ('aberta', 'agendada', 'resolvida', 'recusada');

-- ================================================================
-- TABELAS
-- ================================================================

CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  phone      TEXT,
  avatar_url TEXT,
  city       TEXT,
  cpf_hash   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper interno (não exposto)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;

CREATE TABLE public.addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        TEXT,
  street       TEXT NOT NULL,
  number       TEXT,
  complement   TEXT,
  neighborhood TEXT,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL DEFAULT 'ES',
  zip          TEXT,
  lat          NUMERIC(9,6),
  lng          NUMERIC(9,6),
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.service_categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  icon           TEXT,
  description    TEXT,
  base_price_min NUMERIC(10,2),
  base_price_max NUMERIC(10,2),
  active         BOOLEAN NOT NULL DEFAULT true,
  sort_order     INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.service_categories TO anon, authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.professional_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bio               TEXT,
  hourly_rate       NUMERIC(10,2),
  specialties       UUID[] DEFAULT '{}',
  regions           TEXT[] DEFAULT '{}',
  status            public.professional_status NOT NULL DEFAULT 'pendente',
  verified          BOOLEAN NOT NULL DEFAULT false,
  rating_avg        NUMERIC(3,2) NOT NULL DEFAULT 0,
  services_count    INT NOT NULL DEFAULT 0,
  guarantee_days    INT NOT NULL DEFAULT 90,
  response_time_avg INT,
  acceptance_rate   NUMERIC(5,2) NOT NULL DEFAULT 0,
  available         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.professional_profiles TO authenticated;
GRANT SELECT ON public.professional_profiles TO anon;
GRANT ALL ON public.professional_profiles TO service_role;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.service_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id          UUID REFERENCES public.service_categories(id),
  address_id           UUID REFERENCES public.addresses(id),
  title                TEXT NOT NULL,
  description          TEXT,
  urgency              public.service_urgency NOT NULL DEFAULT 'normal',
  status               public.service_status NOT NULL DEFAULT 'aberta',
  preferred_date       TIMESTAMPTZ,
  accepted_quote_id    UUID,
  professional_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quoted_price         NUMERIC(10,2),
  final_price          NUMERIC(10,2),
  platform_fee         NUMERIC(10,2),
  professional_payout  NUMERIC(10,2),
  guarantee_expires_at TIMESTAMPTZ,
  started_at           TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.request_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  type        public.photo_type NOT NULL DEFAULT 'antes',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.request_photos TO authenticated;
GRANT ALL ON public.request_photos TO service_role;
ALTER TABLE public.request_photos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price           NUMERIC(10,2) NOT NULL,
  estimated_hours NUMERIC(4,1),
  message         TEXT,
  scheduled_for   TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  status          public.quote_status NOT NULL DEFAULT 'pendente',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, professional_id)
);
GRANT SELECT, INSERT, UPDATE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.service_requests
  ADD CONSTRAINT fk_accepted_quote FOREIGN KEY (accepted_quote_id) REFERENCES public.quotes(id);

CREATE TABLE public.service_checkins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            public.checkin_type NOT NULL,
  lat             NUMERIC(9,6),
  lng             NUMERIC(9,6),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.service_checkins TO authenticated;
GRANT ALL ON public.service_checkins TO service_role;
ALTER TABLE public.service_checkins ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          UUID NOT NULL UNIQUE REFERENCES public.service_requests(id) ON DELETE CASCADE,
  amount              NUMERIC(10,2) NOT NULL,
  platform_fee        NUMERIC(10,2) NOT NULL,
  professional_payout NUMERIC(10,2) NOT NULL,
  status              public.payment_status NOT NULL DEFAULT 'pendente',
  payment_method      TEXT,
  gateway_id          TEXT,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  rater_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars         INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  punctuality   INT CHECK (punctuality BETWEEN 1 AND 5),
  quality       INT CHECK (quality BETWEEN 1 AND 5),
  communication INT CHECK (communication BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, rater_id)
);
GRANT SELECT ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.warranty_claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  status        public.claim_status NOT NULL DEFAULT 'aberta',
  scheduled_for TIMESTAMPTZ,
  resolved_at   TIMESTAMPTZ,
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.warranty_claims TO authenticated;
GRANT ALL ON public.warranty_claims TO service_role;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.platform_settings (
  id                  INT PRIMARY KEY DEFAULT 1,
  commission_percent  NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  urgency_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  min_price           NUMERIC(10,2) NOT NULL DEFAULT 150.00,
  guarantee_days      INT NOT NULL DEFAULT 90,
  quote_window_hours  INT NOT NULL DEFAULT 4,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.platform_settings (id) VALUES (1);

-- ================================================================
-- SEED: categorias
-- ================================================================
INSERT INTO public.service_categories (name, slug, icon, description, base_price_min, base_price_max, sort_order) VALUES
  ('Elétrica',     'eletrica',    'Zap',        'Instalações, reparos e manutenção elétrica',  200, 1500, 1),
  ('Hidráulica',   'hidraulica',  'Droplets',   'Vazamentos, encanamentos, desentupimento',    150, 1200, 2),
  ('Pintura',      'pintura',     'Paintbrush', 'Paredes, tetos, fachadas e esquadrias',       300, 3000, 3),
  ('Montagem',     'montagem',    'Wrench',     'Móveis, eletrodomésticos, persianas',         100, 600,  4),
  ('Serralheria',  'serralheria', 'Shield',     'Fechaduras, grades, portões, janelas',        150, 1000, 5),
  ('Alvenaria',    'alvenaria',   'Hammer',     'Revestimentos, reparos, demolição',           200, 2000, 6),
  ('Climatização', 'climatizacao','Wind',       'Ar-condicionado, ventilação, aquecedor',      150, 800,  7),
  ('Informática',  'informatica', 'Monitor',    'Redes, computadores, CFTV, automação',        120, 600,  8);

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- profiles
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_pro_read_client" ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.client_id = profiles.id
        AND sr.professional_id = auth.uid()
        AND sr.status NOT IN ('cancelada', 'finalizada')
    )
  );

-- user_roles
CREATE POLICY "roles_read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_insert_own_non_admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role IN ('contratante', 'profissional'));

-- addresses
CREATE POLICY "addresses_own" ON public.addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- service_categories
CREATE POLICY "categories_public" ON public.service_categories FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY "categories_admin" ON public.service_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- professional_profiles
CREATE POLICY "prof_approved_read" ON public.professional_profiles FOR SELECT TO authenticated
  USING (status = 'aprovado');
CREATE POLICY "prof_own_read" ON public.professional_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "prof_admin_read" ON public.professional_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "prof_own_write" ON public.professional_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prof_own_update" ON public.professional_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "prof_admin_update" ON public.professional_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- service_requests
CREATE POLICY "sr_client_all" ON public.service_requests FOR ALL TO authenticated
  USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "sr_pro_read_open" ON public.service_requests FOR SELECT TO authenticated
  USING (status IN ('aberta', 'orcando') AND public.has_role(auth.uid(), 'profissional'));
CREATE POLICY "sr_pro_read_assigned" ON public.service_requests FOR SELECT TO authenticated
  USING (auth.uid() = professional_id);
CREATE POLICY "sr_admin_all" ON public.service_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- request_photos
CREATE POLICY "photos_parties_read" ON public.request_photos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_photos.request_id
        AND (sr.client_id = auth.uid() OR sr.professional_id = auth.uid())
    )
  );
CREATE POLICY "photos_own_insert" ON public.request_photos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- quotes
CREATE POLICY "quotes_client_read" ON public.quotes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.service_requests WHERE id = quotes.request_id AND client_id = auth.uid())
  );
CREATE POLICY "quotes_pro_own" ON public.quotes FOR ALL TO authenticated
  USING (auth.uid() = professional_id) WITH CHECK (auth.uid() = professional_id);
CREATE POLICY "quotes_admin" ON public.quotes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- service_checkins
CREATE POLICY "checkins_parties_read" ON public.service_checkins FOR SELECT TO authenticated
  USING (
    auth.uid() = professional_id OR
    EXISTS (SELECT 1 FROM public.service_requests WHERE id = request_id AND client_id = auth.uid())
  );
CREATE POLICY "checkins_pro_insert" ON public.service_checkins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = professional_id);

-- payments
CREATE POLICY "payments_parties_read" ON public.payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = payments.request_id
        AND (sr.client_id = auth.uid() OR sr.professional_id = auth.uid())
    )
  );
CREATE POLICY "payments_admin" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ratings
CREATE POLICY "ratings_parties_read" ON public.ratings FOR SELECT TO authenticated
  USING (auth.uid() = rater_id OR auth.uid() = rated_id);
CREATE POLICY "ratings_pro_profile_read" ON public.ratings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.user_id = ratings.rated_id AND pp.status = 'aprovado'
    )
  );

-- warranty_claims
CREATE POLICY "claims_client_own" ON public.warranty_claims FOR SELECT TO authenticated
  USING (auth.uid() = client_id);
CREATE POLICY "claims_client_insert" ON public.warranty_claims FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);
CREATE POLICY "claims_pro_read" ON public.warranty_claims FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.service_requests WHERE id = warranty_claims.request_id AND professional_id = auth.uid())
  );
CREATE POLICY "claims_admin" ON public.warranty_claims FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- platform_settings
CREATE POLICY "settings_public_read" ON public.platform_settings FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "settings_admin_write" ON public.platform_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ================================================================
-- TRIGGERS
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'contratante')
  );
  IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'profissional' THEN
    INSERT INTO public.professional_profiles (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER prof_touch BEFORE UPDATE ON public.professional_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER sr_touch BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ================================================================
-- SECURITY DEFINER FUNCTIONS
-- ================================================================

-- accept_quote: cliente aceita orçamento e agenda o serviço
CREATE OR REPLACE FUNCTION public.accept_quote(p_quote_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_q        quotes%ROWTYPE;
  v_settings platform_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_q FROM public.quotes WHERE id = p_quote_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Orçamento não encontrado.'; END IF;
  IF v_q.status != 'pendente' THEN RAISE EXCEPTION 'Orçamento não está mais disponível.'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.service_requests WHERE id = v_q.request_id AND client_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Você não pode aceitar este orçamento.'; END IF;

  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;

  UPDATE public.quotes SET status = 'aceito' WHERE id = p_quote_id;
  UPDATE public.quotes SET status = 'recusado'
    WHERE request_id = v_q.request_id AND id != p_quote_id AND status = 'pendente';
  UPDATE public.service_requests SET
    status               = 'agendada',
    accepted_quote_id    = p_quote_id,
    professional_id      = v_q.professional_id,
    quoted_price         = v_q.price,
    final_price          = v_q.price,
    platform_fee         = ROUND(v_q.price * v_settings.commission_percent / 100, 2),
    professional_payout  = ROUND(v_q.price * (1 - v_settings.commission_percent / 100), 2),
    preferred_date       = COALESCE(v_q.scheduled_for, preferred_date)
  WHERE id = v_q.request_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.accept_quote(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_quote(UUID) FROM anon, PUBLIC;

-- service_checkin: chegada/saída com GPS
CREATE OR REPLACE FUNCTION public.service_checkin(
  p_request_id UUID,
  p_type       public.checkin_type,
  p_lat        NUMERIC DEFAULT NULL,
  p_lng        NUMERIC DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sr service_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_sr FROM public.service_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado.'; END IF;
  IF v_sr.professional_id != auth.uid() THEN
    RAISE EXCEPTION 'Você não é o profissional deste pedido.';
  END IF;

  INSERT INTO public.service_checkins (request_id, professional_id, type, lat, lng)
  VALUES (p_request_id, auth.uid(), p_type, p_lat, p_lng);

  IF p_type = 'chegada' THEN
    UPDATE public.service_requests
    SET status = 'em_andamento', started_at = now()
    WHERE id = p_request_id;
  ELSIF p_type = 'saida' THEN
    UPDATE public.service_requests
    SET
      status               = 'concluida',
      completed_at         = now(),
      guarantee_expires_at = now() + (
        SELECT guarantee_days FROM public.professional_profiles WHERE user_id = auth.uid()
      ) * INTERVAL '1 day'
    WHERE id = p_request_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.service_checkin(UUID, public.checkin_type, NUMERIC, NUMERIC) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.service_checkin(UUID, public.checkin_type, NUMERIC, NUMERIC) FROM anon, PUBLIC;

-- create_rating: valida participação + unique por serviço/avaliador
CREATE OR REPLACE FUNCTION public.create_rating(
  p_request_id    UUID,
  p_rated_id      UUID,
  p_stars         INT,
  p_punctuality   INT  DEFAULT NULL,
  p_quality       INT  DEFAULT NULL,
  p_communication INT  DEFAULT NULL,
  p_comment       TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sr service_requests%ROWTYPE; v_new_id UUID;
BEGIN
  SELECT * INTO v_sr FROM public.service_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado.'; END IF;
  IF v_sr.status NOT IN ('concluida','pago','garantia','finalizada') THEN
    RAISE EXCEPTION 'Avaliação só pode ser feita após a conclusão do serviço.';
  END IF;
  IF auth.uid() != v_sr.client_id AND auth.uid() != v_sr.professional_id THEN
    RAISE EXCEPTION 'Você não participou deste serviço.';
  END IF;
  IF auth.uid() = v_sr.client_id AND p_rated_id != v_sr.professional_id THEN
    RAISE EXCEPTION 'ID do avaliado inválido.';
  END IF;
  IF auth.uid() = v_sr.professional_id AND p_rated_id != v_sr.client_id THEN
    RAISE EXCEPTION 'ID do avaliado inválido.';
  END IF;

  INSERT INTO public.ratings
    (request_id, rater_id, rated_id, stars, punctuality, quality, communication, comment)
  VALUES
    (p_request_id, auth.uid(), p_rated_id, p_stars, p_punctuality, p_quality, p_communication, p_comment)
  RETURNING id INTO v_new_id;

  UPDATE public.professional_profiles
  SET
    rating_avg     = (SELECT ROUND(AVG(stars)::numeric,2) FROM public.ratings WHERE rated_id = p_rated_id),
    services_count = (SELECT COUNT(*) FROM public.service_requests WHERE professional_id = p_rated_id AND status = 'finalizada')
  WHERE user_id = p_rated_id;

  RETURN v_new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_rating(UUID,UUID,INT,INT,INT,INT,TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_rating(UUID,UUID,INT,INT,INT,INT,TEXT) FROM anon, PUBLIC;
