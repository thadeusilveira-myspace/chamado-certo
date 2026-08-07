# Gateway WhatsApp (não oficial)

## Decisão

> **Decisão de negócio (registrada): a operação NÃO usará a API oficial
> (WhatsApp Business Platform). Usaremos gateway não oficial, assumindo o
> risco de banimento do número.**

Motivações práticas dessa escolha:

- **custo zero por mensagem** (a API oficial cobra por conversa);
- **sem janela de 24h e sem templates** — contato proativo livre, que é
  exatamente o formato do pós-venda da D'GUST;
- **histórico completo acessível** ao conectar a sessão — resolve o
  bootstrapping da Memória Comercial de graça (a API oficial não dá acesso
  retroativo às conversas);
- **o celular continua funcionando** — a conexão é um "aparelho conectado"
  (multi-device), então a Beid segue usando o app normalmente;
- entrada em produção em dias, sem contratação de BSP nem aprovação Meta.

O custo é o risco: violação dos termos de uso do WhatsApp, possibilidade de
banimento do número, e protocolo que pode quebrar quando o WhatsApp atualiza.
O resto deste documento existe para **administrar esse risco**, não para
ignorá-lo.

## Escolha da biblioteca/gateway

| Opção | O que é | Avaliação |
|---|---|---|
| **Evolution API** | Servidor open source brasileiro (self-hosted), REST + webhooks, gerencia sessões, construído sobre Baileys | **Recomendada.** Entrega o gateway quase pronto: envio, recebimento via webhook, gestão de sessão/QR, mídia. Comunidade grande no Brasil |
| **Baileys** | Biblioteca Node que fala o protocolo multi-device via WebSocket, sem navegador | Boa se quisermos controle total; mais trabalho de infra que a Evolution |
| whatsapp-web.js | Puppeteer + Chrome headless controlando o WhatsApp Web | Mais pesada e mais frágil (depende do DOM do WhatsApp Web); evitar |
| Z-API e similares | Gateways não oficiais comerciais (SaaS) | Terceiriza a infra, mas coloca as conversas da carteira em um terceiro; se for usar, avaliar contrato e privacidade |

Sugestão: **Evolution API self-hosted** (VPS própria), conectada ao número
atual via QR code. O gateway (doc 01) conversa só com a Evolution — se um dia
migrarmos para a API oficial ou trocarmos de biblioteca, o resto do sistema
não muda.

## Registro de riscos e mitigações

### R1 — Banimento do número (o risco central)

O número é o ativo comercial: é ele que os clientes conhecem. Mitigações:

**Reduzir sinais de spam (prevenção):**
- mensagens **apenas para contatos existentes**, que já conversam com a
  empresa — conversas bidirecionais têm risco baixo; nunca prospectar
  números frios por este canal;
- **fila de envio com throttle**: espaçamento aleatório entre envios
  (ex.: 30–90s), teto diário de mensagens proativas, janela de envio só em
  horário comercial;
- mensagens **personalizadas por cliente** (o sistema já faz isso por
  design — o playbook proíbe blast idêntico em massa);
- limites de insistência do doc 04 (1 lembrete + 1 follow-up por ciclo);
- `do_not_contact` absoluto — cliente que pediu para não receber nunca mais
  recebe (bloqueio/denúncia é o principal gatilho de ban);
- não enviar para quem nunca respondeu nada em N ciclos — parar e passar
  para tratamento humano por outro canal.

**Sobreviver ao ban (contingência):**
- **a Memória Comercial vive no nosso banco, não no WhatsApp** — se o número
  cair amanhã, perfis, ciclos, fatos e playbook estão intactos. Essa é a
  essência do projeto: o conhecimento deixa de morar no aparelho;
- exportar/sincronizar a agenda de contatos regularmente (telefone de cada
  contato já está em `customer_contacts`);
- manter um **número secundário já aquecido** (chip da empresa, usado
  ocasionalmente para conversas reais) pronto para assumir;
- playbook de recuperação documentado: (1) tentar apelação no suporte do
  WhatsApp; (2) ativar número secundário; (3) comunicar a carteira por
  ligação/SMS usando os dados do sistema — com o radar, sabemos exatamente
  quem contatar primeiro (clientes 🔴🟡 do dia).

### R2 — Protocolo quebra após atualização do WhatsApp

- Acontece periodicamente com toda biblioteca não oficial; a correção
  costuma vir em dias (comunidade Baileys/Evolution é ativa).
- Mitigação: monitoramento de saúde da sessão (alerta se desconectar);
  **modo degradado documentado** — enquanto o gateway estiver fora, a
  operação volta ao app no celular usando o radar como fila (o radar não
  depende do gateway para calcular, só de pedidos registrados);
- fixar versão da Evolution/Baileys e atualizar de forma controlada.

### R3 — Sessão derrubada / re-pareamento

- A sessão multi-device pode ser desconectada (ex.: celular muito tempo
  offline, logout acidental).
- Mitigação: alerta imediato + re-pareamento por QR em minutos; o celular
  principal precisa ficar ligado e com internet (responsabilidade
  operacional definida).

### R4 — Privacidade

- Self-hosted (Evolution em VPS própria) mantém as conversas sob controle
  da empresa — motivo para preferir self-hosted a SaaS não oficial.
- Aplicam-se as regras de LGPD do doc 02 (opt-out, retenção, não registrar
  dados sensíveis).

## O que muda em relação ao desenho com API oficial

| Tema | Com API oficial | **Com gateway não oficial (nossa decisão)** |
|---|---|---|
| Janela de 24h / templates | Regra central do domínio | **Não existe** — mensagem livre a qualquer momento. `service_window_expires_at` e `wa_templates` ficam no schema como reserva para migração futura, sem uso |
| Histórico | Sem acesso retroativo (só coexistência ~6 meses) | **Leitura do histórico da conta** ao conectar — alimenta a extração de fatos direto |
| Custo | Por conversa + BSP | Infra própria (~custo de uma VPS) |
| Disciplina de envio | Imposta pela plataforma (tiers, quality rating) | **Imposta por nós** no gateway (throttle, tetos, horário) — vira responsabilidade do nosso código |
| Continuidade | SLA do BSP | Plano de contingência R1–R3 acima |

## Eventos consumidos (via webhook da Evolution)

| Evento | Uso no sistema |
|---|---|
| mensagem recebida | Classificação da resposta; extração de fatos; recálculo do radar |
| mensagem enviada (inclusive pelo app do celular) | Registro completo da conversa — o que a Beid mandar pelo celular também entra na observação da Fase 4 |
| ack (entregue/lida) | Métricas de abordagem (lida e não respondida ≠ não entregue) |
| desconexão de sessão | Alerta operacional (R3) |

Todos persistidos brutos em `wa_messages.raw_payload` antes de qualquer
processamento — o processamento é reexecutável.

## Porta aberta para o futuro

Se a operação escalar (mais números, mais volume, equipe maior) ou o risco
se materializar de forma cara, a migração para a API oficial continua
possível a qualquer momento: o gateway é a única peça que muda, e o domínio
já tem os campos de janela/template reservados. A decisão de hoje não
fecha essa porta.
