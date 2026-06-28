# Direção Visual — "Vibrante & Gamificada (Conquista)" para MamiFIT

> **Direção recomendada pelo squad** (ver [proposta consolidada](../00-PROPOSTA-NOVA-IDENTIDADE.md)).

## 1. Conceito

> **"Cada pequeno gesto vira uma vitória que brilha: o app celebra a mãe a cada toque, transformando rotina em jogo afetivo."**

**Mood:** Energética · Recompensadora · Organizada (vibrante sem caos).

---

## 2. Sistema de Cores

**Modo:** Dark-first com superfícies elevadas mais claras (não há light mode na v1; o dark roxo é brand signal e reduz fadiga noturna — horário típico da mãe). Diferença-chave da versão atual: **fundo levemente menos preto e mais saturado** para dar energia, e **um sistema de acento por domínio** (cada cor tem função fixa, nunca decorativa solta).

### Base / Fundo
| Token | Nome | HEX |
|---|---|---|
| `bg/root` | Roxo-noite | `#171026` |
| `bg/deep` | Roxo-abismo (gradiente base) | `#0F0A1E` |
| `surface/1` | Superfície card | `#211833` |
| `surface/2` | Superfície elevada | `#2A1F42` |
| `surface/hi` | Card destaque (topo gradiente) | `#3A2A5E` |
| `border/hairline` | Borda fina | `#3A2E55` |

### Primária (brand)
| Token | Nome | HEX |
|---|---|---|
| `primary` | Roxo MamiFIT | `#8B5CF6` |
| `primary/strong` | Roxo profundo | `#7C3AED` |
| `primary/tint` | Roxo claro (texto/ícone sobre dark) | `#C4B5FD` |
| Gradiente CTA | Lilás→Roxo | `#A78BFA → #7C3AED` |

### Acentos por domínio (sistema fixo — cada um com 1 função)
| Domínio | Nome | HEX | Uso único |
|---|---|---|---|
| Streak / energia | Coral-fogo | `#FF7A45` | streak 🔥, kcal |
| Hidratação | Água viva | `#22C7E0` | anel água, copos |
| Conquista / XP | Ouro-conquista | `#FFC53D` | XP, nível, medalhas |
| Meta / nutrição+ | Verde-vitória | `#34D399` | proteína, meta batida, comunidade |
| Foto / afeto | Rosa-mami | `#F472B6` | fibra, foto, "amei" |

> **Regra anti-neon:** no máximo **2 acentos vivos por tela** + o roxo. Os demais aparecem dessaturados (`opacity 40%`) até serem ativados. Acento vivo = só quando há ação/progresso real. Isso resolve o "neon caótico" do app atual.

### Feedback
| Token | Nome | HEX |
|---|---|---|
| `success` | Verde-vitória | `#34D399` |
| `warning` | Âmbar | `#FBBF24` |
| `danger` | Vermelho-coral | `#F87171` (mais suave que `#EF4444`, menos punitivo) |

### Texto (corrigido para AA)
| Token | Nome | HEX | Contraste sobre `#171026` |
|---|---|---|---|
| `text/primary` | Branco | `#FFFFFF` | 15.9:1 ✓ AAA |
| `text/secondary` | Lavanda-claro | `#C7BEDC` | ~9:1 ✓ AAA (era `#9B91B5` ≈ 4.3) |
| `text/muted` | Lavanda-médio | `#9F95B8` | ~4.8:1 ✓ AA (só para legendas ≥14px) |
| `text/on-gradient` | Branco | `#FFFFFF` | sobre roxo `#7C3AED` ≈ 4.7 ✓ AA |

> Itens **bloqueados** deixam de usar cinza-apagado de baixo contraste: passam a usar `text/secondary` + cadeado em ouro dessaturado, garantindo legibilidade.

---

## 3. Tipografia

- **Display / Números-herói:** **Clash Display** ou **Sora** (geométrica com personalidade). Fallback Google Fonts: **Sora**.
- **UI / Corpo:** **Plus Jakarta Sans** (arredondada, calorosa, ótima legibilidade mobile). Fallback: **Nunito Sans** / **Inter**.
- Manter UMA família de números-herói em todo o app (assinatura).

| Estilo | Fonte | Tamanho | Peso | Tracking |
|---|---|---|---|---|
| Hero number | Sora | 56–72 | 800 | -1% |
| Display | Sora | 32 | 700 | -0.5% |
| Título (H1/card) | Plus Jakarta | 22 | 700 | 0 |
| Subtítulo | Plus Jakarta | 17 | 600 | 0 |
| Corpo | Plus Jakarta | 15–16 | 400/500 | 0 |
| Eyebrow (CAIXA-ALTA) | Plus Jakarta | 12 | 700 | +8% |
| Legenda | Plus Jakarta | 13 | 500 | 0 |

---

## 4. Linguagem de Componentes

- **Raios:** cards 24px · card-hero 28px · botões pill (full) · chips 16px · ícone-container squircle 20px. Consistência total (resolve chips/tabs desiguais).
- **Elevação:** 3 níveis fixos. `e1` sombra suave preta 8% + borda hairline; `e2` 16% + leve glow roxo; `e3` (hero/celebração) glow colorido do domínio. **Glow vira recompensa, não decoração** — só o card "ativo do dia" e celebrações brilham.
- **Botões:** Primário = pill gradiente lilás→roxo com sombra-glow roxa sutil + estado pressed que afunda 2px e clareia. Secundário = pill outline `primary/tint`. Terciário = texto roxo. Botão de ação principal (marcar refeição) ganha tamanho e leve pulse de "convite".
- **Cards:** superfície `surface/1`, borda hairline, raio 24. Card-do-dia = `surface/hi` com gradiente e glow no acento do domínio.
- **Anéis de progresso:** anel grosso (10–12px) com gradiente do domínio, fundo do trilho `surface/2`, ponta arredondada e um "dot" brilhante que percorre. Anel completo dispara glow + checkmark. Trio de anéis (calorias/água/hábitos) como assinatura de progresso diário.
- **Chips:** pill 16px, dois estados claros — inativo (`surface/2`, texto secundário) e ativo (fill do acento + texto escuro/branco AA). Um único componente em todo o app.
- **Navbar inferior:** 4 abas, fundo `surface/1` com blur, ícone ativo em pill roxa com leve glow + label sempre visível (não só ícone). Botão central elevado opcional para "registrar" (FAB squircle gradiente).
- **Iconografia:** UMA linguagem — **ícones de linha arredondados, peso 2px, cantos suaves** (estilo Phosphor/Lucide-rounded) em todo o app. Emoji 3D claymorphism é **aposentado da UI funcional** e fica restrito a um lugar: ilustrações de celebração/medalhas (recompensa), nunca competindo com a navegação. Resolve as "duas linguagens".

---

## 5. Motion & Microinterações (o coração desta direção)

1. **Marcar refeição ✓** — toque dispara: card faz *scale 0.97→1.03→1*, o anel de calorias preenche com easing *spring*, um burst curto de partículas roxas/ouro sai do checkmark e o número-herói de kcal "rola" (count-up animado). Haptic *success*. Microcopy: "Boa! Mais uma vitória 💜".

2. **Ganhar XP** — chip de XP voa do ponto de ação até a barra de nível (motion path), a barra preenche com *ease-out*, e o "+15" surge e sobe esmaecendo (float-up). Som/haptic leve opcional.

3. **Beber água** — toque no "+copo": a onda de água sobe dentro do anel/garrafa (mask animada), gota cai com *bounce*, anel água-viva pulsa uma vez. Ao bater a meta, o anel brilha e vira um mini-confete azul.

4. **Subir de nível (Dedicada→Disciplinada)** — *takeover* de tela curto (1,5s, **pulável**): medalha 3D entra com *spring + glow*, confete contido, título "Você subiu de nível!", botão "Continuar". Reserva-se a celebração maior só aqui para que tenha peso — evita que tudo celebre sempre (anti-fadiga).

> Princípios: durações 150–350ms (celebração ≤1,5s), *spring* natural, **toda animação é pulável e respeita "reduzir movimento"** do sistema. Recompensa proporcional ao esforço (toque pequeno = micro-feedback; meta do dia = celebração).

---

## 6. Redesenho Tela a Tela

**Cardápio (Home).** Primeira dobra enxuta: saudação materna + **trio de anéis do dia** (calorias/água/hábitos) como herói único, e UM card "próxima refeição" com CTA grande. Streak e XP viram uma barra fina no topo, não cards concorrentes. Resto entra ao rolar. Resolve a 1ª dobra sobrecarregada.

**Refeições.** Lista de cards com foto (ou ilustração-placeholder de qualidade quando sem foto), macros como mini-chips coloridos por domínio, e o botão "marcar" com toda a microinteração de XP/anel. Empty state acolhedor: "Seu dia está começando — registre o café 💜" com ilustração, nunca só "0".

**Cozinha.** Grid de receitas 2 colunas, thumbnails maiores e padronizadas (aspect ratio fixo), chip de filtro único e consistente. Cada receita mostra tempo + 1 selo (ex.: "rápida", "proteica") em verde-vitória. Foco em "o que dá pra fazer hoje em 15min".

**Mami+.** Reduzir o muro de cadeados: mostrar 1–2 conteúdos abertos + jornada visível ("desbloqueie ao chegar no nível X"), thumbnails em alta qualidade e consistentes. Lock vira *promessa de conquista* (ouro), não barreira cinza. Menos upsell agressivo no dia 1.

**Perfil.** Vitrine de conquista: nível com anel de XP grande (número-herói), medalhas em grid (as conquistadas brilham, as futuras aparecem como silhueta-roxa convidativa, legível). Streak em destaque com fogo coral. Silhueta feminina roxa mantida como brand. Tom: "Olha o quanto você já cresceu".

---

## 7. Por que serve às mães

Mães em rotina corrida têm pouco tempo e muita culpa acumulada; esta direção troca cobrança por **celebração de micro-vitórias**, dando dopamina saudável a cada gesto pequeno (marcar um copo d'água já é vitória). A clareza visual e o contraste corrigido reduzem esforço cognitivo num momento de cansaço, enquanto a gamificação afetiva — anéis, streak, níveis nomeados — cria um hábito leve e recompensador sem parecer mais uma "tarefa". O tom continua materno, em 2ª pessoa e sem julgamento, e cada celebração reforça pertencimento e progresso, não perfeição.

---

## 8. Riscos / Contras (honesto)

- **Fadiga visual / superestímulo:** cores vivas + motion podem cansar no uso diário. *Mitigação:* regra dos "máx. 2 acentos por tela", glow só como recompensa, celebrações grandes reservadas a marcos.
- **Infantilização:** gamificação forte + confete podem soar pueril para parte do público adulto. *Mitigação:* tipografia adulta e elegante (Sora/Jakarta), copy madura, celebrações contidas e puláveis.
- **Performance:** partículas, springs e masks de água custam frame-rate em aparelhos modestos (público amplo no BR). *Mitigação:* respeitar "reduzir movimento", animações leves (Reanimated/Skia com fallback), degradar graciosamente.
- **Dependência de recompensa extrínseca:** excesso de XP pode ofuscar o valor real (nutrição). *Mitigação:* recompensa sempre atrelada a hábito real, nunca a vaidade de pontos.
- **Acessibilidade de cor:** acento como portador de significado pode falhar para daltônicos. *Mitigação:* sempre par cor+ícone+label, nunca só cor.
- **Risco de "neon" voltar:** sem disciplina de design tokens, a regra anti-neon se perde. *Mitigação:* sistema de tokens com função fixa por acento documentado.
