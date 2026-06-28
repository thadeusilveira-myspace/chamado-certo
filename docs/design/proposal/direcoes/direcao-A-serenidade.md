# MamiFIT — Direção Visual "Calma & Premium (Serenidade)"

## 1. Conceito

**Um santuário digital de bem-estar para a mãe: cuidar de si com a mesma calma com que se embala um bebê.** Saímos do "painel neon gamificado" para um espaço que respira — onde cada conquista é um carinho, não um alarme.

**Mood:** Sereno · Acolhedor · Premium-suave.

---

## 2. Sistema de cores

**Modo:** Ambos, com **Light "Soft" como padrão** (mais respiro, sensação de leveza/manhã) e um **Dark "Noturno" dessaturado** como alternativa (para a amamentação noturna, sem o roxo-neon estourado). Roxo permanece como assinatura de marca, porém *dessaturado e empoeirado*.

### Light "Soft" (padrão)

| Papel | Nome | HEX | Contraste |
|---|---|---|---|
| Fundo | Aveia Quente | `#F6F3EF` | base |
| Superfície 1 (card) | Branco Leite | `#FDFCFB` | — |
| Superfície 2 (elevado) | Areia | `#EFEAE3` | — |
| Borda/Divisor | Linho | `#E2DBD0` | — |
| **Primária (marca)** | Lavanda Empoeirada | `#7E6BA8` | 4.6:1 sobre fundo ✓ AA |
| Primária forte (texto/ação) | Ametista Profunda | `#5B4A82` | 7.2:1 ✓ AAA |
| Secundária | Sálvia Calma | `#8AA295` | uso em fills/ilustração |
| **Acento vivo (único)** | Terracota Suave | `#D98A6A` | CTA-destaque, streak, foto — 3.4:1 grande/ícone |
| Sucesso | Verde Folha | `#5E8C6A` | 4.5:1 ✓ AA |
| Alerta/Erro | Âmbar Queimado | `#C2683E` | 4.6:1 ✓ AA |
| Texto primário | Tinta Ameixa | `#2C2438` | 13:1 ✓ AAA |
| Texto secundário | Cinza Ametista | `#5A5266` | 7:1 ✓ AAA |
| Texto apagado | Névoa | `#857C90` | 4.5:1 ✓ AA |

### Dark "Noturno" (dessaturado, sem glow)

| Papel | Nome | HEX | Contraste |
|---|---|---|---|
| Fundo | Ardósia Ameixa | `#1A1622` | base |
| Superfície 1 | Carvão Lavanda | `#241F2E` | — |
| Superfície 2 | Pedra Roxa | `#2E2839` | — |
| Borda | Bruma | `#3B3447` | — |
| Primária | Lavanda Leitosa | `#B7A6D9` | 7:1 ✓ AAA |
| Acento vivo | Terracota Clara | `#E0A081` | 5.2:1 ✓ AA |
| Sucesso | Sálvia Clara | `#86B795` | ✓ AA |
| Texto primário | Marfim | `#F2EEF6` | 14:1 ✓ AAA |
| Texto secundário | Lavanda Névoa | `#B3AAC0` | 5.8:1 ✓ AA |

**Regra de ouro:** UM acento vivo (Terracota) por tela. Os antigos neons (azul-água, laranja-fogo, verde-lima, rosa, ouro) viram tons **dessaturados e terrosos** da mesma família, usados só como *codificação sutil* — nunca como glow. Resolve "excesso de acentos competindo" + "contraste abaixo de AA".

---

## 3. Tipografia

- **Display & Títulos:** *Fraunces* (serifa suave/humanista, "soft serif") — traz o toque premium-editorial e materno que sans geométrica não dá. Fallback Google Fonts: **Fraunces**. Alternativa segura: **Lora**.
- **Corpo & UI:** *Inter* (neutra, legível em densidade alta de dados). Fallback: **Inter**. Para números-herói, usar Fraunces ou **Inter Tight**.
- **Eyebrow labels:** Inter, 12px, *tracking +8%*, **caixa-alta suave** ou Title Case (menos agressivo que all-caps puro), na cor Cinza Ametista — não mais roxo gritante.

**Escala (mobile):**

| Token | Fonte/Peso | Tamanho/Leading |
|---|---|---|
| Número-herói | Fraunces 600 | 56 / 60 |
| Display | Fraunces 600 | 32 / 38 |
| Título (H1 card) | Fraunces 600 | 22 / 28 |
| Subtítulo | Inter 600 | 17 / 24 |
| Corpo | Inter 400 | 15 / 22 |
| Corpo-forte | Inter 500 | 15 / 22 |
| Legenda | Inter 500 | 13 / 18 |
| Eyebrow | Inter 600 | 12 / 16 (+8% tracking) |

Mantemos a **assinatura "números-herói"** — mas em serifa suave, ficam elegantes em vez de esportivos.

---

## 4. Linguagem de componentes

- **Raios:** consistentes e calmos. Cards `20px`, superfícies grandes `24px`, botões `pill (full)`, inputs/chips `14px`, avatares/ícones-container `16px (squircle)`. Sem o squircle 22 misturado.
- **Sombras/elevação:** trocar glows coloridos por **sombras suaves e neutras**, difusas e baixas: `y8 blur24 rgba(44,36,56,0.06)` (nível 1), `y12 blur32 rgba(44,36,56,0.09)` (nível 2). No Dark: sem sombra, apenas mudança de superfície + borda Bruma. Zero glow colorido.
- **Botões:** primário = **fill sólido** Ametista Profunda (não gradiente), texto Marfim, pill. Destaque/CTA principal = **Terracota Suave sólido**. Secundário = *ghost* com borda Linho. Terciário = texto Ametista. Remove os gradientes roxos.
- **Cards:** Branco Leite sobre Aveia, borda Linho `1px`, sombra nível 1, padding generoso `20px`. Card-destaque NÃO usa glow: usa **fundo Lavanda Empoeirada a 12%** + borda lavanda sutil.
- **Anéis de progresso:** traço grosso `8px`, cantos arredondados, trilha em Linho, preenchimento em **tom dessaturado do domínio** (hidratação = Sálvia-azulada `#7FA3AD`, nutrição = Lavanda, meta = Verde Folha). Animação de preenchimento suave, sem brilho.
- **Chips/tabs:** UM só padrão. Chip = pill `14px`, inativo = fill Areia + texto Cinza Ametista; ativo = fill Lavanda 16% + texto Ametista Profunda + sem borda. Resolve a inconsistência de chips/tabs.
- **Navbar inferior:** fundo Branco Leite com leve blur, sem borda dura (sombra superior sutil). 4 abas, **ícone de linha 2px + label sempre visível**. Aba ativa = ícone preenchido suave + indicador "pílula" Lavanda 16% atrás do ícone. Sem FAB neon.
- **Iconografia (UMA linguagem):** **ícones de linha 2px, cantos arredondados, paleta monocromática** (Ametista no claro, Lavanda Leitosa no escuro). Adeus aos emojis 3D claymorphism. Para comidas/medalhas, usar **ilustrações de linha com 1 fill terroso** (mesma família), garantindo coerência. Streak = chama de *linha*, não emoji.

---

## 5. Motion & microinterações

Tom geral: **lento, orgânico, "respirado"** — easing `ease-out` suave (220–320ms), nada de bounces elásticos espalhafatosos. Respeitar `prefers-reduced-motion`.

1. **Marcar refeição:** o card faz um leve "afundar e voltar" (scale 0.98→1), o anel de nutrição preenche suavemente o segmento, e um *check de linha* se desenha (stroke draw 300ms). Micro-haptic suave. Copy: "Anotado, mami 💜".
2. **Ganhar XP:** sem explosão de partículas. O número-herói de XP **conta para cima** (count-up 600ms) e uma faixa Terracota desliza por baixo do número. Toast discreto que entra de baixo e dissolve.
3. **Beber água:** toque no copo → **preenchimento líquido sobe** dentro do ícone (clip-mask, 400ms ease-out) com leve ondulação única, cor Sálvia-azulada. Haptic "gota".
4. **Subir de nível:** transição de tela cheia **calma e cerimoniosa**: fundo escurece levemente, o novo nome do nível (ex: "Disciplinada") aparece em Fraunces com fade-up, um anel se completa devagar, confete substituído por **pétalas/folhas suaves** caindo lentas. Mensagem materna, botão "Continuar" pill Terracota.

---

## 6. Redesenho tela a tela

**Cardápio (Home).** Primeira dobra **descongestionada**: saudação materna em Fraunces + 1 número-herói (kcal/meta do dia) num único card-destaque sereno. Anéis e missões descem para blocos roláveis com respiro. Tira-se metade dos acentos; só Terracota guia o olho para a ação do momento.

**Refeições.** Lista em cards Branco Leite com ilustração-de-linha terrosa por prato (não emoji 3D), macros como mini-anéis dessaturados. Ação "marcar" clara e tátil. Thumbnails substituídas por ilustração consistente — resolve baixa qualidade.

**Cozinha.** Vira um espaço editorial calmo: receitas em cards grandes com tipografia serifada, foto tratada com leve overlay quente para uniformizar qualidade. Filtros = chips do padrão único. Menos "grid de app", mais "revista de bem-estar".

**Mami+.** Em vez de tudo travado com cadeado no dia 1, mostra **1–2 conteúdos abertos** + prévia suave do resto. Thumbnails padronizadas com overlay/ilustração; selo premium discreto em Terracota (não neon). Reduz o "muro de upsell" do onboarding.

**Perfil.** Gamificação afetiva mantida, porém serena: nível em Fraunces, jornada de medalhas como **trilha ilustrada de linha** (não grid de emojis), streak com chama-de-linha. Empty states acolhedores: ilustração + frase materna ("Sua jornada começa hoje, um passo de cada vez") em vez de zeros frios.

---

## 7. Por que serve às mães

Mães em rotina corrida vivem em estado de alerta — o último lugar onde querem mais barulho é num app que deveria ser autocuidado. A direção Serenidade troca o estímulo neon (que compete pela atenção já escassa delas) por **calma visual, respiro e clareza de um foco por tela**, reduzindo carga cognitiva. A serifa suave e os tons terrosos comunicam *cuidado premium e maternal* — sinalizam "este é um espaço para você", não "mais uma tarefa". A gamificação permanece, mas como afago: conquistas viram carinhos sutis, não cobranças. É um app que abraça em vez de apitar.

---

## 8. Riscos / contras

- **Distanciamento da marca atual:** sair do roxo-neon vibrante pode parecer "menos energético/fitness"; risco de usuárias fiéis estranharem. *Mitigar:* manter roxo (dessaturado) + 💜 + números-herói como âncoras.
- **Serifa em UI mobile:** Fraunces exige cuidado de hinting/tamanho mínimo; em telas densas de dados pode perder legibilidade. *Mitigar:* serifa só em display/títulos/números; corpo em Inter.
- **Light como padrão:** parte do público pode preferir o dark atual (uso noturno/amamentação). *Mitigar:* Dark Noturno bem resolvido + toggle fácil.
- **"Premium calmo" pode soar menos lúdico:** gamificação afetiva corre risco de perder o "punch" dopamínico. *Mitigar:* motion caloroso e copy materna seguram o engajamento sem neon.
- **Acento terracota** afasta-se da família roxa: se mal dosado, pode brigar com a marca. *Mitigar:* uso parcimonioso (1 por tela) e validação de contraste.
- **Custo de migração:** trocar emoji 3D por sistema ilustrativo de linha exige produção de assets nova e consistente (esforço de design não trivial).
