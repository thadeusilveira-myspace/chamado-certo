# Arquitetura

## Visão geral

```
                        WHATSAPP BUSINESS PLATFORM
                     (Cloud API + webhooks, via BSP)
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │ CENTRAL DE MENSAGENS │  ingestão de eventos:
                       │  (inbox + eventos)   │  mensagem recebida/enviada,
                       └──────────┬───────────┘  lida, respondida, status
                                  │
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
        HISTÓRICO DO CLIENTE               CONVERSA ATUAL
        (mensagens + pedidos)            (janela de 24h ativa?)
                   │                             │
                   └──────────────┬──────────────┘
                                  ▼
                       ┌─────────────────────┐
                       │  MEMÓRIA COMERCIAL   │  perfil comportamental
                       │  (por cliente)       │  por cliente (doc 02)
                       └──────────┬───────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
      FREQUÊNCIA/CICLO      COMPORTAMENTO         PRODUTOS/
        DE COMPRA            DE CONVERSA           TICKET
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  ▼
                       ┌─────────────────────┐
                       │    IA COMERCIAL      │  decide:
                       └──────────┬───────────┘
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
           QUEM                QUANDO                COMO
          CONTATAR            CONTATAR              ABORDAR
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  ▼
                       ┌─────────────────────┐
                       │  RADAR DE PEDIDOS    │  fila diária priorizada
                       │  (doc 03)            │  + receita em risco
                       └──────────┬───────────┘
                          ┌───────┴────────┐
                          ▼                ▼
                     IA ENVIA         HUMANO ASSUME
                 (conforme nível      (exceções, reclamações,
                  de automação         negociação atípica,
                  do cliente)          clientes sensíveis)
```

## Componentes

### 1. Gateway WhatsApp
Integração com a WhatsApp Business Platform via BSP (ver doc 05).
Responsabilidades:
- receber webhooks (mensagem recebida, status de entrega/leitura);
- enviar mensagens livres (dentro da janela de 24h) e templates (fora dela);
- normalizar tudo em **eventos** persistidos (`wa_messages`).

É a única peça que conhece a API do WhatsApp. Trocar de BSP não pode afetar
o resto do sistema.

### 2. Central de Mensagens (inbox operacional)
Interface onde a equipe vê e responde conversas. Diferença para o WhatsApp
comum: cada conversa vem anexada ao **perfil comercial** do cliente (últimos
pedidos, ciclo, previsão, pendências) e ao estado do Radar.

### 3. Memória Comercial
Banco de dados comportamental por cliente, alimentado por dois fluxos:
- **estruturado**: pedidos registrados (quantidade, valor, data);
- **não estruturado**: conversas, das quais a IA extrai fatos ("prefere
  conversa curta", "quem decide é o João", "quando diz 'vou ver' fecha no
  segundo contato").

Detalhado no doc 02, com schema SQL de referência em `sql/`.

### 4. Motor de Previsão
Calcula, por cliente: próxima data esperada de pedido, quantidade esperada,
probabilidade de compra na semana, e o estado do radar (🟢🟡🔴⚪).
Começa com **heurísticas estatísticas simples** (ciclo mediano + desvio),
não com machine learning — ver doc 03.

### 5. IA Comercial
Camada que usa LLM para: extrair fatos das conversas, redigir abordagens no
estilo aprendido, classificar respostas do cliente (confirmou / adiou /
objeção / reclamação) e decidir escalar para humano.
Opera no nível de automação configurado **por cliente** (doc 04).

### 6. Radar de Pedidos
Job diário (e recálculo por evento) que materializa a fila de trabalho e o
painel de receita esperada. É a interface principal da operação.

## Princípios de arquitetura

1. **Eventos primeiro.** Toda interação vira evento imutável persistido.
   A Memória Comercial é uma *projeção* dos eventos — pode ser recalculada.
2. **Grau de automação por cliente, não global.** Cliente previsível e de
   bom relacionamento pode estar no nível 3; cliente sensível fica no nível 1
   para sempre, se necessário.
3. **Humano a um toque.** Qualquer conversa conduzida por IA pode ser
   assumida por humano instantaneamente, com todo o contexto na tela.
4. **A janela de 24h é modelada no domínio** (não tratada como detalhe de
   infra): cada conversa carrega `service_window_expires_at`, e o motor de
   decisão escolhe entre mensagem livre e template com base nisso.
5. **Auditabilidade.** Toda mensagem enviada por IA registra: qual regra ou
   sugestão a originou, qual nível de automação estava ativo e quem aprovou
   (quando aplicável).

## Stack sugerida

- **Backend/DB**: Supabase (Postgres + RLS + Edge Functions) — mesma stack
  que a equipe já domina; jobs de radar via `pg_cron` ou scheduler externo.
- **Frontend**: TanStack Start + React (inbox + radar + perfil do cliente).
- **LLM**: API da Anthropic (extração de fatos, redação, classificação de
  respostas). Tarefas de classificação podem usar modelo menor/mais barato.
- **WhatsApp**: Cloud API via BSP (Twilio, 360dialog ou Gupshup) — doc 05.
