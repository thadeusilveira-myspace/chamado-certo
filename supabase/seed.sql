-- ================================================================
-- SEED DE DEMONSTRAÇÃO (opcional — NÃO rodar em produção)
-- Cria clientes fictícios com histórico de pedidos relativo à data
-- atual, para o Radar exibir todos os estados no primeiro acesso.
-- ================================================================

DO $$
DECLARE
  c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID; c6 UUID; c7 UUID;
  i INT;
BEGIN
  -- 1) Semanal pontual, comprou há poucos dias → CONFIRMADO/FORA DE CICLO
  INSERT INTO customers (name, segment, city) VALUES ('Padaria Exemplo Pão Quente', 'padaria', 'Vitória') RETURNING id INTO c1;
  INSERT INTO customer_contacts (customer_id, name, wa_phone, is_decision_maker) VALUES (c1, 'João (demo)', '5527900000001', true);
  FOR i IN 0..7 LOOP
    INSERT INTO orders (customer_id, qty_total, total, confirmed_at, delivery_date)
    VALUES (c1, 6, 620, now() - ((i * 7 + 2) || ' days')::interval, current_date - (i * 7 + 1));
  END LOOP;

  -- 2) Semanal, deveria ter confirmado e não confirmou → EM RISCO
  INSERT INTO customers (name, segment, city) VALUES ('Mercado Exemplo Bom Preço', 'mercado', 'Vila Velha') RETURNING id INTO c2;
  INSERT INTO customer_contacts (customer_id, name, wa_phone, is_decision_maker) VALUES (c2, 'Carlos (demo)', '5527900000002', true);
  FOR i IN 0..6 LOOP
    INSERT INTO orders (customer_id, qty_total, total, confirmed_at, delivery_date)
    VALUES (c2, 8, 780, now() - ((i * 7 + 10) || ' days')::interval, current_date - (i * 7 + 9));
  END LOOP;

  -- 3) Semanal, hoje é o dia típico de contato → CONTATO DEVIDO
  INSERT INTO customers (name, segment, city) VALUES ('Lanchonete Exemplo Sabor', 'lanchonete', 'Serra') RETURNING id INTO c3;
  INSERT INTO customer_contacts (customer_id, name, wa_phone, is_decision_maker) VALUES (c3, 'Ana (demo)', '5527900000003', true);
  FOR i IN 0..5 LOOP
    INSERT INTO orders (customer_id, qty_total, total, confirmed_at, delivery_date)
    VALUES (c3, 4, 410, now() - ((i * 7 + 7) || ' days')::interval, current_date - (i * 7 + 6));
  END LOOP;

  -- 4) Quinzenal no meio do ciclo → FORA DE CICLO
  INSERT INTO customers (name, segment, city) VALUES ('Restaurante Exemplo Tempero', 'restaurante', 'Cariacica') RETURNING id INTO c4;
  INSERT INTO customer_contacts (customer_id, name, wa_phone, is_decision_maker) VALUES (c4, 'Marcia (demo)', '5527900000004', true);
  FOR i IN 0..4 LOOP
    INSERT INTO orders (customer_id, qty_total, total, confirmed_at, delivery_date)
    VALUES (c4, 12, 1350, now() - ((i * 14 + 5) || ' days')::interval, current_date - (i * 14 + 4));
  END LOOP;

  -- 5) Sumiu há mais de 2 ciclos → ESFRIANDO
  INSERT INTO customers (name, segment, city) VALUES ('Café Exemplo Grão Nobre', 'cafeteria', 'Vitória') RETURNING id INTO c5;
  INSERT INTO customer_contacts (customer_id, name, wa_phone, is_decision_maker) VALUES (c5, 'Pedro (demo)', '5527900000005', true);
  FOR i IN 0..4 LOOP
    INSERT INTO orders (customer_id, qty_total, total, confirmed_at, delivery_date)
    VALUES (c5, 3, 290, now() - ((i * 7 + 22) || ' days')::interval, current_date - (i * 7 + 21));
  END LOOP;

  -- 6) Cliente novo, 1 pedido só → SEM HISTÓRICO
  INSERT INTO customers (name, segment, city) VALUES ('Hotel Exemplo Vista Mar', 'hotel', 'Guarapari') RETURNING id INTO c6;
  INSERT INTO customer_contacts (customer_id, name, wa_phone, is_decision_maker) VALUES (c6, 'Renata (demo)', '5527900000006', true);
  INSERT INTO orders (customer_id, qty_total, total, confirmed_at, delivery_date)
  VALUES (c6, 10, 980, now() - INTERVAL '4 days', current_date - 3);

  -- 7) Cliente sem nenhum pedido → SEM HISTÓRICO
  INSERT INTO customers (name, segment, city) VALUES ('Escola Exemplo Aprender', 'escola', 'Serra') RETURNING id INTO c7;
  INSERT INTO customer_contacts (customer_id, name, wa_phone) VALUES (c7, 'Secretaria (demo)', '5527900000007');

  -- fatos de exemplo (o que a entrevista com a vendedora produz)
  INSERT INTO customer_facts (customer_id, fact_type, value, source) VALUES
    (c1, 'decisor',            'Quem decide é o João; a esposa ajuda mas não fecha pedido', 'humano'),
    (c1, 'estilo_comunicacao', 'Prefere conversa curta e informal, responde entre 8h e 10h', 'humano'),
    (c1, 'gatilho_fechamento', 'Quando diz "vou ver", costuma fechar no segundo contato',   'humano'),
    (c2, 'estilo_comunicacao', 'Formal; gosta de confirmar o valor total antes de fechar',  'humano'),
    (c2, 'precisa_lembrete',   'Sempre precisa ser lembrado na quinta-feira',               'humano'),
    (c5, 'alerta',             'Reclamou de atraso na entrega no mês passado — tratar com cuidado', 'humano');
END $$;
