# Continuidade Comercial via WhatsApp — Visão Geral

> Blueprint técnico do sistema de continuidade comercial da D'GUST.
> Transforma o pós-venda de "conhecimento na cabeça de uma pessoa" em
> "ativo de dados da empresa".

## O problema

- Com a vendedora responsável pelo pós-venda ativa: **~60 pedidos/período**.
- Sem ela: **~20 pedidos/período**.
- Ou seja, **~2/3 da receita recorrente depende de conhecimento tácito**:
  quem compra, quando compra, quanto compra, como abordar, quando insistir.
- Esse conhecimento não está em nenhum sistema. Está na memória de uma pessoa
  e no histórico de um número de WhatsApp.

## O objetivo (meta de aceitação do projeto)

> **Se a pessoa responsável pelo pós-venda ficar 30 dias sem trabalhar,
> a queda de pedidos recorrentes deve ser próxima de zero.**

Hoje: `Pessoa → conhecimento → relacionamento → venda`
Meta: `Empresa → dados → inteligência → relacionamento → venda`

A vendedora não é substituída — ela deixa de ser o *banco de dados* da operação
e passa a ser quem *treina e supervisiona* o sistema.

## O que o sistema NÃO é

- Não é um "robô de WhatsApp" que responde mensagens.
- Não é uma "Beid artificial" — o sistema aprende com **todos** os bons
  vendedores e consolida o **DNA comercial da empresa**, não o estilo de
  uma pessoa.
- Não esconde problemas do cliente: qualquer situação fora do padrão
  (reclamação, erro de entrega, negociação atípica) é transferida para humano.

## Os quatro pilares

| Pilar | O que faz | Documento |
|---|---|---|
| **Memória Comercial** | Perfil comportamental de cada cliente: frequência, dia/horário de compra, quantidades, ticket, pessoa de contato, estilo de conversa, gatilhos que funcionam | [02-memoria-comercial.md](02-memoria-comercial.md) |
| **Radar de Pedidos** | Todo dia, classifica a carteira inteira: pedido confirmado / precisa de contato hoje / **pedido em risco** / sem necessidade. Mostra o potencial em R$ do que está faltando | [03-radar-de-pedidos.md](03-radar-de-pedidos.md) |
| **Aprendizado + Automação** | Fase de observação (IA assiste a operação humana e rotula `abordagem → resposta → desfecho`), depois 3 níveis: copiloto → piloto supervisionado → carteira autônoma | [04-aprendizado-e-automacao.md](04-aprendizado-e-automacao.md) |
| **Plataforma WhatsApp** | WhatsApp Business Platform (API oficial) com webhooks, janela de 24h e templates aprovados — não automação de navegador | [05-whatsapp-plataforma.md](05-whatsapp-plataforma.md) |

## Mudança de mentalidade operacional

O sistema muda o objeto que a operação administra:

- **Antes:** administrar *mensagens* (caixa de entrada do WhatsApp).
- **Depois:** administrar *receita esperada* (carteira de clientes com
  comportamento previsto e desvios sinalizados).

"Pedido em risco" é o conceito central: se a Padaria João compra 6 pacotes
toda sexta e confirma na quinta, e chegou quinta 14h sem pedido, isso é um
**evento acionável** — não uma mensagem que alguém precisa lembrar de mandar.

## Métricas de sucesso

1. **Cobertura da carteira**: % de clientes ativos com perfil comportamental
   completo na Memória Comercial (meta: >90%).
2. **Recuperação de pedidos em risco**: % de pedidos sinalizados como "em
   risco" que se convertem em pedido após ação do sistema.
3. **Teste de ausência**: pedidos/semana em semanas com e sem a operadora
   humana ativa — a diferença deve tender a zero.
4. **Taxa de escalação correta**: % de conversas fora do padrão corretamente
   transferidas para humano (não pode haver reclamação tratada por IA).

## Extensões futuras

O mesmo mecanismo (previsão de comportamento por cliente) alimenta depois:

- detecção de clientes esfriando / recuperação de inativos;
- previsão de demanda da fábrica (soma dos pedidos previstos);
- planejamento de rotas de entrega (pedidos previstos por região/dia);
- estoque inteligente.

WhatsApp, vendas, produção, estoque e logística passam a operar sobre a
mesma base: o comportamento previsto da carteira.
