# Roadmap

Fases com critério de saída explícito. Cada fase entrega valor sozinha —
se o projeto parar em qualquer ponto, o que foi construído já reduz a
dependência da memória individual.

## Fase 1 — Fundação de dados (2–4 semanas)

**Entrega:** registro estruturado de clientes e pedidos + captura do
conhecimento tácito.

- Cadastro da carteira: `customers`, `customer_contacts`.
- Registro de **todo pedido** a partir de agora (mesmo que digitado à mão
  por quem atende) — sem isso não existe previsão.
- Importar pedidos históricos que existirem (planilha, caderno, ERP).
- **Entrevista estruturada com a Beid**: revisar a carteira cliente a
  cliente e registrar o que ela sabe como `customer_facts`
  (`source='humano'`). Esta é a apólice de seguro imediata — na semana
  seguinte a empresa já sabe o que antes só ela sabia.

**Critério de saída:** 100% dos pedidos passando pelo sistema; top 50
clientes com fatos registrados.

## Fase 2 — Radar de Pedidos v1 (2–3 semanas)

**Entrega:** o painel diário 🔴🟡🟢⚪ com receita em risco.

- Motor de previsão heurístico (doc 03) sobre os pedidos registrados.
- Painel diário + perfil do cliente.
- A equipe ainda envia mensagens pelo WhatsApp normal — o radar só diz
  **quem, quando e por quê**.

**Critério de saída:** operação usando o radar como fila de trabalho diária;
primeira medição de pedidos recuperados (🔴 → pedido).

## Fase 3 — Gateway + Central de Mensagens (2–4 semanas)

**Entrega:** conversas dentro do sistema, via gateway não oficial (doc 05).

- Subir Evolution API self-hosted (VPS própria); conectar o número atual
  via QR code — o app no celular continua funcionando (aparelho conectado).
- Gateway com **fila de envio disciplinada** (throttle, teto diário,
  horário comercial) implementada ANTES do primeiro envio pelo sistema.
- Inbox com contexto do cliente ao lado da conversa; mensagens enviadas
  pelo celular também entram no registro (webhook captura os dois lados).
- Ingestão do histórico da conta → primeira extração de fatos por IA.
- Plano de contingência R1–R3 do doc 05 documentado e testado: número
  secundário preparado, alerta de desconexão, modo degradado (operar pelo
  app usando o radar como fila).

**Critério de saída:** 100% das conversas comerciais registradas na Central;
fila de envio e alertas de sessão funcionando; contingência testada.

## Fase 4 — Observação e Copiloto (4+ semanas)

**Entrega:** IA observando a operação e sugerindo abordagens (nível 1).

- Rotulagem `abordagem → resposta → desfecho` sobre as conversas reais.
- Extração contínua de fatos + montagem do playbook (DNA comercial).
- Sugestão de mensagem pronta em cada item 🟡/🔴 do radar; humano envia.
- Medir taxa de edição das sugestões (métrica de prontidão p/ nível 2).

**Critério de saída:** ≥70% das sugestões enviadas sem edição relevante;
qualquer pessoa da equipe consegue operar a carteira usando o copiloto.

## Fase 5 — Automação supervisionada (nível 2)

- Promover clientes previsíveis (critério objetivo, doc 04) para envio
  automático nos gatilhos do radar.
- Gatilhos de escalação obrigatória ativos e testados ANTES do primeiro
  envio automático.
- Começar com 10–20 clientes; expandir conforme taxa de escalação correta.

**Critério de saída:** zero reclamações tratadas por IA; pedidos fechados
por IA sem intervenção ≥ X/semana.

## Fase 6 — Carteira autônoma (nível 3) + extensões

- Ciclo completo de recompra automatizado p/ clientes elegíveis.
- Fluxo de recuperação de inativos (⚫ esfriando).
- Integração com produção/rotas/estoque: a soma dos pedidos previstos vira
  previsão de demanda da fábrica.

## O teste final

Rodar o **teste de ausência** (doc 00): um período em que a operadora humana
não atua na carteira coberta. Meta: queda de pedidos ≈ zero. Enquanto esse
teste não passa, o projeto não está pronto — está andando.

## Riscos principais

| Risco | Mitigação |
|---|---|
| Pedidos não serem registrados com disciplina (Fase 1) | Registro tem que ser mais fácil que não registrar (1 toque a partir da conversa); cobrar no ritual diário |
| **Número banido pelo WhatsApp** (risco assumido do gateway não oficial) | Disciplina de envio (throttle, tetos, só contatos existentes, opt-out absoluto); Memória Comercial vive no nosso banco, não no aparelho; número secundário aquecido + playbook de recuperação (doc 05, R1) |
| Protocolo não oficial quebra após update do WhatsApp | Gateway isolado; monitoramento de sessão com alerta; modo degradado: operar pelo app com o radar como fila (doc 05, R2) |
| IA responder mal uma reclamação | Gatilhos de escalação testados antes de qualquer envio automático; downgrade automático de nível |
| Projeto virar "robô que manda mensagem" | A ordem das fases força: dados → radar → observação → só então automação |
