# Receita do vídeo — Cidade dos Influenciadores

> Arquivo para retomar a geração do vídeo após reiniciar a sessão.
> Tudo abaixo já está pronto: basta chamar `generate_video` com estes parâmetros.

## Modelo e parâmetros (chamada `generate_video` completa)
- **Modelo:** `seedance_2_0`
- **mode:** `std`
- **Duração:** 15s
- **Aspect ratio:** 16:9
- **Resolução:** `1080p`
- **bitrate_mode:** `high`
- **generate_audio:** `true` (áudio nativo)
- **genre:** `auto`

## Imagens de referência (já importadas no Higgsfield) + roles
Ordem narrativa cena 1 → cena 5 (por ordem de upload, mais antigo primeiro):

| Cena | Arquivo local | role | media_id (Higgsfield) |
|------|---------------|------|------------------------|
| 1 — Chegada  | `cena1-chegada.png`  | `start_image` | `a1d4f81f-d1a2-40b9-a4cc-70c170c9e040` |
| 2 — Buzz     | `cena2-buzz.png`     | `image`       | `91c2e758-adc4-4601-b94c-aa5967db3138` |
| 3 — Estúdios | `cena3-estudios.png` | `image`       | `2822a848-8574-4d51-a3e3-2ee09d3b3374` |
| 4 — QR code  | `cena4-qrcode.png`   | `image`       | `1b568f43-ebcc-4654-80af-579395cf3943` |
| 5 — Hero     | `cena5-hero.png`     | `end_image`   | `1ce5f920-1dd1-4a05-b35d-35cd71fc503f` |

> ⚠️ Conferir o mapeamento cena↔media_id visualmente antes de gerar (a ordem
> acima é por timestamp de upload; se alguma cena estiver trocada, reordenar).

## Prompt definitivo (usar exatamente este texto)
```
Ultra-realistic cinematic commercial, ONE continuous 15-second sequence inside a premium industrial-style boulevard event called 'Cidade dos Influenciadores'. Warm key lighting, polished reflective floor with soft reflections, natural shallow depth of field, smooth professional camera motion, real-event energy, elegant and organized crowd. Keep the venue architecture, panels, totems, glass studio and visual identity consistent throughout (dark panels with golden city-skyline graphics, ring-light totems).

Five seamless beats, smooth transitions, NO hard cuts:
(0-3s) ARRIVAL: slow forward travelling entering the boulevard; guests arriving, one pulling luggage, staff welcoming, influencers filming with phones, a production crew capturing behind-the-scenes; tall banners read 'CIDADE DOS INFLUENCIADORES'.
(3-6s) SOCIAL BUZZ: gentle lateral pan with a slight push-in; a group of smiling influencers taking a selfie in front of the large 'CIDADE DOS INFLUENCIADORES' panel, a photographer shooting, subtle camera flashes, lanyards, people moving.
(6-9s) LIVE STUDIO: soft push-in toward a glass studio booth with parallax between the outside audience and the presenters; sign reads 'Estudios de Live'; two hosts talking into microphones, a camera recording, ring light on, people watching and filming through the glass.
(9-12s) ACTIVATION: light dolly-in toward a central stand; visitors scanning a QR code, staff handing branded tote bags, a phone showing a sign-up screen; panel text 'Conexao - Fluxo - Experiencia Premium' and 'Escaneie o QR Code'.
(12-15s) HERO FINALE: gentle crane-up and slight zoom-out revealing a big crowd gathered in the boulevard around the central 'CIDADE DOS INFLUENCIADORES' panel, people cheering, phones raised, a videographer filming, triumphant successful-launch energy.

Natural human micro-movements, phones rising, subtle flashes, people walking and talking, staff handing gifts. Consistent warm cinematic color grade and architecture across all beats. Only these on-screen texts may appear, no other text and no invented real brand logos: 'Cidade dos Influenciadores', 'Conexao - Fluxo - Experiencia Premium', 'Estudios de Live', 'Marcas Parceiras', 'Escaneie o QR Code'. Native audio: lively premium event ambience, soft crowd murmur, subtle camera shutter clicks, and an upbeat modern background track, energetic but classy.

Avoid: robotic motion, distorted faces, deformed hands, gibberish text, invented brands, hard cuts, excessive effects, video-game look, artificial appearance, chaotic crowd, sudden architecture changes, breaking the visual identity.
```

## Como retomar (numa sessão nova)
1. A permissão de geração já está liberada em `.claude/settings.local.json`
   (`defaultMode: bypassPermissions`).
2. Pedir: "retoma a geração do vídeo da Cidade dos Influenciadores".
3. Chamar `generate_video` (modelo + params + as 5 medias acima).
4. Acompanhar o job e pegar o link do vídeo no Higgsfield (aba Library).
