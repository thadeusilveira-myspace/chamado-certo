# Radar de Pedidos

A interface principal da operação. Substitui "lembrar de quem mandar
mensagem" por uma fila diária calculada, com receita esperada em risco.

## O painel diário

```
SEXTA-FEIRA — 94 clientes analisados

🔴 18 clientes deveriam ter pedido e ainda não pediram   (PEDIDO EM RISCO)
🟡 21 clientes precisam de contato hoje                  (CONTATO DEVIDO)
🟢 37 pedidos já confirmados                             (CONFIRMADO)
⚪ 18 clientes sem necessidade de contato                (FORA DE CICLO)

Potencial de pedidos faltantes: R$ 14.800
```

Cada linha 🔴/🟡 abre com: perfil do cliente, previsão (quantidade + valor),
sugestão de mensagem pronta e o histórico da conversa.

## Estados

| Estado | Definição | Ação |
|---|---|---|
| 🟢 `confirmado` | Pedido do ciclo atual já registrado | Nenhuma |
| 🟡 `contato_devido` | Hoje é o dia típico de contato/confirmação do cliente e ainda não há pedido | Abordagem proativa (IA ou humano, conforme nível) |
| 🔴 `em_risco` | Passou do momento em que o cliente normalmente já teria confirmado, e não confirmou | Prioridade máxima; abordagem + acompanhamento; se não responder, escalar para humano |
| ⚪ `fora_de_ciclo` | Próximo pedido esperado ainda está longe | Nenhuma |
| ⚫ `esfriando` | Passou de N ciclos sem comprar (ex.: 2× o ciclo típico) | Fluxo de recuperação de inativo (humano decide a abordagem) |

## Motor de previsão: heurísticas antes de ML

Com carteira de ~100 clientes e ciclos semanais, estatística simples resolve
e é 100% explicável. **Não começar com machine learning.**

Por cliente, a partir do histórico de pedidos:

```
intervalos        = dias entre pedidos consecutivos (últimos ~10)
ciclo_mediano     = mediana(intervalos)
desvio            = MAD(intervalos)            -- desvio absoluto mediano
proxima_esperada  = data_ultimo_pedido + ciclo_mediano
dia_confirmacao   = moda do dia-da-semana/hora em que o cliente confirma

contato_devido    quando hoje >= (proxima_esperada - lead_confirmacao)
                  -- lead_confirmacao: quanto antes o cliente costuma
                  --  confirmar (ex.: confirma quinta p/ entrega sexta)
em_risco          quando hoje > proxima_esperada + desvio, sem pedido
esfriando         quando hoje > data_ultimo_pedido + 2 × ciclo_mediano
```

**Probabilidade de compra na semana** (o "87%"): fração histórica de ciclos
em que o cliente comprou dentro da janela equivalente. Simples, honesto e
explicável para a equipe. Refinamentos (sazonalidade, tendência) vêm depois,
quando houver dados que os justifiquem.

**Valor em risco**: `quantidade_mediana × preço_atual` dos clientes 🔴 —
é o número que aparece no topo do painel.

Clientes com menos de 3 pedidos registrados ficam como `sem_historico` e
aparecem numa fila separada para tratamento humano.

## Quando o radar recalcula

1. **Job diário** (ex.: 6h): recalcula a carteira inteira e grava
   `radar_snapshot` do dia — o snapshot é imutável e permite medir depois
   "o que o radar previu vs. o que aconteceu".
2. **Por evento**: pedido registrado → cliente vai para 🟢 na hora; resposta
   de cliente classificada como "confirmou" → 🟢; "adiou para semana que
   vem" → recalcula `proxima_esperada`.

## O conceito de "pedido em risco" na prática

> A Padaria João compra 6 pacotes toda sexta, ticket médio R$ 620,
> normalmente confirma quinta de manhã. É quinta, 14h, e não há pedido.

O sistema não espera sexta para descobrir que o pedido não veio. Na quinta
às 14h o cliente já está 🔴, com uma abordagem sugerida:

> "Carlos, estou organizando a rota de sexta. Coloco as 6 caixas de sempre?"

Isso muda o objeto administrado: **de mensagens para receita esperada**.

## Medição da qualidade do radar

Comparar snapshot vs. realidade, semanalmente:
- % dos 🔴 que viraram pedido após ação (recuperação);
- % dos 🟢 previstos que realmente pediram na data esperada (precisão do ciclo);
- falsos alarmes (🔴 que pediria de qualquer forma — detectável por clientes
  que pedem espontaneamente logo após o alerta, sem abordagem enviada).

Esses números calibram `lead_confirmacao` e o limiar de risco por cliente.
