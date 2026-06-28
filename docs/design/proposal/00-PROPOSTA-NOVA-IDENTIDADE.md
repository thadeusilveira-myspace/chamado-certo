# MamiFIT — Proposta de Nova Identidade Visual (Front-end)
> Do neon disperso ao roxo com intenção: uma experiência que acolhe, recompensa e converte mães.

<sub>Elaborado pelo squad de front-end **Nirvana** · referência visual em [`../screens/`](../screens/) · direções completas em [`./direcoes/`](./direcoes/)</sub>

## 1. Resumo executivo
- **Propomos uma evolução da marca, não uma ruptura.** Mantemos os sinais que as usuárias já amam (roxo, coração 💜, números-herói, gamificação afetiva, copy materna) e corrigimos o que hoje atrapalha: ruído visual, inconsistência e baixo contraste.
- **Direção recomendada: "B — Vibrante & Gamificada (Conquista)"**, disciplinada com a clareza das outras duas direções. É a que mais fideliza a marca atual e a que melhor monetiza o ativo de gamificação que já existe.
- **Ganho de engajamento e retenção:** o glow deixa de ser decoração e vira *recompensa* — celebração afetiva a cada gesto concluído, sem poluir a tela no dia a dia.
- **Ganho de acessibilidade e percepção premium:** texto corrigido para o padrão AA, regra de "no máximo 2 acentos vivos por tela" e uma única linguagem de ícones elevam a leitura e a sensação de produto cuidado.
- **Ganho de conversão:** onboarding com menos "cadeados" no dia 1, empty states que convidam, e upsell apresentado como conquista a alcançar — não como muro.

## 2. Diagnóstico do app atual

**O que funciona (preservar):**
- Identidade roxa coesa e reconhecível — um ativo de marca real.
- Números-herói: comunicam progresso com força e emoção.
- Gamificação afetiva: níveis nomeados (Dedicada→Disciplinada), streak 🔥, medalhas e missões com XP.
- Silhuetas femininas roxas e *color-code por domínio* (cada área com sua cor).
- Copy materna, gentil e acolhedora — diferencial de tom no segmento.

**O que precisa evoluir:**
- **Duas linguagens de ícone** convivendo (emoji 3D vs. linha) — quebra a unidade.
- **Componentes inconsistentes:** chips e tabs com estilos diferentes; glows desiguais entre telas.
- **Contraste abaixo de AA:** texto lavanda (#9B91B5), itens bloqueados e legendas difíceis de ler.
- **Home sobrecarregada** já na primeira dobra — excesso de informação competindo por atenção.
- **Excesso de acentos neon** disputando espaço com o roxo, diluindo a marca.
- **Muito upsell/lock no onboarding** — no dia 1 a mãe já vê quase tudo travado.
- **Empty states fracos** e thumbnails de baixa qualidade no Mami+.

## 3. As três direções (visão geral)

| Critério | A — Serenidade | B — Conquista | C — Clareza |
|---|---|---|---|
| **Mood** | Sereno, acolhedor, premium-suave | Energética, recompensadora, organizada | Sereno, confiante, atemporal |
| **Tema** | Light "Soft" padrão + Dark noturno | **Dark-first** (mantém o atual) | Light padrão + Dark espelho |
| **Paleta-chave** | Lavanda #7E6BA8 / Ametista #5B4A82 + Terracota #D98A6A | Roxo #8B5CF6 + sistema de acentos por domínio | Ametista #6D43C8 + acentos foscos editoriais |
| **Fit com público (mães)** | Alto (descanso, carinho) | **Alto (recompensa + hábito diário)** | Médio-alto (depende de fotos) |
| **Esforço de implementação** | Médio-alto (ilustrações terrosas) | **Médio (evolui o que existe)** | Alto (banco de fotos de qualidade) |
| **Risco principal** | Distancia da marca neon; serifa em mobile | Superestímulo/fadiga visual | Pode parecer frio; depende de fotografia |

## 4. Recomendação do squad

**Recomendamos a Direção B — "Vibrante & Gamificada (Conquista)", refinada com a disciplina das direções A e C.** É a escolha de menor risco de marca e maior retorno: nasce *dark-first* (igual ao app de hoje), preserva o roxo #8B5CF6 e o gradiente de CTA, e — o ponto decisivo — transforma a gamificação que já existe no nosso maior diferencial competitivo. Para uma mãe sobrecarregada, o ciclo "concluí → fui celebrada" é exatamente o gatilho que constrói hábito diário e, com ele, retenção. As outras duas direções são lindas, mas A nos afasta da marca neon que as usuárias reconhecem, e C aposta pesado em um banco de fotos de comida de alta qualidade que ainda não temos — um risco operacional e de custo.

O que **pegamos emprestado** das outras duas para domar o risco da B (superestímulo): da **C**, o respiro editorial (menos caixas aninhadas, separação por espaço e hairline, raios unificados) e a correção de contraste para AA; da **A**, a disciplina de "um acento vivo" — que adaptamos para a regra **"máximo 2 acentos por tela, o resto dessaturado até ativar"** —, sombras neutras suaves e motion mais orgânico. O resultado: a energia recompensadora da B, com a calma e a legibilidade premium das outras duas. As três direções ficam detalhadas na íntegra no Anexo (Seção 8) e em [`./direcoes/`](./direcoes/).

## 5. Sistema de design proposto (Direção B refinada)

### Cores — tokens
| Token | HEX | Uso |
|---|---|---|
| `bg/base` | #171026 | Fundo roxo-noite (dark-first) |
| `bg/elevated` | #1F1633 | Cards e superfícies elevadas |
| `brand/primary` | #8B5CF6 | Roxo primário da marca |
| `brand/cta-from` → `cta-to` | #A78BFA → #7C3AED | Gradiente de botões de ação |
| `text/primary` | #F4F1FA | Texto principal (AA+) |
| `text/secondary` | #C7BEDC | Texto secundário corrigido para AA |
| `accent/streak` | #FF7A45 | Coral-fogo — streak (função fixa) |
| `accent/hydration` | #22C7E0 | Água viva — hidratação |
| `accent/xp` | #FFC53D | Ouro — XP/nível |
| `accent/goal` | #34D399 | Verde — meta cumprida |
| `accent/photo` | #F472B6 | Rosa — foto/registro |

> **Regra de acentos:** cada cor tem função fixa por domínio; no máximo **2 acentos vivos por tela**, o restante fica dessaturado até ser ativado. **Glow = recompensa, nunca decoração.**

### Tipografia
- **Sora** — números-herói e display (peso e personalidade no progresso).
- **Plus Jakarta Sans** — toda a UI (legível, amigável, neutra).

### Componentes-chave
- **Anéis de progresso** grossos com *dot* brilhante; **trio de anéis diário** (ex.: nutrição, hidratação, hábito) como âncora da home.
- **Chips e tabs**: um único estilo, raios unificados (16px), estados claros.
- **Iconografia**: uma só linguagem — linha *rounded* 2px. **Emoji 3D apenas em celebração e medalhas.**
- **Cards** com sombras neutras suaves (sem glow colorido em repouso); separação por espaço e hairline onde possível, reduzindo caixas aninhadas (empréstimo da C).

### Motion
O motion é o coração da Direção B: **count-up** nos números, **partículas** e **onda de água** ao bater metas, **level-up takeover** celebratório — sempre **pulável**. Timings orgânicos (220–320ms) para não cansar.

### Nota de acessibilidade
Todo texto atinge **contraste AA**: secundário migra para #C7BEDC; itens bloqueados e legendas deixam de usar lavanda de baixo contraste. Estados não dependem só de cor (ícone + rótulo). Animações respeitam "reduzir movimento" do sistema.

## 6. Redesenho tela a tela

**Cardápio (Home)**
- **Antes:** primeira dobra sobrecarregada; muitos acentos neon competindo; números-herói diluídos.
- **Depois:** trio de anéis diário como âncora; um número-herói por vez em Sora; máx. 2 acentos vivos; respiro editorial entre blocos. Celebração ao fechar os anéis.

**Cozinha**
- **Antes:** chips/tabs inconsistentes; thumbnails fracas; hierarquia confusa.
- **Depois:** sistema único de chips/tabs; cards de receita com hierarquia clara; ícones de linha unificados; estados de filtro legíveis (AA).

**Mami+**
- **Antes:** thumbnails ruins; conteúdo travado dominando a tela; sensação de "muro" de upsell.
- **Depois:** thumbnails padronizadas e atraentes; conteúdo premium apresentado como *conquista a alcançar* (não cadeado); preview generoso antes do lock.

**Perfil**
- **Antes:** medalhas e níveis presentes, mas sem brilho de recompensa; emoji 3D misturado à UI.
- **Depois:** vitrine de conquistas com emoji 3D reservado a medalhas/celebração; nível nomeado e streak em destaque com glow de recompensa; progresso ao próximo nível com count-up.

**Refeições**
- **Antes:** legendas de baixo contraste; registro pouco gratificante.
- **Depois:** registro com microcelebração (partículas/onda) e XP visível; tipografia AA; foto da refeição (rosa #F472B6) como acento de registro, dentro da regra de 2 acentos.

## 7. Roadmap sugerido de implementação

**Fase 1 — Fundação de tokens & tema**
Definir e implementar os design tokens (cores, tipografia Sora + Plus Jakarta Sans, raios, sombras, regra de acentos) e o tema dark-first. Auditoria e correção de contraste para AA.
> **Quick win inicial:** trocar o texto secundário/legendas para #C7BEDC e corrigir itens bloqueados — ganho de acessibilidade imediato, baixo esforço, visível na primeira release.

**Fase 2 — Biblioteca de componentes base**
Unificar chips, tabs, cards, anéis de progresso e iconografia (linha rounded 2px). Estabelecer a regra "máx. 2 acentos por tela" como propriedade de componente. Padronizar thumbnails do Mami+ e empty states.

**Fase 3 — Migração de telas + motion**
Aplicar o sistema às 5 telas (Cardápio, Cozinha, Mami+, Perfil, Refeições), reorganizar a primeira dobra da home e suavizar o onboarding (menos locks no dia 1). Por último, camada de motion: count-up, partículas, onda de água e level-up takeover pulável.

## 8. Anexo — As três direções na íntegra

> Versões completas (paleta, tipografia, componentes, motion, telas e riscos) em [`./direcoes/`](./direcoes/).

### Direção A — "Calma & Premium (Serenidade)"
**Conceito:** santuário digital de bem-estar; sair do neon para um espaço que respira; conquista como carinho, não como euforia. **Mood:** sereno, acolhedor, premium-suave. **Tema:** Light "Soft" como padrão (fundo Aveia #F6F3EF, cards Branco Leite #FDFCFB) + Dark Noturno dessaturado (#1A1622). **Cores-chave:** roxo dessaturado — Lavanda Empoeirada #7E6BA8 / Ametista Profunda #5B4A82 — com **um** único acento vivo, Terracota Suave #D98A6A. **Tipografia:** Fraunces (serifa soft) para display e números + Inter para UI. **Componentes:** sombras neutras suaves (zero glow colorido), botões fill sólido (sem gradiente), uma única linguagem de ícone de linha 2px, ilustrações terrosas no lugar de emoji 3D, chips/tabs em padrão único. **Motion:** lento e orgânico (220–320ms), "respirado", pétalas no level-up. **Riscos:** distanciamento da marca neon; serifa em mobile; light como padrão pode estranhar; experiência menos lúdica; custo de assets ilustrados.

### Direção B — "Vibrante & Gamificada (Conquista)" — *recomendada*
**Conceito:** cada gesto vira uma vitória que brilha; celebração afetiva contínua. **Mood:** energética, recompensadora, organizada. **Tema:** dark-first (fundo Roxo-noite #171026), mantém o roxo #8B5CF6 + gradiente de CTA #A78BFA→#7C3AED. **Sistema de acento por domínio com função fixa:** Coral-fogo #FF7A45 (streak), Água viva #22C7E0 (hidratação), Ouro #FFC53D (XP), Verde #34D399 (meta), Rosa #F472B6 (foto) — **regra: máx. 2 acentos vivos por tela**, o resto dessaturado até ativar; **glow vira recompensa, não decoração**. Texto corrigido para AA (secundário #C7BEDC). **Tipografia:** Sora (números/display) + Plus Jakarta Sans (UI). **Componentes:** anéis grossos com dot brilhante, trio de anéis diário; iconografia linha rounded 2px; emoji 3D só em celebração/medalhas. **Motion** é o coração: count-up, partículas, onda de água, level-up takeover pulável. **Riscos:** fadiga visual/superestímulo; infantilização; performance em aparelhos modestos; dependência de recompensa extrínseca.

### Direção C — "Editorial & Clean (Clareza)"
**Conceito:** revista de bem-estar materno; cada tela respira; o roxo é tinta, não holofote. **Mood:** sereno, confiante, atemporal. **Tema:** Light padrão (Papel #FAF8F4, Marfim #FFFFFF) + Dark espelho (#14101F). **Cores-chave:** primária Ametista #6D43C8; acentos dessaturados em "fosco editorial" (−25% de saturação). **Tipografia:** duas vozes — Fraunces serifada (títulos e números-herói) + Inter (UI). **Princípio:** menos caixas — separar por espaço e hairline, não por cards aninhados; raios unificados em 16px; quase plano (zero glow, apenas sombra ametista no card em foco). **Componentes:** anel fino único por tela; iconografia stroke 1.75px (Lucide/Phosphor); fotografia de comida como protagonista. **Motion:** discreto, com celebração concentrada apenas no level-up. **Riscos:** pode parecer frio/distante; a gamificação perde brilho; serifa em Android; migração de dark→light pode estranhar; **depende de banco de fotos de qualidade**; acentos dessaturados reduzem a leitura do color-code por domínio.
