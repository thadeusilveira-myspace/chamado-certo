# Memória Comercial

O coração do sistema: o perfil comportamental de cada cliente, construído
automaticamente a partir de conversas e pedidos, e que hoje existe apenas na
cabeça da vendedora.

## O que o perfil responde

Para cada cliente, o sistema deve saber responder:

| Pergunta | Exemplo (Padaria X) | Fonte |
|---|---|---|
| Quando costuma comprar? | Sexta-feira, semanal | pedidos |
| Quando costuma confirmar? | Quinta, 8h–10h | timestamps das conversas |
| Quanto costuma comprar? | 4–6 pacotes, mediana 6 | pedidos |
| Ticket médio? | R$ 620–780 | pedidos |
| Quem decide? | João | extração de conversa |
| Como abordar? | Curto e informal, precisa ser lembrado | extração de conversa |
| Sinais de fechamento? | "vou ver" → fecha no 2º contato | conversa + desfecho |
| Probabilidade de comprar esta semana? | 87% | motor de previsão |
| Último pedido? | R$ 780, há 6 dias | pedidos |

## Duas fontes, dois mecanismos

### 1. Dados estruturados (pedidos)
Cada pedido registrado alimenta estatísticas recalculáveis:
- ciclo de compra (mediana e desvio dos intervalos entre pedidos);
- dia da semana e horário típicos de confirmação;
- quantidades por produto (mediana, mínimo, máximo);
- ticket médio e tendência (crescendo/estável/caindo).

Esses números são **derivados** — nunca digitados à mão. Recalculados a cada
novo pedido.

### 2. Dados não estruturados (conversas → fatos)
A IA processa as conversas e extrai **fatos comportamentais** com evidência:

```json
{
  "fact_type": "estilo_comunicacao",
  "value": "prefere conversa curta e informal",
  "confidence": 0.9,
  "evidence_message_ids": ["..."],
  "extracted_at": "..."
}
```

Regras importantes:
- Todo fato aponta para as mensagens que o evidenciam (auditável).
- Fatos têm confiança e podem ser **corrigidos/confirmados pela equipe** —
  a correção humana vale mais que a extração automática.
- Fatos envelhecem: comportamento muda; fato sem reforço recente perde peso.

## Bootstrapping: de onde vem o histórico inicial

Com o gateway não oficial (doc 05), ao conectar a sessão temos **leitura do
histórico de conversas da conta** — essa é uma das grandes vantagens da
decisão tomada. O plano:

1. **Ingestão do histórico via gateway**: ao parear o número na Evolution
   API, sincronizar as conversas existentes e rodar o pipeline de extração
   de fatos sobre elas, começando pelos top 50 clientes. A profundidade do
   histórico disponível depende do que está no aparelho/conta — validar na
   prática e complementar com exportação manual (`Exportar conversa` no app)
   para clientes importantes com histórico incompleto.
2. **Entrevista estruturada com a vendedora**: sessão guiada onde ela revisa
   a carteira cliente a cliente e o sistema registra o que ela sabe como
   fatos semente (`source = 'humano'`). A extração automática dá o *o quê*
   (datas, quantidades, padrões); a entrevista dá o *porquê* (quem decide,
   como abordar, o que nunca fazer). Fazer independentemente da ingestão.
3. **Pedidos históricos**: se existirem em planilha/caderno/ERP, importar —
   as estatísticas de ciclo ficam boas com ~4–6 pedidos por cliente. Pedidos
   também podem ser reconstruídos das próprias conversas ingeridas (a IA
   identifica confirmações de pedido no histórico e sugere o registro, com
   revisão humana).

## Modelo de dados

Schema SQL de referência completo em
[`sql/memoria-comercial.sql`](sql/memoria-comercial.sql). Resumo das tabelas:

| Tabela | Papel |
|---|---|
| `customers` | Cliente (estabelecimento) + nível de automação + estado do radar |
| `customer_contacts` | Pessoas do cliente (João da Padaria X), com papel de decisor |
| `wa_conversations` | Conversas (atribuição a humano/IA; campo de janela de 24h reservado p/ eventual API oficial) |
| `wa_messages` | Todas as mensagens (evento imutável), com direção, autor (humano/IA), status |
| `orders` / `order_items` | Pedidos e itens — a verdade estruturada |
| `customer_facts` | Fatos comportamentais extraídos, com evidência e confiança |
| `customer_purchase_stats` | Estatísticas derivadas (ciclo, ticket, dia típico) — recalculadas |
| `radar_snapshots` / `radar_entries` | Fotografia diária do radar (doc 03) |
| `playbook_entries` | Abordagens que funcionaram: contexto → mensagem → desfecho (doc 04) |
| `outreach_suggestions` | Sugestões da IA: rascunho, aprovação, envio, desfecho |
| `handoff_events` | Transferências IA → humano, com motivo |

## Privacidade e LGPD

- Os dados são de contatos comerciais B2B, mas ainha assim são dados pessoais
  (nome, telefone, conteúdo de conversa): base legal provável é legítimo
  interesse para relacionamento comercial existente — documentar no RoPA.
- Opt-out imediato e definitivo: pedido de "não me chame mais" vira flag
  `do_not_contact` que **bloqueia qualquer envio proativo** em qualquer nível
  de automação.
- Fatos comportamentais são sobre o comportamento *comercial* — não registrar
  informações pessoais sensíveis mesmo que apareçam na conversa.
- Retenção: definir prazo para mensagens brutas; estatísticas agregadas podem
  viver mais que o texto original.
