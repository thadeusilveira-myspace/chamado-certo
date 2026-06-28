# Brief de Design — Auditoria do app atual (MamiFIT)

> Insumo do squad Nirvana. Auditoria visual das 9 telas atuais em [`../screens/`](../screens/).

## 1. Linguagem visual atual

### Paleta (hex aproximado)
**Fundos**
- Fundo base / topo: roxo-quase-preto com leve gradiente vertical `#15102A → #0E0A1C` (mais arroxeado no topo da Home, mais neutro nas telas internas).
- Superfície de card: `#1C1430` a `#241A3D` (cards translúcidos sobre o fundo, com borda sutil `#2E2447`).
- Card destacado/perfil: gradiente roxo `#3A2A6B → #241A3D` com glow externo difuso.

**Primária e acentos**
- Roxo primário (marca/CTA): `#8B5CF6` / `#7C3AED`, com botões em gradiente `#A78BFA → #7C3AED`.
- Roxo de texto/label: `#A78BFA` (labels em caixa-alta, "Ver níveis", percentuais).
- Azul-água (hidratação, anel do dia, badge medalha): `#38BDF8 → #0EA5E9`.
- Laranja/fogo (streak, kcal, energia): `#F59E0B / #FB923C`, ícone de chama com glow quente.
- Verde (comunidade WhatsApp, proteína, meta de peso, "Hortifruti"): `#22C55E / #34D399`.
- Amarelo-ouro (badge "NÍVEL 2", "Dedicada", barra de XP): `#FBBF24 → #F59E0B`.
- Vermelho/coral (botão remover água, "Sair da conta"): `#EF4444 / #F87171`.
- Rosa/magenta (fibra, missão "foto de progresso"): `#EC4899 / #F472B6`.

**Texto**
- Branco quase puro `#FFFFFF` para títulos.
- Cinza-lavanda `#9B91B5` para textos secundários/descrições.
- Cinza-apagado `#6B6280` para itens bloqueados e legendas.

### Tipografia, peso e hierarquia
- Sans-serif geométrica/arredondada (estilo SF Pro / Inter / Nunito-bold).
- **Eyebrow labels** em CAIXA-ALTA, tracking largo, roxo (`BOA TARDE · JUNHO`, `SEU DIA EM ANÉIS`, `CORREDORES`, `MISSÕES DE HOJE`, `NOVA SÉRIE · JUN`).
- **Títulos** muito bold (700–800), grandes (`Thadeu teste`, `Sua jornada`, `Desafio 21 dias`).
- **Números-herói** gigantes e bold para métricas (`4 itens`, `8 /11 copos`, `72,0 kg`, `0 dias`) — números grandes, unidade pequena ao lado. Forte assinatura visual.
- Corpo/descrição em peso regular, cor lavanda, tamanho confortável.
- Hierarquia consistente: eyebrow roxo → título branco bold → número-herói → descrição apagada.

### Cantos, sombras e glows
- Raios generosos: cards ~20–28px, botões pill totalmente arredondados, chips/abas pill, ícones-app em squircle ~22px.
- Sombras escuras suaves + **glows coloridos** característicos: água/azul, chama/laranja, CTA roxo, banner WhatsApp verde, todos com halo difuso. Glow é elemento de marca recorrente.
- Bordas finas translúcidas (~1px, `#FFFFFF` 6–10%) delimitando cards no fundo escuro.

### Iconografia
- **Dupla linguagem (inconsistência):**
  - Emojis/ícones 3D "claymorphism" coloridos e volumétricos: refeições (ovo na frigideira, pão, banana, café, prato, sanduíche), corredores (alface, caixa, copo de leite), badge de café da manhã (sol laranja), medalhas 3D (pingente de água, medalhas de metal travadas).
  - Ícones de linha (stroke) minimalistas: navbar, engrenagem, lupa, câmera, setas, ícones de missão em tiles coloridos translúcidos.
- Macronutrientes representados por mini-emojis coloridos (proteína verde, carbo trigo/dourado, gordura gota azul, fibra folha rosa).
- Silhuetas femininas em gradiente roxo para as fotos de progresso (frente/lado/costas) — bom toque de marca.

### Espaçamento
- Respiro vertical generoso entre blocos; cards bem separados.
- Padding interno confortável nos cards.
- Densidade média-alta na Home (muitos blocos competindo); telas internas mais arejadas.

---

## 2. Padrões de componentes
- **Cards**: superfície escura translúcida, raio grande, borda fina, frequentemente com eyebrow + título + número-herói. Variante "destaque" com gradiente roxo + glow (card de perfil/XP, banner WhatsApp, CTA de lista).
- **Botões**:
  - Primário pill em gradiente roxo com glow (`Liberar minha lista completa`, `+ 1 copo`, `Adicionar`).
  - Primário branco sobre mídia (`Assistir conteúdo` no Mami+).
  - Secundário/ghost: pill com borda roxa e fundo translúcido (`Registrar peso`, `Restaurar itens`).
  - Destrutivo: outline vermelho (`Sair da conta`).
- **Anéis de progresso**: anel circular em torno do número do dia (azul-água, parcialmente preenchido) no seletor de dias e no calendário. Anel grande "Seu dia em anéis" (atualmente vazio/concêntrico cinza). Anel de XP da sequência.
- **Chips / abas (tabs)**: pill segmentado — ativo preenchido (roxo sólido ou branco), inativos translúcidos. Usado em Cozinha (Lista/Receitas; Diário/Semanal/Mensal), Mami+ (Para Você/Continuar/Concluídos), Perfil (Calendário/Metas/Preferências).
- **Navbar inferior**: 4 abas (Cardápio, Cozinha, Mami+, Perfil) com ícone de linha + label; ativo em roxo com sublinhado roxo curto. Fundo escuro com leve elevação.
- **Badges de XP**: pill com cor por categoria (`+15 XP` verde, `+10 XP` azul, `+5 XP` rosa) — bom code-color por tipo de missão.
- **Estados bloqueados / cadeado**: ícone de cadeado em tile roxo; refeições futuras com cadeado e texto apagado; medalhas travadas em cinza-metal ("bloqueada"); CTAs de upsell ("Liberar minha lista completa", "+ 1 item na sua lista completa", "PRÉVIA"). Padrão de monetização recorrente: conteúdo visível mas travado para conversão.
- **Tags de estado**: pill `NOVO` roxo, pill `PRÉVIA` roxo translúcido, badge `Meta 70,0 kg` verde.

---

## 3. Tom emocional e público
- **Público:** mães, em rotina corrida, buscando emagrecimento/hábitos saudáveis sem complexidade.
- **Tom:** acolhedor, encorajador e leve — linguagem informal e materna em 2ª pessoa ("Vamos começar", "Comece hoje, marque uma refeição 🔥", "Pra trocar um item, é só trocar lá…", "Pra ficar perfeito"). Sem culpa, foco em pequenas vitórias.
- Gamificação como motivação afetiva (níveis com nomes — Dedicada, Disciplinada; streak; medalhas), não competitiva.
- Estética "premium dark + neon suave" que passa modernidade e cuidado, equilibrada com emojis amigáveis para não intimidar.

---

## 4. Pontos fortes a preservar
- **Identidade visual forte e coesa de cor**: dark roxo + glows neon coloridos é memorável e premium.
- **Números-herói** grandes — leitura rápida das métricas que importam (água, peso, itens, XP).
- **Gamificação afetiva bem dosada**: níveis nomeados, streak com chama, medalhas, missões com XP color-coded.
- **Silhuetas femininas em gradiente roxo** (fotos do mês) — assinatura visual elegante e inclusiva.
- **Code-color consistente por domínio**: água=azul, energia/streak=laranja, proteína/meta=verde, fibra=rosa.
- **Copy materna e gentil**, com microcopy útil ("~2 min" por corredor, dicas "Pra ficar perfeito").
- Banner de comunidade no WhatsApp — bom gancho de retenção/social.

---

## 5. Problemas / fraquezas e oportunidades

**Consistência**
- **Duas linguagens de ícone competindo** (emoji 3D claymorphism vs. ícones de linha) sem regra clara. Definir: quando 3D, quando stroke.
- Estilos de chip/aba variam (ativo ora roxo sólido, ora branco — Mami+). Padronizar componente de tab.
- Glows aplicados de forma desigual; alguns cards com halo forte, outros chapados. Criar tokens de elevação/glow.

**Contraste / acessibilidade**
- Texto secundário cinza-lavanda sobre fundo roxo escuro fica abaixo de AA em vários pontos (descrições, "bloqueada", legendas, números de dias inativos no calendário).
- Itens bloqueados ficam quase ilegíveis (intenção de design, mas prejudica leitura).
- Anel/percentual roxo sobre escuro e a barra de XP fina podem ter contraste insuficiente.
- Legendas das fotos do mês (`corpo todo`, `perfil direito`) cortadas/encostadas na borda inferior do card (tela 08).

**Densidade / ruído visual**
- **Home (01) sobrecarregada**: saudação + streak + banner WhatsApp + seletor de dias + anéis + água + humor + prévia de refeição, tudo na primeira dobra. Muitas cores neon simultâneas competem por atenção.
- Anel grande "Seu dia em anéis" vazio (estado inicial) ocupa muito espaço sem informação — melhorar empty state.
- Mistura de muitos acentos (verde, azul, laranja, rosa, amarelo, roxo) numa só tela reduz a primazia do roxo da marca. Considerar paleta de acento mais contida por contexto.

**Monetização vs. clareza**
- Forte presença de upsell/locks (refeições travadas com cadeado, "Liberar lista completa", "PRÉVIA", "+1 item") pode gerar frustração no onboarding (usuário ainda em 0 XP / dia 1 já vê muito conteúdo bloqueado).
- "Indique e Ganhe (Pix)" e "Sair da conta" lado a lado no fim do Perfil — hierarquia de ações comerciais vs. utilitárias pouco clara.
- Banner de comunidade WhatsApp verde brilhante compete visualmente com o conteúdo principal logo no topo.

**Outras oportunidades**
- Empty states pouco motivadores onde tudo está em 0 (dia/anéis/streak) — reforçar primeira ação clara.
- Mami+ usa imagens com baixo apelo/qualidade (lata de refrigerante com texto distorcido) — curar thumbnails.

---

## 6. Brand signals a manter
- **Nome "MamiFIT"** e o selo "PROGRAMA MAMIFIT" / "Medalhas MamiFIT".
- **Coração roxo** (logo Mami+ e emoji 💜 na saudação) — assinatura afetiva da marca.
- **Roxo como cor primária** sobre tema escuro, com glows neon suaves.
- **Gamificação leve**: níveis nomeados (Dedicada → Disciplinada), streak com chama 🔥, medalhas (2/12), missões com XP.
- **Silhueta feminina roxa** como ícone de progresso corporal.
- **Linguagem materna acolhedora** em 2ª pessoa, com microcopy gentil e emojis amigáveis.
- **Números-herói grandes** como padrão de exibição de métricas.
