# Receita do vídeo — Cidade dos Influenciadores

> Arquivo para retomar a geração do vídeo após reiniciar a sessão.
> Tudo abaixo já está pronto: basta chamar `generate_video` com estes parâmetros.

## Modelo e parâmetros
- **Modelo:** `seedance_2_0`
- **Duração:** 15s
- **Aspect ratio:** 16:9
- **Resolução alvo:** 1080p
- **Áudio:** nativo (Seedance 2.0)
- **count:** 1

## Imagens de referência (já importadas no Higgsfield)
Ordem narrativa cena 1 → cena 5 (por ordem de upload, mais antigo primeiro):

| Cena | Arquivo local | media_id (Higgsfield) |
|------|---------------|------------------------|
| 1 — Chegada  | `cena1-chegada.png`  | `a1d4f81f-d1a2-40b9-a4cc-70c170c9e040` |
| 2 — Buzz     | `cena2-buzz.png`     | `91c2e758-adc4-4601-b94c-aa5967db3138` |
| 3 — Estúdios | `cena3-estudios.png` | `2822a848-8574-4d51-a3e3-2ee09d3b3374` |
| 4 — QR code  | `cena4-qrcode.png`   | `1b568f43-ebcc-4654-80af-579395cf3943` |
| 5 — Hero     | `cena5-hero.png`     | `1ce5f920-1dd1-4a05-b35d-35cd71fc503f` |

> ⚠️ Conferir o mapeamento cena↔media_id visualmente antes de gerar (a ordem
> acima é por timestamp de upload; se alguma cena estiver trocada, reordenar).

## Prompt cinematográfico (5 beats em 15s)
```
Anúncio cinematográfico de 15 segundos, "Cidade dos Influenciadores".
Beat 1 (0-3s) — CHEGADA: plano aéreo descendo sobre uma cidade vibrante e
moderna ao entardecer, luzes neon começando a acender, sensação de chegada
e expectativa.
Beat 2 (3-6s) — BUZZ: cortes rápidos da energia urbana, pessoas criadoras
de conteúdo, telas e notificações, movimento e euforia.
Beat 3 (6-9s) — ESTÚDIOS: interiores de estúdios de criação, iluminação
profissional, câmeras, criadores trabalhando, atmosfera aspiracional.
Beat 4 (9-12s) — QR CODE: foco no chamado à ação, QR code surgindo de forma
elegante e integrada à cena.
Beat 5 (12-15s) — HERO: plano final heroico da marca/protagonista, logo,
fechamento impactante.
Estilo: cinematográfico, cores saturadas, transições suaves, trilha
energética, áudio nativo.
```

## Como retomar (numa sessão nova)
1. A permissão de geração já está liberada em `.claude/settings.local.json`
   (`defaultMode: bypassPermissions`).
2. Pedir: "retoma a geração do vídeo da Cidade dos Influenciadores".
3. Chamar `generate_video` (modelo + params + as 5 medias acima).
4. Acompanhar o job e pegar o link do vídeo no Higgsfield (aba Library).
