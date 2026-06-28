# Direção Visual — "Editorial & Clean (Clareza)"
### Proposta MamiFIT · squad Nirvana

---

## 1. Conceito

> **Uma revista de bem-estar materno na palma da mão: cada tela respira, cada número conta uma história, e nada compete com a sua atenção.**

**Mood:** Sereno · Confiante · Atemporal

---

## 2. Sistema de cores

**Modo:** Ambos (light como padrão/protagonista, dark como espelho fiel). O light vira a cara nova — afasta o app do "neon competindo" e abre espaço editorial; o dark mantém vínculo afetivo com a marca atual.

A regra de ouro: **roxo como tinta, não como holofote.** Cor entra com parcimônia, sempre sobre superfícies neutras quentes (não brancas puras, não pretas frias).

### Light (padrão)

| Token | Nome | HEX | Uso |
|---|---|---|---|
| Primária | Ametista | `#6D43C8` | CTAs, ativos, links, marca (AA sobre branco: 5.6:1) |
| Primária-forte | Ametista Profunda | `#52308F` | texto/ícone roxo sobre claro, estados pressed |
| Primária-suave | Lavanda Névoa | `#EFEAF9` | fundos de chip ativo, halo, seleção |
| Fundo | Papel | `#FAF8F4` | base off-white quente (editorial, não clínico) |
| Superfície | Marfim | `#FFFFFF` | cards, folhas, modais |
| Superfície-2 | Linho | `#F2EFEA` | bloco sutil, empty states, divisórias preenchidas |
| Borda | Traço | `#E6E1DA` | hairlines 1px (sem caixas pesadas) |
| Texto | Tinta | `#1A1626` | títulos, números-herói (AA+++ : 15:1) |
| Texto-2 | Grafite | `#4E4860` | corpo (AA: 8.1:1 — resolve o problema do lavanda) |
| Texto-3 | Névoa | `#736C84` | legendas, metadados (AA: 4.6:1, contra `#FAF8F4`) |

### Dark (espelho)

| Token | Nome | HEX | Uso |
|---|---|---|---|
| Fundo | Ônix Roxo | `#14101F` | base (herda DNA atual, menos saturado) |
| Superfície | Carvão Ametista | `#1E1A2B` | cards |
| Borda | Traço Noturno | `#322C42` | hairlines |
| Primária | Ametista Clara | `#A78BFA` | CTAs/ativos (AA sobre fundo: 6.9:1) |
| Texto | Alvura | `#F4F1FA` | títulos (15:1) |
| Texto-2 | Lavanda Clara | `#C3BBD6` | corpo — **mais clara que o lavanda atual**, agora AA (7.3:1) |
| Texto-3 | Névoa Noturna | `#8E86A6` | legendas (AA: 4.7:1) |

### Acentos (compartilhados — dessaturados, "fosco editorial")

Um acento por domínio, sempre **sólido e fosco** (sem glow). Glows viram **uma sombra colorida muito sutil**, só no card foco do dia.

| Domínio | Nome | HEX (light) | HEX (dark) |
|---|---|---|---|
| Hidratação | Água Calma | `#2E8FB5` | `#5CB8DA` |
| Streak/kcal | Âmbar | `#C77A2E` | `#E8A765` |
| Sucesso/meta/proteína | Sálvia | `#3E875F` | `#6FB58C` |
| XP/nível | Ouro Velho | `#B08322` | `#D9B560` |
| Fibra/foto | Rosa Argila | `#C2638E` | `#E08CB0` |
| Alerta/remover | Telha | `#C0453F` | `#E2756E` |

> Versão original era neon (#38BDF8, #F59E0B…); aqui descemos ~25% de saturação para conviverem em harmonia editorial sem brigar com o roxo. Todos passam AA em texto sobre fundo neutro.

---

## 3. Tipografia

Sistema de **duas vozes**: serifada editorial para títulos/números-herói (dá o ar de revista, atemporal) + sans humanista para tudo funcional.

| Papel | Família | Fallback Google Fonts | Peso |
|---|---|---|---|
| Display / Números-herói | **Fraunces** (serifada "soft", contraste óptico) | Fraunces → Lora | 600 / 9pt optical |
| Títulos de seção | Fraunces | Fraunces → Lora | 500–600 |
| UI / Corpo / Botões | **Inter** (humanista neutra) | Inter → system-ui | 400 / 500 / 600 |
| Eyebrow / Labels | Inter | Inter | 600, tracking +0.08em, CAIXA-ALTA |

*Alternativa 100% segura sem serifa:* **General Sans / Nunito Sans** para títulos + Inter para corpo (mantém calor, perde um pouco da "revista").

### Escala (mobile, base 16)

| Token | Tamanho / Line-height | Uso |
|---|---|---|
| Hero | 52 / 56 — Fraunces 600 | número-herói (kcal restante, dia de streak) |
| Display | 34 / 40 — Fraunces 600 | título de tela |
| Title | 22 / 28 — Fraunces 500 | nome de seção/refeição |
| Body-L | 17 / 26 — Inter 400 | texto principal |
| Body | 15 / 22 — Inter 400 | corpo padrão |
| Label | 13 / 16 — Inter 600 | eyebrow CAIXA-ALTA |
| Caption | 12 / 16 — Inter 500 | metadados (cor Texto-3, nunca abaixo de AA) |

Assinatura tipográfica: **número-herói serifado** + **eyebrow em caixa-alta**. Mantém o "número gigante" do app atual, mas com elegância de capa de revista.

---

## 4. Linguagem de componentes

**Princípio:** menos caixas. Conteúdo separado por **espaço e hairline**, não por cards aninhados. Cada tela tem no máximo 1–2 níveis de superfície.

- **Raios:** unificar em **16px** (cards/folhas), **12px** (chips/inputs), botões **pill** só nos CTAs primários; resto é cantos suaves. Sem squircle 22 + pill + 28 brigando.
- **Sombras/elevação:** quase planas. Cards no light usam **borda hairline `#E6E1DA` + sombra `0 1px 2px rgba(26,22,38,.04)`**. Elevação real (modais/sheets) recebe `0 8px 24px rgba(26,22,38,.10)`. **Zero glow neon** — só o "card foco do dia" ganha sombra ametista difusa (`0 8px 32px rgba(109,67,200,.14)`).
- **Botões:** Primário = pill ametista sólido, texto branco 600. Secundário = pill com borda hairline + texto Ametista. Terciário = texto puro sublinhado-on-press. Sem gradientes.
- **Cards:** superfície Marfim, hairline, padding generoso (20–24), **título serifado + 1 dado**. Nada de card-dentro-de-card.
- **Anéis de progresso:** anel fino (stroke 6px), cor do domínio (fosca), **trilha neutra `#E6E1DA`**, número-herói serifado no centro. Um anel de destaque por tela, não três competindo.
- **Chips:** pill 12px, **um só estilo**: inativo = texto Grafite + borda hairline; ativo = fundo Lavanda Névoa + texto Ametista. Acabou a inconsistência de tabs/chips.
- **Navbar inferior:** flutuante? Não — **fixa, fundo Papel, hairline no topo, sem ilha**. 4 ícones stroke + label 11px. Ativo = ícone Ametista + ponto roxo de 4px abaixo (sem pílula colorida pesada).
- **Iconografia:** **UMA linguagem — stroke 1.75px, cantos redondos, estilo Lucide/Phosphor.** Adeus à dupla linguagem. Emojis 3D saem do produto e ficam **só** na fotografia de comida e em 1 ilustração de empty state. Medalhas viram ícones de linha com preenchimento sálvia/ouro quando conquistadas.

---

## 5. Motion & microinterações

Discreto, físico, nunca festa de confete. **Easing padrão:** `cubic-bezier(.2,.8,.2,1)`, 240–320ms. Respeitar `prefers-reduced-motion`.

1. **Marcar refeição:** o item desliza um *check* circular que se desenha (stroke 220ms) + a linha do menu ganha um leve recuo de cor (fade para Sálvia 6%). Háptico `light`. Sem explosão.
2. **Ganhar XP:** o número de XP **conta para cima** (count-up 600ms) e a barra fina avança com mola suave. Um "+15" sobe 12px e fade-out. Háptico `light`.
3. **Beber água:** toque no copo → **preenchimento líquido** sobe no anel de hidratação (água calma) com ondulação curta; o número central incrementa em count-up. Háptico `soft`.
4. **Subir de nível** (único momento celebrativo): folha sobe (sheet) com o **selo serifado do novo nível** desenhando-se, partículas finas douradas (poucas, lentas, fade) e copy materna. Háptico `success`. É o pico emocional — raro, então pode brilhar.

---

## 6. Redesenho tela a tela

**Cardápio (home).** Primeira dobra = só o essencial: eyebrow "BOM DIA, [NOME]", **número-herói serifado** (kcal restantes ou refeições do dia) e o anel-foco. O resto (missões, streak, comunidade) desce em seções com hairline, escaneáveis. Mata a sobrecarga da 1ª dobra e o excesso de neon.

**Refeições.** Lista vertical limpa, **fotografia de comida grande e valorizada** (16px radius, ocupa largura), título serifado + macros em linha discreta. Marcar = check à direita. Foto vira a estrela; menos chrome ao redor.

**Cozinha.** Grid editorial de receitas: foto protagonista, título serifado de 2 linhas, tempo+porção em caption. Filtros = chips único-estilo no topo. Parece coluna de revista de receitas, não catálogo lotado.

**Mami+.** Resolve os thumbnails ruins: **capas grandes e curadas com overlay de texto serifado**, 1 coluna de cards generosos. Lock vira convite elegante (cadeado stroke + "Desbloqueie com Mami+"), **não** parede de travas no dia 1 — mostra 1 amostra grátis primeiro.

**Perfil.** Topo sóbrio: avatar/silhueta feminina roxa, nome, nível em selo serifado. Métricas em grid 2x2 com hairlines (sem cards-bolha). Medalhas em linha com estados claros (conquistada = ícone preenchido; bloqueada = stroke Névoa com bom contraste, resolvendo o AA dos bloqueados).

---

## 7. Por que serve às mães

Mãe em rotina corrida não tem tempo de decodificar uma tela barulhenta — ela precisa **bater o olho e entender**. A clareza editorial entrega exatamente isso: hierarquia impecável, um número que responde "como estou hoje?" em meio segundo, e zero ruído de neon competindo por atenção. O respiro generoso comunica calma e ausência de culpa (o app não grita com ela), enquanto a fotografia de comida valorizada torna nutrição desejável, não uma planilha. O tom materno em 2ª pessoa continua, agora numa moldura que parece cuidado de qualidade — atemporal, sem a sensação de "app gamificado infantil". É respeito pelo tempo e pela inteligência dela.

---

## 8. Riscos / contras

- **Pode parecer "frio" ou premium-distante** para um produto cuja alma é gamificação afetiva. Mitigação: calor vem do off-white quente (Papel), da serifa "soft" (Fraunces), da fotografia e da copy — não do neon.
- **Gamificação perde brilho:** menos cor e glow pode esvaziar a recompensa de XP/streak/medalhas. Risco real para retenção. Mitigação: concentrar a celebração no **subir de nível** (momento raro e rico) e usar count-up/háptico nos demais.
- **Serifa em telas pequenas/Android:** Fraunces precisa de teste de legibilidade e do plano B (General Sans). Custo de fontes no bundle Expo.
- **Migração do dark→light:** base de usuárias acostumada ao roxo escuro pode estranhar. Mitigação: lançar com toggle e dark como espelho fiel; A/B no padrão.
- **Fotografia vira dependência:** o conceito exige **fotos de comida de qualidade**. Sem um banco curado, a tela editorial expõe o material fraco (o oposto do que esconde um app cheio de cards). É investimento de conteúdo, não só de UI.
- **Acentos dessaturados** podem reduzir a leitura instantânea do code-color por domínio (menos "pop"). Validar com teste rápido de reconhecimento.
