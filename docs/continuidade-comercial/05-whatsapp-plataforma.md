# Plataforma WhatsApp

## Decisão: API oficial, não automação de navegador

| | WhatsApp Web automatizado (Puppeteer/whatsapp-web.js/Z-API não oficial) | WhatsApp Business Platform (Cloud API via BSP) |
|---|---|---|
| Termos de uso | Viola; **risco real de banimento do número** — o número é o ativo comercial da operação | Oficial |
| Webhooks/eventos | Frágeis, engenharia reversa | Nativos e documentados |
| Estabilidade | Quebra a cada update do WhatsApp | SLA do BSP |
| Multi-atendente | Gambiarra | Nativo |
| Uso aceitável | No máximo protótipo interno descartável de leitura | Produção |

Conclusão: protótipo de *leitura* para validar a extração de fatos pode usar
uma sessão web observada. **Nenhuma mensagem automática sai por aí.** A
operação definitiva é 100% Cloud API.

## A regra que molda a arquitetura: janela de 24h

- Quando o **cliente** manda mensagem, abre uma janela de atendimento de
  **24 horas** em que a empresa pode enviar mensagens livres (texto normal).
- Fora da janela, contato iniciado pela empresa **só via template
  pré-aprovado** pela Meta (com variáveis, ex.:
  `"Olá {{1}}! Vou fechar sua entrega de {{2}}. Mantenho as {{3}} de sempre?"`).

Como o pós-venda da D'GUST é **proativo e recorrente**, a maior parte dos
contatos do Radar começa **fora de janela** → começa por template. Isso
precisa estar no domínio desde o início:

- `wa_conversations.service_window_expires_at` controla a janela;
- o motor de envio decide automaticamente: janela aberta → mensagem livre;
  fechada → template adequado da biblioteca;
- o objetivo do template é **fazer o cliente responder** — a resposta reabre
  a janela de 24h e a conversa flui livre a partir daí;
- biblioteca de templates versionada no banco (`wa_templates`), com status de
  aprovação Meta e taxa de resposta medida por template.

Categorias e custo: templates são classificados pela Meta (utility/marketing)
com precificação por conversa que varia por categoria. Lembrete de pedido
recorrente tende a utility (mais barato), mas a Meta pode reclassificar —
acompanhar via BSP.

**Opt-in**: envio proativo requer consentimento prévio do destinatário
(política Meta e boa prática LGPD). Para a carteira atual, o relacionamento
comercial existente + registro do aceite na conversa resolve; formalizar
para clientes novos (ex.: no cadastro).

## Número atual e histórico: coexistência

Ponto crítico para a D'GUST: o relacionamento está num número que os clientes
já conhecem.

- **Modo coexistência (Meta)**: permite conectar um número do **WhatsApp
  Business App** à Cloud API **mantendo o app funcionando** no celular, e
  sincroniza ~6 meses de histórico de conversas e os contatos para a
  plataforma. É o caminho ideal: preserva o número, o app da vendedora e
  ainda alimenta o bootstrapping da Memória Comercial (doc 02).
- Verificar com o BSP escolhido o suporte a coexistência e restrições
  (disponível para números do Business App, com limitações regionais).
- Alternativa, se coexistência não estiver disponível: migrar o número para
  a API (o app deixa de funcionar para ele) — decisão operacional maior;
  ou operar com número novo para o sistema (pior: perde o reconhecimento).

## Escolha de BSP (Business Solution Provider)

Candidatos com boa operação no Brasil: **Twilio**, **360dialog**,
**Gupshup**, **Infobip**. Critérios de escolha:

1. suporte a coexistência;
2. preço por conversa + mensalidade (360dialog costuma ser o mais direto:
   taxa fixa + repasse Meta; Twilio cobra por mensagem com markup);
3. qualidade de webhooks e sandbox para desenvolvimento;
4. gestão de templates via API.

A camada de gateway (doc 01) isola o BSP — trocar depois não pode doer.

## Saúde do número

- **Quality rating** da Meta: cai com bloqueios/denúncias de destinatários.
  Insistência automática mal calibrada derruba o rating e limita o volume
  de templates → mais um motivo para os limites de insistência do doc 04.
- Limites de envio (messaging tiers) sobem com volume + qualidade; para a
  carteira atual (~100 clientes) o tier inicial já é suficiente.

## Eventos consumidos do webhook

| Evento | Uso no sistema |
|---|---|
| `message` (inbound) | Abre/renova janela 24h; classificação da resposta; extração de fatos; recálculo do radar |
| `status: sent/delivered/read` | Métricas de abordagem (template lido e não respondido ≠ não entregue) |
| `status: failed` | Alerta operacional (número inválido, bloqueio) |

Todos persistidos brutos em `wa_messages` antes de qualquer processamento —
o processamento é reexecutável.
