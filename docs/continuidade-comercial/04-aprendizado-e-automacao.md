# Aprendizado e Níveis de Automação

Princípio: **a IA não começa mandando mensagem. Começa observando.**

## Fase 0 — Observação (semanas 1–4+)

Com a operação já passando pela Central de Mensagens (mesmo que 100% manual),
cada interação gera um registro rotulável:

```
contexto do cliente → mensagem enviada → resposta → condução → desfecho
                                                    (pedido / sem pedido / adiado)
```

Disso a IA extrai dois tipos de conhecimento:

1. **Fatos por cliente** (doc 02): estilo, decisor, gatilhos, horários.
2. **Playbook comercial** (`playbook_entries`): padrões de abordagem que
   funcionam por *tipo de situação*, não por cliente:
   - "cliente atrasado no ciclo + relação informal → lembrete curto citando a
     rota de entrega converte melhor que pergunta aberta";
   - "resposta 'vou ver' → segundo contato em ~24h fecha em X% dos casos";
   - "cliente que não responde à pergunta aberta responde à proposta
     concreta ('coloco as 6 de sempre?')".

O que a IA aprende **não é** copiar o texto de alguém. É a política comercial:

> **quem** abordar + **quando** abordar + **sobre o que** falar +
> **qual oferta** fazer + **quando insistir** + **quando parar**.

## DNA Comercial da empresa, não "Beid artificial"

O playbook é da **D'GUST**, não de uma pessoa. Se a Beid tem uma abordagem
excelente para reativar cliente sumido, o André outra para aumentar pedido, e
a Henriette outra para cliente formal — todas entram no mesmo playbook, com
atribuição de origem e taxa de sucesso medida.

Consequências práticas:
- toda entrada de playbook registra `learned_from` (de quem veio) e
  `success_rate` (medida, não estimada);
- a IA escolhe a abordagem pela situação + histórico de sucesso, não por
  imitar um único estilo;
- com o tempo, o sistema pode performar melhor que qualquer vendedor isolado,
  porque carrega a experiência acumulada de todos.

## Nível 1 — Copiloto (IA recomenda, humano envia)

Para cada cliente 🟡/🔴 do radar, a IA prepara:

> "A Beid normalmente chama este cliente quinta às 16h. Sugestão:
> 'Fala Carlos 👋 Vou fechar sua entrega de sexta. Mantenho a mesma
> quantidade?'"

O humano edita se quiser e aperta **Enviar**. Cada edição humana é sinal de
treino (a diferença entre sugerido e enviado alimenta o playbook).

**Já neste nível a dependência da memória individual desaba**: qualquer
pessoa da equipe consegue operar a carteira, porque o contexto e a abordagem
vêm prontos.

Critério para promover um cliente ao nível 2: ≥ N sugestões consecutivas
enviadas sem edição (ou com edições triviais) + cliente sem ocorrências
sensíveis recentes.

## Nível 2 — Piloto automático supervisionado

Clientes previsíveis recebem contato automático nos gatilhos do radar:

```
quinta-feira, 15h
cliente não realizou o pedido habitual (🔴)
IA identifica o padrão e inicia o contato
```

A conversa continua com a IA **enquanto seguir o script esperado**
(confirmação, quantidade, data de entrega). Qualquer desvio escala:

### Gatilhos de escalação obrigatória (handoff IA → humano)

- reclamação ou problema: *"veio errado semana passada"* — **a IA nunca
  tenta resolver ou contornar uma reclamação**; transfere na hora, com
  reconhecimento neutro ("vou verificar isso agora com a equipe");
- pedido de desconto / negociação fora da tabela;
- quantidade muito fora do padrão (ex.: >2× a mediana — pode ser erro);
- sentimento negativo ou ironia detectada;
- qualquer mensagem que a IA não classifique com confiança alta;
- pedido de falar com uma pessoa específica.

Todo handoff gera `handoff_event` com motivo, e o humano vê a conversa
inteira com o contexto do cliente. SLA de resposta humana definido (ex.:
30 min em horário comercial).

## Nível 3 — Carteira autônoma

A IA cuida do ciclo completo de recompra dos clientes elegíveis:

contato → confirmação de quantidade → geração do pedido → registro no
CRM/ERP → acompanhamento da entrega → follow-up.

O humano fica com: exceções escaladas, clientes estratégicos/sensíveis
(marcados para nunca automatizar), recuperação de inativos e supervisão do
painel.

## Regras transversais (valem em todos os níveis)

1. **Identificação**: a operação decide a política de como o contato se
   apresenta; o sistema nunca alega ser uma pessoa específica que não está
   na conversa.
2. **Frequência máxima de insistência** por cliente (ex.: 1 lembrete + 1
   follow-up por ciclo; depois, só humano decide insistir).
3. **`do_not_contact` é absoluto** — bloqueia envio proativo em qualquer nível.
4. **Downgrade automático**: cliente com handoff por reclamação volta ao
   nível 1 até a equipe promover de novo.
5. **Auditoria**: toda mensagem enviada por IA fica marcada como tal no
   histórico interno, com a sugestão/regra que a originou.
